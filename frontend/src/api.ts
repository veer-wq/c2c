import { API_BASE_URL } from "./config";
import {
  ApiUnreachableError,
  GenerateProofResponse, ProofPayload, StoredCredential,
  GetCredentialsResponse,
  IssueCredentialResponse,
  ProofRequestResponse,
  RevokeResponse,
  StudentCredentialInput,
  VerifyProofResponse,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (err) {
    // Network-level failure: backend not running, wrong port, CORS block, etc.
    throw new ApiUnreachableError();
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    const message =
      (body && (body.detail || body.message)) ||
      `Request failed (HTTP ${res.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return body as T;
}

/** ISSUER: create a signed credential. POST /credential */
export function issueCredential(
  data: StudentCredentialInput
): Promise<IssueCredentialResponse> {
  return request<IssueCredentialResponse>("/credential", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** WALLET: load credentials for a student. GET /credentials/{student_id} */
export function getCredentials(studentId: string): Promise<GetCredentialsResponse> {
  return request<GetCredentialsResponse>(
    `/credentials/${encodeURIComponent(studentId)}`
  );
}

/** STUDENTDEALS: start a verification session. POST /proof-request */
export function createProofRequest(input = { claims: ["is_student"], purpose: "student_discount", audience: "studentdeals" }): Promise<ProofRequestResponse> {
  return request<ProofRequestResponse>("/proof-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

export function getProofRequest(requestId: string): Promise<ProofRequestResponse> {
  return request<ProofRequestResponse>(`/proof-request/${encodeURIComponent(requestId)}`);
}

/** WALLET (on Approve): generate a proof for a pending request. POST /proof */
export function generateProof(
  credential: StoredCredential,
  proofRequest: ProofRequestResponse
): Promise<GenerateProofResponse> {
  const claim = proofRequest.claims[0];
  const signatures = credential.claim_signatures ? JSON.parse(credential.claim_signatures) : { is_student: credential.claim_signature };
  const presentation: ProofPayload = { request_id: proofRequest.request_id, credential_id: credential.credential_id, claims: { [claim]: Boolean(credential[claim as keyof StoredCredential]) }, issuer: credential.issuer, claim_signature: signatures[claim], nonce: proofRequest.nonce, audience: proofRequest.audience, purpose: proofRequest.purpose };
  return request<GenerateProofResponse>("/proof", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(presentation) });
}

/**
 * VERIFIER (StudentDeals side): verify a proof against the backend.
 * POST /verify-proof
 * `overrideIsStudent` exists only for the built-in tampering demo, so a
 * caller can show that flipping the claim after signing breaks the Ed25519
 * signature check server-side.
 */
export function verifyProof(
  presentation: ProofPayload
): Promise<VerifyProofResponse> {
  return request<VerifyProofResponse>("/verify-proof", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(presentation) });
}

/** ISSUER: revoke a credential (used by the security demo panel). POST /revoke/{credential_id} */
export function revokeCredential(credentialId: string): Promise<RevokeResponse> {
  return request<RevokeResponse>(
    `/revoke/${encodeURIComponent(credentialId)}`,
    { method: "POST" }
  );
}
