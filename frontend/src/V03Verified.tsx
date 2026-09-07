import { CheckCircle2, Shield, ArrowRight } from "lucide-react";

interface Props {
  issuer: string;
  credentialId: string;
  message: string;
  discountLabel: string;
  title?: string;
  statusLabel?: string;
  actionLabel?: string;
  onContinue: () => void;
}

export default function V03Verified({ issuer, credentialId, message, discountLabel, title = "Student status confirmed", statusLabel = "Active student", actionLabel = "Continue to payment", onContinue }: Props) {
  return (
    <div
      className="min-h-full flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="rounded-xl w-full max-w-sm overflow-hidden shadow-lg"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <div className="h-1 w-full" style={{ background: "var(--accent)" }} />

        <div className="p-8 flex flex-col items-center text-center gap-6">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, background: "rgba(0,200,150,0.10)" }}
          >
            <CheckCircle2 size={36} style={{ color: "var(--accent)" }} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--accent)" }}>
              Verified
            </p>
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }}>
              {title}
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {message}
            </p>
          </div>

          <div
            className="w-full rounded-lg divide-y text-xs"
            style={{ border: "1px solid var(--border)", background: "var(--background)" }}
          >
            <div className="px-4 py-3 flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Issuer</span>
              <span className="font-medium" style={{ color: "var(--foreground)" }}>{issuer}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Status</span>
              <span className="font-semibold" style={{ color: "var(--accent)" }}>{statusLabel}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Credential</span>
              <span className="font-medium" style={{ color: "var(--foreground)" }}>{credentialId}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Result</span>
              <span className="font-semibold" style={{ color: "var(--accent)" }}>{discountLabel}</span>
            </div>
          </div>

          <div
            className="flex gap-2.5 rounded-lg p-3 text-xs leading-relaxed w-full"
            style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)" }}
          >
            <Shield size={13} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
            <p style={{ color: "var(--muted-foreground)", textAlign: "left" }}>
              Only your eligibility was shared and cryptographically verified. Your name,
              student ID, and other identity details stayed private.
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 rounded py-3 text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-heading)" }}
          >
            {actionLabel}
            <ArrowRight size={15} />
          </button>

          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Verification powered by <span className="font-semibold" style={{ color: "var(--primary)" }}>ProofPass</span>
          </p>
        </div>
      </div>
    </div>
  );
}
