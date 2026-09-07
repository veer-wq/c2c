import { useEffect, useState } from "react";
import { AlertCircle, ShieldAlert, Stamp } from "lucide-react";
import V01Checkout from "./V01Checkout";
import V02QRModal from "./V02QRModal";
import V03Verified from "./V03Verified";
import V04Failed from "./V04Failed";
import WalletPhone from "./WalletPhone";
import IssuerPanel from "./IssuerPanel";
import { createProofRequest, getProofRequest, revokeCredential } from "./api";
import { ProofRequestResponse, VerifyProofResponse } from "./types";
import { DEMO_ISSUER, DEMO_STUDENT_ID } from "./config";

type Screen = "checkout" | "qr" | "wallet" | "verified" | "failed";

const SCENARIOS = {
  student: { label: "StudentDeals", claims: ["is_student"], audience: "studentdeals", purpose: "student_discount", claimLabel: "student status", title: "Student status confirmed", status: "Active student", result: "Discount applied", action: "Continue to payment" },
  age: { label: "AgeGate", claims: ["is_over_18"], audience: "agegate", purpose: "age_restricted_entry", claimLabel: "age ≥ 18", title: "Age Verified", status: "18+ eligibility confirmed", result: "Age-gated access granted", action: "Continue" },
  employee: { label: "Event Entry", claims: ["is_employee"], audience: "event-entry", purpose: "employee_event_access", claimLabel: "employee status", title: "Employee Verified", status: "Employee eligibility confirmed", result: "Event access granted", action: "Enter event" },
} as const;

const REQUESTED_BY = "StudentDeals";
const REQUEST_DESCRIPTION = "Proof of student status";
const DISCOUNT_LABEL = "−$33.99/mo";

export default function DemoApp() {
  const [screen, setScreen] = useState<Screen>("checkout");
  const [showIssuer, setShowIssuer] = useState(false);
  const [showSecurityDemo, setShowSecurityDemo] = useState(false);
  const [tamperClaim, setTamperClaim] = useState(false);
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("student");

  const [requestId, setRequestId] = useState<string | null>(null);
  const [proofRequest, setProofRequest] = useState<ProofRequestResponse | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [verifyResult, setVerifyResult] = useState<VerifyProofResponse | null>(null);

  const [lastCredentialId, setLastCredentialId] = useState<string | null>(null);
  const [revokeStatus, setRevokeStatus] = useState<string | null>(null);

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("proofpass_request");
    if (!encoded) return;
    try {
      const transport = JSON.parse(atob(encoded));
      getProofRequest(transport.request_id).then((request) => {
        if (request.nonce !== transport.nonce) throw new Error("QR request nonce mismatch");
        setRequestId(request.request_id); setProofRequest(request); setScreen("wallet");
      }).catch((error) => { setRequestError(error.message); setScreen("failed"); });
    } catch { setRequestError("Invalid ProofPass QR request"); setScreen("failed"); }
  }, []);

  useEffect(() => {
    if (screen !== "qr" || !proofRequest) return;
    const timer = window.setInterval(async () => {
      try {
        const current = await getProofRequest(proofRequest.request_id);
        if (current.status === "completed") {
          setVerifyResult({ valid: true, claim: `${proofRequest.claims[0]} = True`, message: "Required claim verified — no personal data shared" });
          setScreen("verified");
        }
      } catch { /* retain the manual wallet fallback after transient errors */ }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, proofRequest]);

  async function handleStartVerification() {
    setScreen("qr");
    setRequestLoading(true);
    setRequestError(null);
    setRequestId(null);
    try {
      const res = await createProofRequest(SCENARIOS[scenario]);
      setRequestId(res.request_id);
      setProofRequest(res);
    } catch (err: any) {
      setRequestError(err?.message || "Could not reach the ProofPass backend");
    } finally {
      setRequestLoading(false);
    }
  }

  function resetToCheckout() {
    setScreen("checkout");
    setRequestId(null);
    setProofRequest(null);
    setRequestError(null);
    setVerifyResult(null);
  }

  function handleApproved(result: VerifyProofResponse) {
    setVerifyResult(result);
    setScreen(result.valid ? "verified" : "failed");
  }

  return (
    <div className="min-h-full" style={{ background: "var(--background)", position: "relative" }}>
      {/* Demo control bar — not part of the product UI, just for running the hackathon demo */}
      <div
        className="flex items-center justify-end gap-2 px-4 py-2 text-xs"
        style={{ background: "#0a1522", color: "#94a3b8" }}
      >
        <span className="mr-auto font-medium tracking-wide">PROVE THE FACT. NOT THE IDENTITY.</span>
        <button
          onClick={() => setShowIssuer((v) => !v)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors"
          style={{ background: showIssuer ? "#1e3a5f" : "transparent", color: "#e2e8f0" }}
        >
          <Stamp size={12} /> Issuer
        </button>
        <button
          onClick={() => setShowSecurityDemo((v) => !v)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors"
          style={{ background: showSecurityDemo ? "#1e3a5f" : "transparent", color: "#e2e8f0" }}
        >
          <ShieldAlert size={12} /> Security demo
        </button>
      </div>

      {showIssuer && (
        <div className="px-4 py-4 max-w-sm ml-auto">
          <IssuerPanel onIssued={(res) => setLastCredentialId(res.credential_id)} />
        </div>
      )}

      {showSecurityDemo && (
        <div
          className="mx-4 mt-2 mb-2 rounded-lg p-4 text-xs flex flex-col gap-3 max-w-md ml-auto"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--foreground)" }}>
            Security demo (dev controls — not part of the normal flow)
          </p>

          <label className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <input
              type="checkbox"
              checked={tamperClaim}
              onChange={(e) => setTamperClaim(e.target.checked)}
            />
            Tamper the claim before verifying (sends is_student = false with the original
            signature). The backend should reject this — the Ed25519 signature won't
            match.
          </label>

          <div className="flex items-center gap-2">
            <button
              disabled={!lastCredentialId}
              onClick={async () => {
                if (!lastCredentialId) return;
                setRevokeStatus(null);
                try {
                  const res = await revokeCredential(lastCredentialId);
                  setRevokeStatus(res.message);
                } catch (err: any) {
                  setRevokeStatus(err?.message || "Revoke failed");
                }
              }}
              className="rounded px-3 py-1.5 font-semibold disabled:opacity-50"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              Revoke last issued credential
            </button>
            {lastCredentialId && (
              <span style={{ color: "var(--muted-foreground)" }}>{lastCredentialId}</span>
            )}
          </div>
          {revokeStatus && <p style={{ color: "var(--muted-foreground)" }}>{revokeStatus}</p>}
          {!lastCredentialId && (
            <p style={{ color: "var(--muted-foreground)" }}>
              Issue a credential first to enable revocation.
            </p>
          )}
        </div>
      )}

      {screen === "checkout" && (
        <>
          <div className="flex justify-center gap-2 px-4 pt-4">
            {(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((key) => (
              <button key={key} onClick={() => setScenario(key)} className="rounded-full px-3 py-1 text-xs" style={{ background: scenario === key ? "#0A84FF" : "#1e293b", color: "white" }}>{SCENARIOS[key].label}</button>
            ))}
          </div>
          <V01Checkout onVerify={handleStartVerification} verifierName={SCENARIOS[scenario].label} claimLabel={SCENARIOS[scenario].claimLabel} purposeLabel={SCENARIOS[scenario].result.toLowerCase()} />
        </>
      )}

      {screen === "verified" && verifyResult && (
        <V03Verified
          issuer={verifyResult.issuer || DEMO_ISSUER}
          credentialId={verifyResult.credential_id || "—"}
          message={verifyResult.message}
          discountLabel={SCENARIOS[scenario].result}
          title={SCENARIOS[scenario].title}
          statusLabel={SCENARIOS[scenario].status}
          actionLabel={SCENARIOS[scenario].action}
          onContinue={resetToCheckout}
        />
      )}

      {screen === "failed" && verifyResult && (
        <V04Failed reason={verifyResult.message} onRetry={resetToCheckout} />
      )}
      {screen === "failed" && !verifyResult && (
        <V04Failed reason="Something went wrong contacting the backend." onRetry={resetToCheckout} />
      )}

      {screen === "qr" && (
        <V02QRModal
          requestId={requestId}
          proofRequest={proofRequest}
          loading={requestLoading}
          error={requestError}
          onClose={resetToCheckout}
          onOpenWallet={() => setScreen("wallet")}
        />
      )}

      {screen === "wallet" && requestId && proofRequest && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <WalletPhone
            studentId={DEMO_STUDENT_ID}
            proofRequest={proofRequest}
            tamperClaim={tamperClaim}
            onApproved={handleApproved}
            onDeclined={resetToCheckout}
          />
        </div>
      )}

      {screen === "wallet" && (!requestId || !proofRequest) && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", zIndex: 100 }}
        >
          <div className="rounded-lg p-6 flex items-center gap-2" style={{ background: "var(--card)" }}>
            <AlertCircle size={16} style={{ color: "#ef4444" }} />
            <span className="text-sm" style={{ color: "var(--foreground)" }}>
              No active verification request.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
