import { XCircle, Shield, RotateCcw } from "lucide-react";

interface Props {
  reason: string;
  onRetry: () => void;
}

export default function V04Failed({ reason, onRetry }: Props) {
  return (
    <div
      className="min-h-full flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="rounded-xl w-full max-w-sm overflow-hidden shadow-lg"
        style={{ border: "1px solid var(--border)", background: "var(--card)" }}
      >
        <div className="h-1 w-full" style={{ background: "#ef4444" }} />

        <div className="p-8 flex flex-col items-center text-center gap-6">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, background: "rgba(239,68,68,0.08)" }}
          >
            <XCircle size={36} strokeWidth={1.8} style={{ color: "#ef4444" }} />
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#ef4444" }}>
              Verification failed
            </p>
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }}>
              We couldn't verify your enrollment
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {reason}
            </p>
          </div>

          <div
            className="flex gap-2.5 rounded-lg p-3 text-xs leading-relaxed w-full"
            style={{ background: "rgba(15,39,68,0.04)", border: "1px solid var(--border)" }}
          >
            <Shield size={13} className="shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }} />
            <p style={{ color: "var(--muted-foreground)", textAlign: "left" }}>
              No personal information was collected or transmitted during this verification attempt.
            </p>
          </div>

          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 rounded py-3 text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontFamily: "var(--font-heading)" }}
          >
            <RotateCcw size={14} />
            Try again
          </button>

          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Verification powered by <span className="font-semibold" style={{ color: "var(--primary)" }}>ProofPass</span>
          </p>
        </div>
      </div>
    </div>
  );
}
