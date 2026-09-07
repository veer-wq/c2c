import { Shield, X, Eye, Loader2 } from "lucide-react";
import { ProofRequestResponse } from "./types";
import { WALLET_PUBLIC_URL } from "./config";

interface Props {
  requestId: string | null;
  proofRequest: ProofRequestResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenWallet: () => void;
}

const claimDetails: Record<string, { title: string; shared: string }> = {
  is_student: { title: "Student Status", shared: "Student Status = TRUE" },
  is_over_18: { title: "Age ≥ 18", shared: "Age ≥ 18 = TRUE" },
  is_employee: { title: "Employee / Event Eligibility", shared: "Employee Status = TRUE" },
};

/**
 * Simulated "QR code" step. There's no camera scanning in this MVP -- the
 * request_id returned by POST /proof-request stands in for the QR/session
 * token, and "scanning" it is simulated by opening the wallet directly.
 */
export default function V02QRModal({ requestId, proofRequest, loading, error, onClose, onOpenWallet }: Props) {
  const transport = proofRequest ? btoa(JSON.stringify({ version: 1, request_id: proofRequest.request_id, nonce: proofRequest.nonce })) : "";
  const walletUrl = `${WALLET_PUBLIC_URL.replace(/\/$/, "")}${window.location.pathname}?proofpass_request=${encodeURIComponent(transport)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(walletUrl)}`;
  const details = proofRequest ? claimDetails[proofRequest.claims[0]] || { title: proofRequest.claims[0], shared: `${proofRequest.claims[0]} = TRUE` } : null;
  const requestedInfo = details ? [
    { label: "Claim requested", detail: details.title },
    { label: "Shared on success", detail: details.shared },
    { label: "Never shared", detail: "Name, Student ID, DOB, photo" },
  ] : [];
  return (
    <div
      className="min-h-full flex items-center justify-center relative"
      style={{ background: "var(--background)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, var(--border) 40px)",
          opacity: 0.4,
        }}
      />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4" style={{ zIndex: 1 }}>
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--muted-foreground)", opacity: 0.5 }}
        >
          {proofRequest?.audience || "ProofPass"} · Verification
        </span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>
          Verification in progress…
        </span>
      </div>

      <div className="absolute inset-0" style={{ background: "rgba(13,13,13,0.45)", zIndex: 2 }} onClick={onClose} />

      <div
        className="relative rounded-xl shadow-2xl w-full max-w-sm mx-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)", zIndex: 10 }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 rounded-t-xl"
          style={{ background: "var(--primary)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <Shield size={16} style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase leading-none" style={{ color: "var(--accent)" }}>
                ProofPass
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Verification Request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.5)" }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }}>
              Scan to verify {details?.title || "your eligibility"}
            </h2>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Open the ProofPass Wallet to review and approve this request.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8" style={{ color: "var(--muted-foreground)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs">Creating verification request…</span>
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
            >
              {error}
            </div>
          )}

          {requestId && proofRequest && !loading && (
            <>
              <div
                className="rounded-lg flex flex-col items-center justify-center mx-auto gap-2 py-6"
                style={{ width: 220, border: "1px solid var(--border)", background: "var(--background)" }}
              >
                <img src={qrUrl} alt="Scan this ProofPass verification request" width="160" height="160" />
                <p className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>{requestId}</p>
                <p className="text-[10px] text-center px-3" style={{ color: "var(--muted-foreground)" }}>Real QR deep-link. Use “Open Wallet” if LAN or camera scanning is unavailable.</p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Requested Information
                </p>
                <div className="rounded-lg divide-y text-xs" style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
                  {requestedInfo.map((item) => (
                    <div key={item.label} className="px-4 py-2.5 flex justify-between items-center gap-3">
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{item.label}</span>
                      <span style={{ color: "var(--muted-foreground)", textAlign: "right" }}>{item.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="flex gap-2.5 rounded-lg p-3 text-xs leading-relaxed"
                style={{ background: "rgba(0,200,150,0.07)", border: "1px solid rgba(0,200,150,0.18)" }}
              >
                <Eye size={13} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                <p style={{ color: "var(--muted-foreground)" }}>
                  Minimum necessary disclosure: {proofRequest.audience} receives only the required
                  eligibility result — never your name, ID, DOB, or photo. (This MVP uses digitally signed
                  claims, not zero-knowledge proofs.)
                </p>
              </div>

              <button
                onClick={onOpenWallet}
                className="rounded py-2.5 text-sm font-semibold tracking-wide transition-all duration-150 hover:opacity-90"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)", fontFamily: "var(--font-heading)" }}
              >
                Open ProofPass Wallet
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="text-center text-xs transition-colors hover:underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            Cancel verification
          </button>
        </div>
      </div>
    </div>
  );
}
