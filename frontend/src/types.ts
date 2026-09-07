export interface StudentCredentialInput {
  name: string;
  student_id: string;
  is_student: boolean;
  issuer: string;
  is_over_18?: boolean;
  is_employee?: boolean;
}

export interface IssueCredentialResponse {
  message: string;
  credential_id: string;
  credential: StudentCredentialInput;
  signature: string;
  claim_signature: string;
  issued_at: string;
  expires_at: string;
  public_key: string;
  database_id: number;
}

export interface StoredCredential {
  credential_id: string;
  name: string;
  student_id: string;
  is_student: boolean;
  is_over_18: boolean;
  is_employee: boolean;
  issuer: string;
  signature: string;
  claim_signature: string;
  claim_signatures?: string;
  issued_at: string;
  expires_at: string;
  revoked: boolean;
}

export interface GetCredentialsResponse {
  student_id: string;
  credentials: StoredCredential[];
}

export interface ProofRequestResponse {
  request_id: string;
  claims: string[];
  requested_claim: string;
  description: string;
  requested_by: string;
  purpose: string;
  audience: string;
  nonce: string;
  expires_at: string;
  status: string;
}

export interface ProofPayload {
  request_id: string;
  credential_id: string;
  claims: Record<string, boolean>;
  issuer: string;
  claim_signature: string;
  nonce: string;
  audience: string;
  purpose: string;
}

export interface GenerateProofResponse {
  success: boolean;
  message?: string;
  request_id?: string;
  presentation?: ProofPayload;
}

export interface VerifyProofResponse {
  valid: boolean;
  claim?: string;
  issuer?: string;
  credential_id?: string;
  message: string;
}

export interface RevokeResponse {
  success: boolean;
  credential_id?: string;
  revoked?: boolean;
  message: string;
}

// Thrown by the api layer when the backend can't be reached at all
// (as opposed to reachable-but-returned-an-error, which the backend
// itself communicates via { success: false, message } / { valid: false, message }).
export class ApiUnreachableError extends Error {
  constructor(message = "Could not reach the ProofPass backend. Is it running on the configured API_BASE_URL?") {
    super(message);
    this.name = "ApiUnreachableError";
  }
}
