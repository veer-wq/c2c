import unittest
from datetime import datetime, timedelta

from database import SessionLocal
from database_models import Credential
from main import create_credential, create_presentation, create_proof_request, get_proof_request, revoke_credential, verify_proof
from models import Presentation, ProofRequestInput, StudentCredential


class ProofPassRound2Tests(unittest.TestCase):
    def issue(self):
        return create_credential(StudentCredential(name="Test User", student_id="TEST-" + str(datetime.utcnow().timestamp()), is_student=True, issuer="Test University"))

    def request(self, audience="verifier-a", purpose="discount"):
        return create_proof_request(ProofRequestInput(claims=["is_student"], audience=audience, purpose=purpose, expires_in_seconds=60))

    def proof(self, issued, request):
        return Presentation(request_id=request["request_id"], credential_id=issued["credential_id"], claims={"is_student": True}, issuer="Test University", claim_signature=issued["claim_signature"], nonce=request["nonce"], audience=request["audience"], purpose=request["purpose"])

    def accept(self, proof):
        result = create_presentation(proof)
        self.assertTrue(result["success"], result)

    def test_valid_end_to_end_and_replay_rejected(self):
        proof = self.proof(self.issue(), self.request()); self.accept(proof)
        self.assertTrue(verify_proof(proof)["valid"])
        self.assertFalse(verify_proof(proof)["valid"])

    def test_tampered_claim_rejected(self):
        proof = self.proof(self.issue(), self.request()); proof.claims = {"is_student": False}
        self.assertFalse(create_presentation(proof)["success"])

    def test_wrong_nonce_audience_and_purpose_rejected(self):
        for field, value in (("nonce", "wrong"), ("audience", "verifier-b"), ("purpose", "different")):
            proof = self.proof(self.issue(), self.request()); setattr(proof, field, value)
            self.assertFalse(create_presentation(proof)["success"], field)

    def test_wrong_credential_and_invalid_signature_rejected(self):
        proof = self.proof(self.issue(), self.request()); proof.credential_id = "CRED-NOT-REAL"
        self.assertFalse(create_presentation(proof)["success"])
        proof = self.proof(self.issue(), self.request()); proof.claim_signature = "00" * 64
        self.assertFalse(create_presentation(proof)["success"])

    def test_expired_and_revoked_credential_rejected(self):
        issued, request = self.issue(), self.request(); db = SessionLocal(); item = db.query(Credential).filter_by(credential_id=issued["credential_id"]).first(); item.expires_at = datetime.utcnow() - timedelta(seconds=1); db.commit(); db.close()
        self.assertFalse(create_presentation(self.proof(issued, request))["success"])
        issued, request = self.issue(), self.request(); revoke_credential(issued["credential_id"])
        self.assertFalse(create_presentation(self.proof(issued, request))["success"])

    def test_verifier_a_proof_cannot_be_used_by_verifier_b(self):
        issued, request_a, request_b = self.issue(), self.request("verifier-a"), self.request("verifier-b")
        proof = self.proof(issued, request_a); self.accept(proof)
        # A copied presentation retains verifier-A's nonce and audience; simply pointing it
        # at verifier-B's request ID must fail request binding validation.
        proof.request_id = request_b["request_id"]
        self.assertFalse(create_presentation(proof)["success"])

    def test_agegate_and_employee_claims_use_the_same_protocol(self):
        issued = self.issue()
        for claim, audience, purpose in (("is_over_18", "agegate", "age_restricted_entry"), ("is_employee", "event-entry", "employee_event_access")):
            request = create_proof_request(ProofRequestInput(claims=[claim], audience=audience, purpose=purpose, expires_in_seconds=60))
            signatures = __import__("json").loads(issued["claim_signatures"])
            proof = Presentation(request_id=request["request_id"], credential_id=issued["credential_id"], claims={claim: True}, issuer="Test University", claim_signature=signatures[claim], nonce=request["nonce"], audience=audience, purpose=purpose)
            self.assertEqual(get_proof_request(request["request_id"])["nonce"], request["nonce"])
            self.accept(proof); self.assertTrue(verify_proof(proof)["valid"])


if __name__ == "__main__":
    unittest.main()
