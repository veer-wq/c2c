from pydantic import BaseModel


class StudentCredential(BaseModel):
    name: str
    student_id: str
    is_student: bool
    issuer: str


class CredentialVerification(BaseModel):
    credential: StudentCredential
    signature: str
    signature: str