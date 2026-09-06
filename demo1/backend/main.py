from fastapi import FastAPI
from datetime import datetime, timedelta

from database import SessionLocal
from database_models import Credential, ProofRequest
from models import StudentCredential, CredentialVerification
from crypto_utils import generate_keys, sign_data, verify_signature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
import issuer
import uuid
from issuer import ISSUER_PRIVATE_KEY, ISSUER_PUBLIC_KEY
from database import engine, Base
import database_models


app = FastAPI(title="ProofPass API")
Base.metadata.create_all(bind=engine)

@app.get("/debug-issuer")
def debug_issuer():
    return {
        "issuer_file": issuer.__file__,
        "public_key": ISSUER_PUBLIC_KEY.public_bytes_raw().hex()
    }


@app.get("/")
def root():
    return {
        "message": "ProofPass backend is running!"
    }


@app.get("/test-crypto")
def test_crypto():
    private_key, public_key = generate_keys()

    data = b"Student = True"

    signature = sign_data(private_key, data)

    valid = verify_signature(
        public_key,
        data,
        signature
    )

    return {
        "data": "Student = True",
        "signature_valid": valid
    }
@app.post("/credential")
def create_credential(credential: StudentCredential):

    # Generate credential metadata
    credential_id = "CRED-" + uuid.uuid4().hex[:8].upper()

    issued_at = datetime.utcnow()
    expires_at = issued_at + timedelta(days=365)

    # Full credential data
    data = (
        f"{credential.name}|"
        f"{credential.student_id}|"
        f"{credential.is_student}|"
        f"{credential.issuer}"
    ).encode()

    # Signature for the complete credential
    signature = sign_data(
        ISSUER_PRIVATE_KEY,
        data
    )

    # Signature only for the claim we want to prove
    claim_data = (
        f"{credential.is_student}|"
        f"{credential.issuer}"
    ).encode()

    claim_signature = sign_data(
        ISSUER_PRIVATE_KEY,
        claim_data
    )

    db = SessionLocal()

    new_credential = Credential(
        credential_id=credential_id,
        name=credential.name,
        student_id=credential.student_id,
        is_student=credential.is_student,
        issuer=credential.issuer,
        signature=signature.hex(),
        claim_signature=claim_signature.hex(),
        issued_at=issued_at,
        expires_at=expires_at
    )

    db.add(new_credential)
    db.commit()
    db.refresh(new_credential)
    db.close()

    return {
        "message": "Credential issued and stored",
        "credential_id": credential_id,
        "credential": credential,
        "signature": signature.hex(),
        "claim_signature": claim_signature.hex(),
        "issued_at": issued_at,
        "expires_at": expires_at,
        "public_key": ISSUER_PUBLIC_KEY.public_bytes_raw().hex(),
        "database_id": new_credential.id
    }
@app.get("/credentials/{student_id}")
def get_credentials(student_id: str):
    db = SessionLocal()

    credentials = (
        db.query(Credential)
        .filter(Credential.student_id == student_id)
        .all()
    )

    db.close()

    return {
        "student_id": student_id,
        "credentials": [
            {
                "credential_id": credential.credential_id,
                "name": credential.name,
                "student_id": credential.student_id,
                "is_student": credential.is_student,
                "issuer": credential.issuer,
                "signature": credential.signature,
                "claim_signature": credential.claim_signature,
                "issued_at": credential.issued_at,
                "expires_at": credential.expires_at,
                "revoked": credential.revoked
            }
            for credential in credentials
        ]
    }
@app.post("/proof-request")
def create_proof_request():

    request_id = "REQ-" + uuid.uuid4().hex[:8].upper()

    db = SessionLocal()

    new_request = ProofRequest(
        request_id=request_id,
        requested_claim="is_student",
        description="Prove that you are a student",
        requested_by="StudentDeals",
        status="pending"
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    db.close()

    return {
        "request_id": new_request.request_id,
        "requested_claim": new_request.requested_claim,
        "description": new_request.description,
        "requested_by": new_request.requested_by,
        "status": new_request.status
    }
@app.post("/proof")
def generate_proof(student_id: str, request_id: str):

    db = SessionLocal()

    # Find the proof request
    proof_request = (
        db.query(ProofRequest)
        .filter(ProofRequest.request_id == request_id)
        .first()
    )

    # Find the student's credential
    credential = (
        db.query(Credential)
        .filter(Credential.student_id == student_id)
        .first()
    )

    if not proof_request:
        db.close()
        return {
            "success": False,
            "message": "Proof request not found"
        }

    if proof_request.status != "pending":
        db.close()
        return {
            "success": False,
            "message": "Proof request is no longer pending"
        }

    if not credential:
        db.close()
        return {
            "success": False,
            "message": "Credential not found"
        }
    if credential.expires_at < datetime.utcnow():
        db.close()
        return {
            "success": False,
            "message": "Credential has expired"
        }
    if credential.revoked:
        db.close()
        return {
            "success": False,
            "message": "Credential has been revoked"
        }

    db.close()

    return {
        "success": True,
        "request_id": request_id,
        "proof": {
    "credential_id": credential.credential_id,
    "is_student": credential.is_student,
    "issuer": credential.issuer,
    "claim_signature": credential.claim_signature
}
    }
@app.post("/verify-proof")
def verify_proof(
    is_student: bool,
    issuer: str,
    claim_signature: str,
    request_id: str,
    credential_id: str
):
    db = SessionLocal()

    # Find the proof request
    proof_request = (
        db.query(ProofRequest)
        .filter(ProofRequest.request_id == request_id)
        .first()
    )

    if not proof_request:
        db.close()
        return {
            "valid": False,
            "message": "Proof request not found"
        }
    if proof_request.status != "pending":
        db.close()
        return {
            "valid": False,
            "message": "Proof request has already been used"
        }

    # Check requested claim
    if proof_request.requested_claim != "is_student":
        db.close()
        return {
            "valid": False,
            "message": "Unsupported claim requested"
        }

    # Find the EXACT credential used for the proof
    credential = (
        db.query(Credential)
        .filter(Credential.credential_id == credential_id)
        .first()
    )

    if not credential:
        db.close()
        return {
            "valid": False,
            "message": "Credential not found"
        }

    # Check issuer
    if credential.issuer != issuer:
        db.close()
        return {
            "valid": False,
            "message": "Issuer does not match credential"
        }

    # Check expiry
    if credential.expires_at < datetime.utcnow():
        db.close()
        return {
            "valid": False,
            "message": "Credential has expired"
        }

    # Check revocation
    if credential.revoked:
        db.close()
        return {
            "valid": False,
            "message": "Credential has been revoked"
        }

    # Verify cryptographic signature
    claim_data = f"{is_student}|{issuer}".encode()

    try:
        signature = bytes.fromhex(claim_signature)
    except ValueError:
        db.close()
        return {
            "valid": False,
            "message": "Invalid signature format"
        }

    valid = verify_signature(
        ISSUER_PUBLIC_KEY,
        claim_data,
        signature
    )

    if valid and is_student:
        proof_request.status = "completed"
        db.commit()

    db.close()

    db.close()

    return {
        "valid": valid,
        "claim": "Student = True" if is_student else "Student = False",
        "issuer": issuer,
        "credential_id": credential_id,
        "message": (
            "Student verified — no personal data shared"
            if valid and is_student
            else "Proof is invalid"
        )
    }
@app.post("/revoke/{credential_id}")
def revoke_credential(credential_id: str):

    db = SessionLocal()

    credential = (
        db.query(Credential)
        .filter(Credential.credential_id == credential_id)
        .first()
    )

    if not credential:
        db.close()
        return {
            "success": False,
            "message": "Credential not found"
        }

    if credential.revoked:
        db.close()
        return {
            "success": False,
            "message": "Credential is already revoked"
        }

    credential.revoked = True

    db.commit()
    db.refresh(credential)
    db.close()

    return {
        "success": True,
        "credential_id": credential.credential_id,
        "revoked": credential.revoked,
        "message": "Credential revoked successfully"
    }
@app.post("/verify")
def verify_credential(request: CredentialVerification):
    data = (
        f"{request.credential.name}|"
        f"{request.credential.student_id}|"
        f"{request.credential.is_student}|"
        f"{request.credential.issuer}"
    ).encode()

    signature = bytes.fromhex(request.signature)

    valid = verify_signature(
        ISSUER_PUBLIC_KEY,
        data,
        signature
    )

    return {
        "valid": valid,
        "message": "Credential is authentic"
        if valid
        else "Credential is invalid or has been tampered with"
    }