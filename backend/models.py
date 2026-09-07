from typing import Any

from pydantic import BaseModel, Field


class StudentCredential(BaseModel):
    name: str
    student_id: str
    is_student: bool
    issuer: str
    is_over_18: bool = True
    is_employee: bool = True


class CredentialVerification(BaseModel):
    credential: StudentCredential
    signature: str


class ProofRequestInput(BaseModel):
    claims: list[str] = Field(default_factory=lambda: ["is_student"])
    purpose: str = "student_discount"
    audience: str = "studentdeals"
    expires_in_seconds: int = Field(default=300, ge=30, le=900)


class Presentation(BaseModel):
    """Minimal, request-bound disclosure sent by the wallet to a verifier."""
    request_id: str
    credential_id: str
    claims: dict[str, Any]
    issuer: str
    claim_signature: str
    nonce: str
    audience: str
    purpose: str


class PresentationResult(BaseModel):
    success: bool
    message: str | None = None
    presentation: Presentation | None = None
