import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  X, Zap, GraduationCap, Check, ScanLine, Shield,
  LockKeyhole, UserRoundX, FileLock2, QrCode
} from "lucide-react";
import "./styles.css";

function App() {
  const [page, setPage] = useState("wallet");

  return (
    <div className="phone">
      {page === "wallet" && <Wallet onScan={() => setPage("scanner")} />}
      {page === "scanner" && (
        <Scanner
          onCancel={() => setPage("wallet")}
          onScanned={() => setPage("privacy")}
        />
      )}
      {page === "privacy" && (
        <PrivacyGate
          onFinish={() => setPage("wallet")}
        />
      )}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="status">
      <b>9:41</b>
      <div className="status-icons">
        <span>▮▮▮</span><span>⌁</span><span className="battery">▰</span>
      </div>
    </div>
  );
}

function Wallet({onScan}) {
  return (
    <main className="wallet page-screen">
      <StatusBar />
      <div className="wallet-head">
        <div>
          <div className="tiny-brand">PROOFPASS</div>
          <h1>My Wallet</h1>
          <div className="credentials">CREDENTIALS · 1</div>
        </div>
        <div className="profile">V</div>
      </div>

      <div className="credential-card">
        <div className="card-top">
          <div className="student-id">
            <div className="cap"><GraduationCap size={17}/></div>
            <b>STUDENT ID</b>
          </div>
          <div className="verified"><Check size={12}/> Verified</div>
        </div>

        <div className="identity">
          <div className="initials">VR</div>
          <div><h2>Vijay Rohra</h2><p>Student</p></div>
        </div>

        <div className="details">
          <Detail label="UNIVERSITY" value="VIT Vellore"/>
          <Detail label="PROGRAM" value="CSE (Data Science)"/>
          <Detail label="YEAR" value="3rd Year"/>
          <Detail label="VALID UNTIL" value="May 2027"/>
        </div>

        <div className="gradient-line"></div>
      </div>

      <div className="small-actions">
        <button>Share</button><button>Details</button><button>History</button>
      </div>

      <button className="scan-main" onClick={onScan}>
        <ScanLine size={18}/> Scan QR to Verify
      </button>
    </main>
  );
}

function Detail({label,value}) {
  return <div><span>{label}</span><b>{value}</b></div>;
}

function Scanner({onCancel,onScanned}) {
  return (
    <main className="scanner page-screen">
      <StatusBar />
      <div className="scanner-head">
        <button className="round-btn" onClick={onCancel}><X size={21}/></button>
        <div className="scanner-title"><div>PROOFPASS</div><b>Scan Verifier QR</b></div>
        <button className="round-btn"><Zap size={20}/></button>
      </div>

      <div className="verifier-pill">
        <span className="blue-dot"></span>
        Verifier: <b>StudentDeals Partner</b>
        <span className="lock">▮</span>
      </div>

      <div className="scan-frame" onClick={onScanned}>
        <div className="corner tl"></div><div className="corner tr"></div>
        <div className="corner bl"></div><div className="corner br"></div>
        <div className="plus">+</div>
      </div>

      <div className="scan-instructions">
        <b>Point camera at StudentDeals QR</b>
        <p>Keep QR code centered inside the frame to verify<br/>Vijay Rohra's credential</p>
      </div>

      <button className="cancel-button" onClick={onCancel}>Cancel</button>
      <div className="home-indicator"></div>
    </main>
  );
}

function PrivacyGate({onFinish}) {
  return (
    <main className="privacy-page page-screen">
      <StatusBar />
      <div className="privacy-sheet">
        <div className="grabber"></div>

        <div className="gate-icon"><Shield size={24}/></div>
        <h1>Privacy Gate</h1>
        <p className="request">StudentDeals is requesting credential proof:</p>

        <div className="shared-card">
          <div className="shared-title">● SHARED VIA ZERO-KNOWLEDGE PROOF</div>
          <div className="shared-main"><Check size={18}/><b>Student Status = Verified</b></div>
          <p>Cryptographically proved without exposing private<br/>records or college identity card.</p>
        </div>

        <div className="private-card">
          <div className="private-head">
            <span><UserRoundX size={14}/> Information kept private:</span>
            <b>100% PROTECTED</b>
          </div>

          <PrivateRow icon={<UserRoundX size={14}/>} label="Full Name">
            <span className="redacted">Vijay Rohra</span><em>REDACTED</em>
          </PrivateRow>
          <PrivateRow icon={<FileLock2 size={14}/>} label={<>Branch /<br/>Major</>}>
            <span className="redacted">CSE (Data<br/>Science)</span><em>SHIELDED</em>
          </PrivateRow>
          <PrivateRow icon={<LockKeyhole size={14}/>} label={<>Photo & Reg<br/>Number</>}>
            <span className="redacted dots">••••••••••</span><em>HIDDEN</em>
          </PrivateRow>
        </div>

        <button className="approve" onClick={onFinish}>
          <Shield size={16}/> Approve Request
        </button>
        <button className="reject" onClick={onFinish}>Reject &amp; Close</button>
      </div>
      <div className="bottom-line"></div>
    </main>
  );
}

function PrivateRow({icon,label,children}) {
  return (
    <div className="private-row">
      <span className="private-icon">{icon}</span>
      <span className="private-label">{label}</span>
      <div className="private-value">{children}</div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
