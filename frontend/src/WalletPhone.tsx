import { useEffect, useState } from "react";
import { getCredentials, generateProof, verifyProof } from "./api";
import { ProofRequestResponse, StoredCredential, VerifyProofResponse } from "./types";

interface Props {
  studentId: string;
  proofRequest: ProofRequestResponse;
  /** Demo-only: send a flipped claim to /verify-proof to show Ed25519 catches tampering. */
  tamperClaim: boolean;
  onApproved: (result: VerifyProofResponse) => void;
  onDeclined: () => void;
}

type Screen = "loading" | "empty" | "error" | "dashboard" | "scanner" | "privacy-gate";

/**
 * The ProofPass Wallet, rendered as a phone mockup. This is the same visual
 * design as the original prototype, now loading the real credential from the
 * backend and actually calling /proof + /verify-proof on Approve.
 */
export default function WalletPhone({
  studentId,
  proofRequest,
  tamperClaim,
  onApproved,
  onDeclined,
}: Props) {
  const [screen, setScreen] = useState<Screen>("loading");
  const [credential, setCredential] = useState<StoredCredential | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setScreen("loading");
      setLoadError(null);
      try {
        const res = await getCredentials(studentId);
        if (cancelled) return;
        const active = res.credentials[res.credentials.length - 1] ?? null;
        setCredential(active);
        setScreen(active ? "dashboard" : "empty");
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.message || "Could not load credential");
        setScreen("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function handleApprove() {
    if (!credential) return;
    setApproving(true);
    setApproveError(null);
    try {
      const proofRes = await generateProof(credential, proofRequest);
      if (!proofRes.success || !proofRes.presentation) {
        setApproveError(proofRes.message || "Could not generate proof");
        setApproving(false);
        return;
      }
      const presentation = tamperClaim ? { ...proofRes.presentation, claims: { [proofRequest.claims[0]]: false } } : proofRes.presentation;
      const verifyRes = await verifyProof(presentation);
      setApproving(false);
      onApproved(verifyRes);
    } catch (err: any) {
      setApproveError(err?.message || "Verification request failed");
      setApproving(false);
    }
  }

  return (
    <div
      className="size-full flex items-center justify-center"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div
        style={{
          width: 340,
          height: 700,
          background: "#000",
          borderRadius: 46,
          overflow: "hidden",
          position: "relative",
          boxShadow:
            "0 0 0 1px #2a2a2a, 0 0 0 8px #1a1a1a, 0 40px 120px rgba(0,0,0,0.8), 0 0 80px rgba(10,132,255,0.08)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 110,
            height: 32,
            background: "#000",
            borderRadius: 18,
            zIndex: 50,
            boxShadow: "0 0 0 1px #1a1a1a",
          }}
        />

        {screen === "loading" && <CenterMessage text="Loading credential…" />}

        {screen === "error" && (
          <CenterMessage
            text={loadError || "Something went wrong"}
            danger
            actionLabel="Retry"
            onAction={() => setScreen("loading")}
          />
        )}

        {screen === "empty" && (
          <CenterMessage
            text={`No credential found for ${studentId}. Issue one from the Issuer panel first.`}
          />
        )}

        {screen === "dashboard" && credential && (
          <DashboardScreen
            credential={credential}
            onScan={() => setScreen("scanner")}
          />
        )}

        {screen === "scanner" && (
          <ScannerScreen
            requestedBy={proofRequest.audience}
            onCancel={onDeclined}
            onDetect={() => setScreen("privacy-gate")}
          />
        )}

        {screen === "privacy-gate" && credential && (
          <PrivacyGateScreen
            requestedBy={proofRequest.audience}
            requestDescription={proofRequest.description}
            requestedClaim={proofRequest.claims[0]}
            purpose={proofRequest.purpose}
            expiresAt={proofRequest.expires_at}
            approving={approving}
            approveError={approveError}
            onApprove={handleApprove}
            onDecline={onDeclined}
          />
        )}
      </div>
    </div>
  );
}

function CenterMessage({
  text,
  danger,
  actionLabel,
  onAction,
}: {
  text: string;
  danger?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 16,
        textAlign: "center",
      }}
    >
      <p style={{ color: danger ? "#FF453A" : "#aaa", fontSize: 14, lineHeight: 1.5 }}>{text}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: "#1c1c1e",
            border: "1px solid #2c2c2e",
            borderRadius: 100,
            padding: "10px 20px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function DashboardScreen({
  credential,
  onScan,
}: {
  credential: StoredCredential;
  onScan: () => void;
}) {
  const initials = credential.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        flex: 1,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        paddingTop: 56,
        paddingBottom: 28,
      }}
    >
      <div style={{ padding: "0 22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p
              style={{
                color: "#888",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              ProofPass Wallet
            </p>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: -0.7 }}>My Wallet</h1>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "0 20px 10px",
          color: "#555",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.7,
          textTransform: "uppercase",
        }}
      >
        Credentials · 1
      </div>

      <div style={{ padding: "0 18px", flex: 1 }}>
        <div
          style={{
            background: "linear-gradient(145deg, #1a1a1a 0%, #141414 60%, #111 100%)",
            borderRadius: 22,
            padding: "24px 22px",
            border: "1px solid #2a2a2a",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 26,
            }}
          >
            <span
              style={{
                color: "#888",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              🎓 Student ID
            </span>
            <div
              style={{
                background: credential.revoked ? "rgba(255,69,58,0.14)" : "rgba(52, 199, 89, 0.14)",
                border: `1px solid ${credential.revoked ? "rgba(255,69,58,0.3)" : "rgba(52, 199, 89, 0.3)"}`,
                borderRadius: 100,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span style={{ fontSize: 10 }}>{credential.revoked ? "⛔" : "✅"}</span>
              <span
                style={{
                  color: credential.revoked ? "#FF453A" : "#34C759",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {credential.revoked ? "Revoked" : "Signed"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: "linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.4, marginBottom: 2 }}>
                {credential.name}
              </p>
              <p style={{ color: "#888", fontSize: 12 }}>Student · {credential.student_id}</p>
            </div>
          </div>

          <div style={{ height: 1, background: "#2a2a2a", marginBottom: 18 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 10px" }}>
            <Field label="Issuer" value={credential.issuer} />
            <Field label="Credential ID" value={credential.credential_id} />
            <Field label="Issued" value={formatDate(credential.issued_at)} />
            <Field label="Valid until" value={formatDate(credential.expires_at)} />
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <button
          onClick={onScan}
          disabled={credential.revoked}
          style={{
            width: "100%",
            background: credential.revoked ? "#333" : "#0A84FF",
            border: "none",
            borderRadius: 100,
            padding: "16px 0",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: credential.revoked ? "not-allowed" : "pointer",
          }}
        >
          {credential.revoked ? "Credential revoked" : "⊡ Scan QR to Verify"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          color: "#555",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginBottom: 3,
        }}
      >
        {label}
      </p>
      <p style={{ color: "#ddd", fontSize: 12, fontWeight: 600, wordBreak: "break-word" }}>{value}</p>
    </div>
  );
}

function ScannerScreen({
  requestedBy,
  onCancel,
  onDetect,
}: {
  requestedBy: string;
  onCancel: () => void;
  onDetect: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 64,
        paddingBottom: 40,
      }}
    >
      <div style={{ textAlign: "center", padding: "0 28px" }}>
        <p
          style={{
            color: "#888",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Scanner
        </p>
        <p style={{ color: "#fff", fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
          Point camera at the <span style={{ color: "#0A84FF", fontWeight: 600 }}>{requestedBy}</span> QR
          code
        </p>
      </div>

      <div style={{ width: 220, height: 220, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 140px 140px at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        {[
          { top: 0, left: 0, borderTop: "3px solid #fff", borderLeft: "3px solid #fff" },
          { top: 0, right: 0, borderTop: "3px solid #fff", borderRight: "3px solid #fff" },
          { bottom: 0, left: 0, borderBottom: "3px solid #fff", borderLeft: "3px solid #fff" },
          { bottom: 0, right: 0, borderBottom: "3px solid #fff", borderRight: "3px solid #fff" },
        ].map((style, i) => (
          <div key={i} style={{ position: "absolute", width: 30, height: 30, ...style }} />
        ))}
      </div>

      <div style={{ width: "100%", padding: "0 24px" }}>
        <button
          onClick={onDetect}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid #333",
            borderRadius: 100,
            padding: "10px 0",
            marginBottom: 14,
            color: "#aaa",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Tap to simulate QR detection
        </button>
        <button
          onClick={onCancel}
          style={{
            width: "100%",
            background: "#1c1c1e",
            border: "1px solid #2c2c2e",
            borderRadius: 100,
            padding: "16px 0",
            color: "#aaa",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PrivacyGateScreen({
  requestedBy,
  requestDescription,
  requestedClaim,
  purpose,
  expiresAt,
  approving,
  approveError,
  onApprove,
  onDecline,
}: {
  requestedBy: string;
  requestDescription: string;
  requestedClaim: string;
  purpose: string;
  expiresAt: string;
  approving: boolean;
  approveError: string | null;
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <div style={{ flex: 1, background: "#050505", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ background: "#1c1c1e", borderRadius: "26px 26px 0 0", padding: "0 0 32px" }}>
        <div style={{ width: 36, height: 5, background: "#3a3a3c", borderRadius: 3, margin: "12px auto 0" }} />

        <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: "linear-gradient(135deg, #FF9F0A 0%, #FF6B00 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🛍️
          </div>
          <div>
            <p style={{ color: "#8e8e93", fontSize: 12, marginBottom: 2 }}>{requestedBy} is requesting:</p>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{requestDescription}</p>
            <p style={{ color: "#8e8e93", fontSize: 11, marginTop: 3 }}>Purpose: {purpose} · Expires {new Date(expiresAt).toLocaleTimeString()}</p>
          </div>
        </div>

        <div style={{ height: 1, background: "#2c2c2e", margin: "16px 22px" }} />

        <div style={{ padding: "0 22px" }}>
          <p
            style={{
              color: "#8e8e93",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 9,
            }}
          >
            Will share
          </p>
          <div
            style={{
              background: "rgba(52, 199, 89, 0.1)",
              border: "1px solid rgba(52, 199, 89, 0.2)",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 15 }}>✅</span>
            <div>
              <span style={{ color: "#8e8e93", fontSize: 13 }}>{({ is_student: "Student Status", is_over_18: "Age ≥ 18", is_employee: "Employee Status" }[requestedClaim] || requestedClaim)} = </span>
              <span style={{ color: "#34C759", fontSize: 13, fontWeight: 700 }}>Verified</span>
            </div>
          </div>

          <p
            style={{
              color: "#8e8e93",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              marginBottom: 9,
            }}
          >
            Information kept private
          </p>
          <div style={{ background: "#2c2c2e", borderRadius: 12, overflow: "hidden", border: "1px solid #3a3a3c" }}>
            {["Name", "Student ID", "Date of birth", "Photograph"].map((label, i, arr) => (
              <div key={label}>
                <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 13 }}>❌</span>
                  <span style={{ color: "#636366", fontSize: 13 }}>{label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ height: 1, background: "#3a3a3c", marginLeft: 14 }} />}
              </div>
            ))}
          </div>

          <p style={{ color: "#636366", fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
            Minimum necessary disclosure — only the required claim is shared. This MVP
            uses digitally signed claims, not zero-knowledge proofs.
          </p>
        </div>

        {approveError && (
          <div style={{ padding: "14px 22px 0" }}>
            <p style={{ color: "#FF453A", fontSize: 12 }}>{approveError}</p>
          </div>
        )}

        <div style={{ padding: "18px 22px 0" }}>
          <button
            onClick={onApprove}
            disabled={approving}
            style={{
              width: "100%",
              background: "#0A84FF",
              border: "none",
              borderRadius: 100,
              padding: "16px 0",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: approving ? "default" : "pointer",
              opacity: approving ? 0.75 : 1,
            }}
          >
            {approving ? "Verifying…" : "Approve Request"}
          </button>

          <button
            onClick={onDecline}
            disabled={approving}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              padding: "12px 0 0",
              color: "#636366",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
