import { ShoppingCart, Shield, Tag, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Props {
  onVerify: () => void;
  verifierName?: string;
  claimLabel?: string;
  purposeLabel?: string;
}

function luhn(num: string) {
  const digits = num.replace(/\D/g, "");
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return digits.length >= 13 && sum % 10 === 0;
}

function formatCard(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + " / " + digits.slice(2);
}

function expiryError(val: string): string | null {
  const digits = val.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const month = parseInt(digits.slice(0, 2), 10);
  const year = 2000 + parseInt(digits.slice(2, 4), 10);
  if (month < 1 || month > 12) return "Invalid month";
  const now = new Date();
  const expDate = new Date(year, month - 1, 1);
  if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) return "Card has expired";
  return null;
}

function cardError(val: string): string | null {
  const digits = val.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length < 16) return "Card number is too short";
  if (!luhn(digits)) return "Invalid card number";
  return null;
}

function cvcError(val: string, cardVal: string): string | null {
  const digits = val.replace(/\D/g, "");
  if (digits.length === 0) return null;
  const cardDigits = cardVal.replace(/\D/g, "");
  const isAmex = cardDigits.startsWith("34") || cardDigits.startsWith("37");
  const required = isAmex ? 4 : 3;
  if (digits.length < required) return `CVC must be ${required} digits`;
  if (!/^\d+$/.test(digits)) return "CVC must be numeric";
  return null;
}

const CARD_ITEMS = [
  { name: "Adobe Creative Cloud", plan: "Annual · All Apps", price: 29.99, originalPrice: 54.99 },
  { name: "Notion Pro", plan: "Annual · Personal", price: 8.0, originalPrice: 16.0 },
];

export default function V01Checkout({ onVerify, verifierName = "StudentDeals", claimLabel = "student status", purposeLabel = "apply your discount" }: Props) {
  const subtotal = CARD_ITEMS.reduce((s, i) => s + i.price, 0);
  const savings = CARD_ITEMS.reduce((s, i) => s + (i.originalPrice - i.price), 0);

  const [cardVal, setCardVal] = useState("");
  const [expiryVal, setExpiryVal] = useState("");
  const [cvcVal, setCvcVal] = useState("");
  const [touched, setTouched] = useState({ card: false, expiry: false, cvc: false });

  const cardErr = cardError(cardVal);
  const expErr = expiryError(expiryVal);
  const cvcErr = cvcError(cvcVal, cardVal);

  return (
    <div className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      {/* Navbar */}
      <nav
        className="border-b flex items-center justify-between px-8 py-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <Tag size={20} style={{ color: "var(--accent)" }} />
          <span
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }}
          >
            {verifierName}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <span>Software</span>
          <span>Subscriptions</span>
          <span>Electronics</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: "var(--primary)" }}>
          <ShoppingCart size={18} />
          <span className="text-sm font-medium">2 items</span>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 grid gap-8 px-8 py-10 max-w-5xl mx-auto w-full" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* Left — product + checkout form */}
        <div className="flex flex-col gap-6">
          {/* Hero strip */}
          <div
            className="rounded-lg px-6 py-5 flex items-center gap-4"
            style={{ background: "var(--primary)" }}
          >
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: "var(--accent)" }}>
                Student Exclusive
              </p>
              <h1
                className="text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-heading)", color: "#fff" }}
              >
                Up to 54% off — verified students only
              </h1>
            </div>
          </div>

          {/* Cart items */}
          <section>
            <h2
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Order Summary
            </h2>
            <div
              className="rounded-lg divide-y"
              style={{ background: "var(--card)", border: "1px solid var(--border)", divideColor: "var(--border)" }}
            >
              {CARD_ITEMS.map((item) => (
                <div key={item.name} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.plan}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>${item.price.toFixed(2)}/mo</p>
                    <p className="text-xs line-through" style={{ color: "var(--muted-foreground)" }}>${item.originalPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment form */}
          <section>
            <h2
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Payment
            </h2>
            <div
              className="rounded-lg p-5 flex flex-col gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {/* Card number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Card number</label>
                <input
                  className="rounded px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    border: `1px solid ${touched.card && cardErr ? "#ef4444" : "var(--border)"}`,
                    fontFamily: "var(--font-body)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                  }}
                  placeholder="4242 4242 4242 4242"
                  value={cardVal}
                  inputMode="numeric"
                  onChange={(e) => setCardVal(formatCard(e.target.value))}
                  onBlur={() => setTouched((t) => ({ ...t, card: true }))}
                />
                {touched.card && cardErr && (
                  <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#ef4444" }}>
                    <AlertCircle size={11} /> {cardErr}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Expiry</label>
                  <input
                    className="rounded px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      border: `1px solid ${touched.expiry && expErr ? "#ef4444" : "var(--border)"}`,
                      background: "var(--background)",
                      color: "var(--foreground)",
                    }}
                    placeholder="MM / YY"
                    value={expiryVal}
                    inputMode="numeric"
                    onChange={(e) => setExpiryVal(formatExpiry(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                  />
                  {touched.expiry && expErr && (
                    <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#ef4444" }}>
                      <AlertCircle size={11} /> {expErr}
                    </p>
                  )}
                </div>

                {/* CVC */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>CVC</label>
                  <input
                    className="rounded px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      border: `1px solid ${touched.cvc && cvcErr ? "#ef4444" : "var(--border)"}`,
                      background: "var(--background)",
                      color: "var(--foreground)",
                    }}
                    placeholder="···"
                    value={cvcVal}
                    inputMode="numeric"
                    maxLength={4}
                    onChange={(e) => setCvcVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
                  />
                  {touched.cvc && cvcErr && (
                    <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#ef4444" }}>
                      <AlertCircle size={11} /> {cvcErr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right — totals + ProofPass card */}
        <div className="flex flex-col gap-5">
          {/* Totals */}
          <div
            className="rounded-lg p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2
              className="text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Total
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Subtotal</span>
                <span style={{ color: "var(--foreground)" }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Student discount</span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>−${savings.toFixed(2)}</span>
              </div>
              <div
                className="flex justify-between pt-3 mt-1 border-t font-bold text-base"
                style={{ borderColor: "var(--border)", color: "var(--primary)" }}
              >
                <span>Total / mo</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ProofPass Verification Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Card header */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ background: "var(--primary)" }}
            >
              <Shield size={18} style={{ color: "var(--accent)" }} />
              <div>
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: "var(--accent)" }}
                >
                  ProofPass
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Student Identity Verification
                </p>
              </div>
            </div>

            {/* Card body */}
            <div className="p-5" style={{ background: "var(--card)" }}>
              <p className="text-sm mb-1 font-medium" style={{ color: "var(--foreground)" }}>
                Verify your {claimLabel}
              </p>
              <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--muted-foreground)" }}>
                {verifierName} requires proof of {claimLabel} to {purposeLabel}. Scan the QR code with your ProofPass app — only your eligibility status is shared, never your personal data.
              </p>

              {/* Discount items */}
              <div className="flex flex-col gap-2 mb-5">
                {CARD_ITEMS.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--muted-foreground)" }}>{item.name}</span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--accent)" }}
                    >
                      −${(item.originalPrice - item.price).toFixed(2)}/mo
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={onVerify}
                className="w-full rounded py-3 text-sm font-semibold tracking-wide transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Verify with ProofPass
              </button>

              <p className="text-center text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>
                Zero personal data shared · Privacy-first verification
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
