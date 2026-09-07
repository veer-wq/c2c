import json
import secrets
import uuid
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from crypto_utils import generate_keys, sign_data, verify_signature
from database import Base, SessionLocal, engine
from database_models import Credential, ProofRequest
from issuer import ISSUER_PRIVATE_KEY, ISSUER_PUBLIC_KEY
from models import CredentialVerification, Presentation, ProofRequestInput, StudentCredential

app = FastAPI(title="ProofPass API")
Base.metadata.create_all(bind=engine)


def migrate_sqlite() -> None:
    additions = {
        "credentials": {"claim_signature_version": "INTEGER NOT NULL DEFAULT 1", "is_over_18": "BOOLEAN NOT NULL DEFAULT 1", "is_employee": "BOOLEAN NOT NULL DEFAULT 1", "claim_signatures": "TEXT"},
        "proof_requests": {
            "claims": "TEXT", "purpose": "VARCHAR", "audience": "VARCHAR", "nonce": "VARCHAR",
            "expires_at": "DATETIME", "credential_id": "VARCHAR", "completed_at": "DATETIME",
        },
    }
    with engine.begin() as conn:
        for table, fields in additions.items():
            existing = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}
            for name, definition in fields.items():
                if name not in existing:
                    conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")


migrate_sqlite()


def upgrade_legacy_claim_signatures() -> None:
    """Keep MVP credentials usable while moving them to credential-bound claims."""
    db = SessionLocal()
    legacy = db.query(Credential).filter(Credential.claim_signature_version != 2).all()
    for credential in legacy:
        credential.claim_signature = sign_data(
            ISSUER_PRIVATE_KEY,
            claim_bytes(credential.credential_id, "is_student", credential.is_student, credential.issuer),
        ).hex()
        credential.claim_signature_version = 2
        credential.claim_signatures = json.dumps({"is_student": credential.claim_signature})
    if legacy:
        db.commit()
    db.close()


# The LAN demo has no cookie/session authentication. Any HTTP(S) frontend
# origin may submit a request; proof validity still relies on signed claims
# plus nonce, audience, purpose, expiry, credential binding, and replay checks.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])


def claim_bytes(credential_id: str, claim: str, value: bool, issuer: str) -> bytes:
    """Versioned, canonical issuer-signed selective claim bound to credential ID."""
    return f"v2|{credential_id}|{claim}|{str(value).lower()}|{issuer}".encode()


upgrade_legacy_claim_signatures()


def request_json(item: ProofRequest) -> dict:
    return {"request_id": item.request_id, "claims": json.loads(item.claims), "requested_claim": item.requested_claim,
            "description": item.description, "requested_by": item.requested_by, "purpose": item.purpose,
            "audience": item.audience, "nonce": item.nonce, "expires_at": item.expires_at, "status": item.status}


def invalid(message: str) -> dict:
    return {"valid": False, "message": message}


@app.get("/")
def root(): return {"message": "ProofPass backend is running!"}


@app.get("/test-crypto")
def test_crypto():
    private, public = generate_keys(); data = b"Student = True"
    return {"data": data.decode(), "signature_valid": verify_signature(public, data, sign_data(private, data))}


@app.post("/credential")
def create_credential(credential: StudentCredential):
    credential_id = "CRED-" + uuid.uuid4().hex[:8].upper()
    issued_at, expires_at = datetime.utcnow(), datetime.utcnow() + timedelta(days=365)
    full_data = f"{credential.name}|{credential.student_id}|{credential.is_student}|{credential.issuer}".encode()
    signature = sign_data(ISSUER_PRIVATE_KEY, full_data)
    signatures = {claim: sign_data(ISSUER_PRIVATE_KEY, claim_bytes(credential_id, claim, getattr(credential, claim), credential.issuer)).hex() for claim in ("is_student", "is_over_18", "is_employee")}
    claim_signature = signatures["is_student"]
    db = SessionLocal()
    item = Credential(credential_id=credential_id, name=credential.name, student_id=credential.student_id, is_student=credential.is_student, is_over_18=credential.is_over_18, is_employee=credential.is_employee, issuer=credential.issuer, signature=signature.hex(), claim_signature=claim_signature, claim_signatures=json.dumps(signatures), claim_signature_version=2, issued_at=issued_at, expires_at=expires_at)
    db.add(item); db.commit(); db.refresh(item); db.close()
    return {"message": "Credential issued and stored", "credential_id": credential_id, "credential": credential, "signature": signature.hex(), "claim_signature": claim_signature, "claim_signatures": json.dumps(signatures), "issued_at": issued_at, "expires_at": expires_at, "public_key": ISSUER_PUBLIC_KEY.public_bytes_raw().hex(), "database_id": item.id}


@app.get("/credentials/{student_id}")
def get_credentials(student_id: str):
    db = SessionLocal(); rows = db.query(Credential).filter(Credential.student_id == student_id).all()
    fields = ("credential_id", "name", "student_id", "is_student", "is_over_18", "is_employee", "issuer", "signature", "claim_signature", "claim_signatures", "issued_at", "expires_at", "revoked")
    result = [{field: getattr(row, field) for field in fields} for row in rows]; db.close()
    return {"student_id": student_id, "credentials": result}


@app.post("/proof-request")
def create_proof_request(payload: ProofRequestInput = ProofRequestInput()):
    supported = {"is_student", "is_over_18", "is_employee"}
    if len(payload.claims) != 1 or payload.claims[0] not in supported:
        return {"success": False, "message": "Request exactly one supported minimal claim"}
    claim = payload.claims[0]
    request = ProofRequest(request_id="REQ-" + uuid.uuid4().hex[:12].upper(), requested_claim=claim, description=f"Proof of {claim.replace('is_', '').replace('_', ' ')}", requested_by=payload.audience, status="pending", claims=json.dumps(payload.claims), purpose=payload.purpose, audience=payload.audience, nonce=secrets.token_urlsafe(32), expires_at=datetime.utcnow() + timedelta(seconds=payload.expires_in_seconds))
    db = SessionLocal(); db.add(request); db.commit(); db.refresh(request); result = request_json(request); db.close(); return result


@app.get("/proof-request/{request_id}")
def get_proof_request(request_id: str):
    """QR/deep-link transport boundary; the wallet still validates every binding on presentation."""
    db = SessionLocal(); request = db.query(ProofRequest).filter(ProofRequest.request_id == request_id).first()
    if not request: db.close(); return {"success": False, "message": "Proof request not found"}
    result = request_json(request); db.close(); return result


def validate_presentation(db, presentation: Presentation, require_accepted: bool = False) -> tuple[Credential | None, str | None]:
    request = db.query(ProofRequest).filter(ProofRequest.request_id == presentation.request_id).first()
    if not request: return None, "Proof request not found"
    if request.status != "pending": return None, "Proof request has already been used"
    if request.expires_at < datetime.utcnow(): return None, "Proof request has expired"
    if presentation.nonce != request.nonce: return None, "Nonce does not match this request"
    if presentation.audience != request.audience: return None, "Audience does not match this verifier"
    if presentation.purpose != request.purpose: return None, "Purpose does not match this request"
    if set(presentation.claims) != set(json.loads(request.claims)): return None, "Requested claims do not match"
    credential = db.query(Credential).filter(Credential.credential_id == presentation.credential_id).first()
    if not credential: return None, "Credential not found"
    if require_accepted and request.credential_id != credential.credential_id: return None, "Credential binding does not match accepted presentation"
    if credential.revoked: return None, "Credential has been revoked"
    if credential.expires_at < datetime.utcnow(): return None, "Credential has expired"
    claim = request.requested_claim
    if credential.issuer != presentation.issuer or presentation.claims.get(claim) != getattr(credential, claim): return None, "Credential data was tampered with"
    try: signature = bytes.fromhex(presentation.claim_signature)
    except ValueError: return None, "Invalid signature format"
    if not verify_signature(ISSUER_PUBLIC_KEY, claim_bytes(credential.credential_id, claim, getattr(credential, claim), credential.issuer), signature): return None, "Issuer signature is invalid"
    return credential, None


@app.post("/proof")
def create_presentation(presentation: Presentation):
    """Wallet boundary: accepts an explicit credential reference, never a student ID."""
    db = SessionLocal(); credential, error = validate_presentation(db, presentation)
    if error: db.close(); return {"success": False, "message": error}
    request = db.query(ProofRequest).filter(ProofRequest.request_id == presentation.request_id).first()
    request.credential_id = credential.credential_id; db.commit(); db.close()
    return {"success": True, "message": "Wallet presentation accepted", "presentation": presentation.model_dump()}


@app.post("/verify-proof")
def verify_proof(presentation: Presentation):
    db = SessionLocal(); credential, error = validate_presentation(db, presentation, require_accepted=True)
    if error: db.close(); return invalid(error)
    request = db.query(ProofRequest).filter(ProofRequest.request_id == presentation.request_id).first()
    claim = request.requested_claim
    if not getattr(credential, claim): db.close(); return invalid(f"{claim} is false")
    issuer, credential_id = credential.issuer, credential.credential_id
    request.status, request.completed_at = "completed", datetime.utcnow(); db.commit(); db.close()
    return {"valid": True, "claim": f"{claim} = True", "issuer": issuer, "credential_id": credential_id, "message": "Required claim verified — no personal data shared"}


@app.post("/revoke/{credential_id}")
def revoke_credential(credential_id: str):
    db = SessionLocal(); credential = db.query(Credential).filter(Credential.credential_id == credential_id).first()
    if not credential: db.close(); return {"success": False, "message": "Credential not found"}
    if credential.revoked: db.close(); return {"success": False, "message": "Credential is already revoked"}
    credential.revoked = True; db.commit(); db.close()
    return {"success": True, "credential_id": credential_id, "revoked": True, "message": "Credential revoked successfully"}


@app.post("/verify")
def verify_credential(request: CredentialVerification):
    data = f"{request.credential.name}|{request.credential.student_id}|{request.credential.is_student}|{request.credential.issuer}".encode()
    try: valid = verify_signature(ISSUER_PUBLIC_KEY, data, bytes.fromhex(request.signature))
    except ValueError: valid = False
    return {"valid": valid, "message": "Credential is authentic" if valid else "Credential is invalid or has been tampered with"}
