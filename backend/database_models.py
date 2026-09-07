from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from database import Base


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    student_id = Column(String, nullable=False)
    is_student = Column(Boolean, nullable=False)
    is_over_18 = Column(Boolean, nullable=False, default=True)
    is_employee = Column(Boolean, nullable=False, default=True)
    revoked = Column(Boolean, nullable=False, default=False)
    issuer = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    claim_signature = Column(String, nullable=False)
    claim_signatures = Column(Text, nullable=True)
    claim_signature_version = Column(Integer, nullable=False, default=2)
    credential_id = Column(String, unique=True, nullable=False)
    issued_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
class ProofRequest(Base):
    __tablename__ = "proof_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, nullable=False)
    requested_claim = Column(String, nullable=False)
    description = Column(String, nullable=False)
    requested_by = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    claims = Column(Text, nullable=True)
    purpose = Column(String, nullable=True)
    audience = Column(String, nullable=True)
    nonce = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    credential_id = Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)
