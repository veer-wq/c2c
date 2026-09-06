import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Tag, ShoppingCart, Shield, X, Check, AlertCircle,
  Clock3, Eye, ChevronDown, RotateCcw, ArrowRight
} from "lucide-react";
import "./styles.css";

function App() {
  const [screen, setScreen] = useState("checkout");

  const openVerification = () => setScreen("scan");
  const success = () => setScreen("success");
  const failure = () => setScreen("failure");
  const tryAgain = () => setScreen("scan");

  return (
    <div className="page">
      <Header />

      <div className="checkout">
        <div className="left">
          <div className="banner">
            <div className="eyebrow">STUDENT EXCLUSIVE</div>
            <div className="banner-title">Up to 54% off - verified students only</div>
          </div>

          <SectionTitle>ORDER SUMMARY</SectionTitle>
          <div className="card order-card">
            <Product
              name="Adobe Creative Cloud"
              detail="Annual · All Apps"
              price="Rs.1000/mo"
              oldPrice="Rs.4000/mo"
            />
            <Product
              name="Notion Pro"
              detail="Annual · Personal"
              price="Rs.800/mo"
              oldPrice="Rs.1600/mo"
            />
          </div>

          <SectionTitle>PAYMENT</SectionTitle>
          <div className="card payment-card">
            <label>Card number</label>
            <input placeholder="4242 4242 4242 4242" />
            <div className="payment-row">
              <div>
                <label>Expiry</label>
                <input placeholder="MM / YY" />
              </div>
              <div>
                <label>CVC</label>
                <input placeholder="···" />
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="card total-card">
            <SectionTitle>TOTAL</SectionTitle>
            <div className="total-line"><span>Subtotal</span><b>Rs.5600</b></div>
            <div className="total-line"><span>Student discount</span><b className="green">−Rs.3800</b></div>
            <div className="divider" />
            <div className="total-final"><span>Total / mo</span><b>Rs.1800</b></div>
          </div>

          <div className="proof-card">
            <div className="proof-header">
              <Shield size={21} />
              <div>
                <div className="proof-title">PROOFPASS</div>
                <div className="proof-sub">Student Identity Verification</div>
              </div>
            </div>
            <div className="proof-body">
              <h2>Verify your student status</h2>
              <p>
                StudentDeals requires proof of enrollment to apply your
                discount. Scan the QR code with your ProofPass app only
                your eligibility status is shared, never your personal data.
              </p>
              <div className="discount-line"><span>Adobe Creative Cloud</span><b>−Rs.3000/mo</b></div>
              <div className="discount-line"><span>Notion Pro</span><b>−Rs.800/mo</b></div>
              <button className="verify-button" onClick={openVerification}>
                Verify with ProofPass
              </button>
              <div className="privacy">Zero personal data shared · Privacy-first verification</div>
            </div>
          </div>
        </div>
      </div>

      {screen !== "checkout" && (
        <div className="overlay">
          {screen === "scan" && <ScanModal onClose={() => setScreen("checkout")} onSuccess={success} onFailure={failure} />}
          {screen === "success" && <SuccessModal onContinue={() => setScreen("checkout")} />}
          {screen === "failure" && <FailureModal onTryAgain={tryAgain} />}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <Tag size={23} />
        <b>StudentDeals</b>
      </div>
      <nav>
        <span>Software</span>
        <span>Subscriptions</span>
        <span>Electronics</span>
      </nav>
      <div className="cart"><ShoppingCart size={22} /><b>2 items</b></div>
    </header>
  );
}

function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

function Product({name, detail, price, oldPrice}) {
  return (
    <div className="product">
      <div>
        <b>{name}</b>
        <span>{detail}</span>
      </div>
      <div className="product-price">
        <b>{price}</b>
        <del>{oldPrice}</del>
      </div>
    </div>
  );
}

function ScanModal({onClose, onSuccess, onFailure}) {
  return (
    <div className="modal scan-modal">
      <div className="modal-top">
        <div className="modal-brand">
          <Shield size={17}/>
          <div><b>PROOFPASS</b><span>Verification Request</span></div>
        </div>
        <button className="icon-button" onClick={onClose}><X size={17}/></button>
      </div>

      <div className="scan-body">
        <h2>Scan to verify your student status</h2>
        <p>Open the ProofPass app and scan this code. Verification takes under 10 seconds.</p>

        <FakeQR />

        <div className="expires"><Clock3 size={13}/> Session expires in <b>4:58</b></div>

        <SectionTitle>REQUESTED INFORMATION</SectionTitle>
        <InfoRows rows={[
          ["Enrollment status", "Active student - yes/no only"],
          ["Institution type", "University / College"],
          ["Eligibility period", "Valid through Jun 2027"]
        ]}/>

        <div className="privacy-box">
          <Eye size={14}/>
          <span>ProofPass uses zero knowledge proofs.<br/>StudentDeals receives only your eligibility result<br/>never your name, ID, or institution.</span>
        </div>

        <div className="simulate-row">
          <button className="simulate-success" onClick={onSuccess}>Simulate Success</button>
          <button className="simulate-failure" onClick={onFailure}>Simulate Failure</button>
        </div>

        <button className="cancel" onClick={onClose}>Cancel verification</button>
      </div>
    </div>
  );
}

function FakeQR() {
  const cells = Array.from({length: 169}, (_, i) => {
    const r=Math.floor(i/13), c=i%13;
    const finder = (rr,cc,fr,fc) => rr>=fr && rr<fr+5 && cc>=fc && cc<fc+5 &&
      (rr===fr || rr===fr+4 || cc===fc || cc===fc+4 || (rr===fr+2 && cc===fc+2));
    let on = finder(r,c,0,0) || finder(r,c,0,8) || finder(r,c,8,0);
    if (!on) on = ((r*7+c*11+r*c)%5===0 || (r+c)%7===0);
    return <i key={i} className={on ? "qr-on" : ""}/>;
  });
  return <div className="qr">{cells}</div>;
}

function InfoRows({rows}) {
  return <div className="info-rows">{rows.map(([a,b]) =>
    <div className="info-row" key={a}><span>{a}</span><b>{b}</b></div>
  )}</div>;
}

function SuccessModal({onContinue}) {
  return (
    <div className="modal result-modal success">
      <div className="result-icon"><Check size={31}/></div>
      <div className="result-label">VERIFIED</div>
      <h1>Student status confirmed</h1>
      <p>Your enrollment at <b>University of Edinburgh</b> has been verified. Your student discounts are now active.</p>

      <InfoRows rows={[
        ["Institution", "University of Edinburgh"],
        ["Status", "Active student"],
        ["Valid through", "June 2027"],
        ["Discount applied", "−Rs.3800/mo"]
      ]}/>

      <div className="privacy-box result-privacy">
        <Shield size={14}/>
        <span>Only your eligibility was shared. Your name,<br/>student ID, and institution details remain private.</span>
      </div>

      <button className="primary-result" onClick={onContinue}>Continue to payment <ArrowRight size={17}/></button>
      <div className="powered">Verification powered by <b>ProofPass</b></div>
    </div>
  );
}

function FailureModal({onTryAgain}) {
  return (
    <div className="modal result-modal failure">
      <div className="result-icon"><X size={31}/></div>
      <div className="result-label">VERIFICATION FAILED</div>
      <h1>We couldn't verify your<br/>enrollment</h1>
      <p>ProofPass was unable to confirm active student status with your credential. No personal data was stored or shared.</p>

      <div className="why">
        <b>Why might this happen?</b>
        <ChevronDown size={15}/>
      </div>

      <div className="privacy-box failure-box">
        <Shield size={14}/>
        <span>No personal information was collected or<br/>transmitted during this verification attempt.</span>
      </div>

      <button className="primary-result" onClick={onTryAgain}><RotateCcw size={15}/> Try again</button>
      <div className="without">Continue without student discount</div>
      <div className="support">Need help? <b>Contact ProofPass support</b></div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
