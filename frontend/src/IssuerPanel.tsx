import { useState } from "react";
import { Stamp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { issueCredential } from "./api";
import { DEMO_ISSUER, DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "./config";
import { IssueCredentialResponse } from "./types";

interface Props {
  onIssued: (result: IssueCredentialResponse) => void;
}

/**
 * Minimal issuer UI for the hackathon demo: one button that asks the
 * backend to sign and store a demo student credential (POST /credential).
 * There's no real institutional identity system here — this stands in for
 * "a university's credential issuing system."
 */
export default function IssuerPanel({ onIssued }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueCredentialResponse | null>(null);

  async function handleIssue() {
    setStatus("loading");
    setError(null);
    try {
      const res = await issueCredential({
        name: DEMO_STUDENT_NAME,
        student_id: DEMO_STUDENT_ID,
        is_student: true,
        issuer: DEMO_ISSUER,
      });
      setResult(res);
      setStatus("done");
      onIssued(res);
    } catch (err: any) {
      setError(err?.message || "Failed to issue credential");
      setStatus("error");
    }
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <Stamp size={18} style={{ color: "var(--primary)" }} />
        <div>
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "var(--primary)" }}
          >
            Issuer
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {DEMO_ISSUER}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
        Creates a signed student credential for the demo student ({DEMO_STUDENT_NAME},{" "}
        {DEMO_STUDENT_ID}) and stores it in the backend. Do this once before using the
        wallet.
      </p>

      <button
        onClick={handleIssue}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Issuing credential…
          </>
        ) : (
          "Issue demo credential"
        )}
      </button>

      {status === "done" && result && (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg p-3 text-xs"
          style={{ background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)" }}
        >
          <CheckCircle2 size={14} style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5" />
          <div style={{ color: "var(--foreground)" }}>
            Issued <strong>{result.credential_id}</strong> for {DEMO_STUDENT_NAME}. The
            wallet can now load it.
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg p-3 text-xs"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle size={14} style={{ color: "#ef4444" }} className="shrink-0 mt-0.5" />
          <span style={{ color: "#ef4444" }}>{error}</span>
        </div>
      )}
    </div>
  );
}
