from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    student_id = Column(String, nullable=False)
    is_student = Column(Boolean, nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    issuer = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    claim_signature = Column(String, nullable=False)
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