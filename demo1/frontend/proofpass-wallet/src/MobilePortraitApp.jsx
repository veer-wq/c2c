import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Zap,
  GraduationCap,
  Check,
  ScanLine,
  Shield,
  LockKeyhole,
  UserRoundX,
  FileLock2,
  Camera,
  AlertCircle,
} from "lucide-react";
import jsQR from "jsqr";
import "./mobile-styles.css";

function MobilePortraitApp() {
  const [page, setPage] = useState("wallet");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  return (
    <div className="mobile-portrait-container">
      {page === "wallet" && <Wallet onScan={() => setPage("scanner")} />}
      {page === "scanner" && (
        <Scanner
          onCancel={() => {
            setPage("wallet");
            setCameraActive(false);
            setScanResult(null);
          }}
          onScanned={() => setPage("privacy")}
          onCameraActive={setCameraActive}
          onScanResult={setScanResult}
        />
      )}
      {page === "privacy" && (
        <PrivacyGate
          scanResult={scanResult}
          onFinish={() => {
            setPage("wallet");
            setCameraActive(false);
            setScanResult(null);
          }}
        />
      )}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="status-bar">
      <b>9:41</b>
      <div className="status-icons">
        <span>▮▮▮</span>
        <span>⌁</span>
        <span className="battery">▰</span>
      </div>
    </div>
  );
}

function Wallet({ onScan }) {
  return (
    <main className="wallet page-screen">
      <StatusBar />
      <div className="wallet-header">
        <div>
          <div className="tiny-brand">PROOFPASS</div>
          <h1>My Wallet</h1>
          <div className="credentials-label">CREDENTIALS · 1</div>
        </div>
        <div className="profile-icon">V</div>
      </div>

      <div className="credential-card">
        <div className="card-top">
          <div className="student-id">
            <div className="cap">
              <GraduationCap size={17} />
            </div>
            <b>STUDENT ID</b>
          </div>
          <div className="verified">
            <Check size={12} /> Verified
          </div>
        </div>

        <div className="identity">
          <div className="initials">VR</div>
          <div>
            <h2>Vijay Rohra</h2>
            <p>Student</p>
          </div>
        </div>

        <div className="details">
          <Detail label="UNIVERSITY" value="VIT Vellore" />
          <Detail label="PROGRAM" value="CSE (Data Science)" />
          <Detail label="YEAR" value="3rd Year" />
          <Detail label="VALID UNTIL" value="May 2027" />
        </div>

        <div className="gradient-line"></div>
      </div>

      <div className="small-actions">
        <button>Share</button>
        <button>Details</button>
        <button>History</button>
      </div>

      <button className="scan-main" onClick={onScan}>
        <ScanLine size={18} /> Scan QR to Verify
      </button>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Scanner({ onCancel, onScanned, onCameraActive, onScanResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraPermission, setCameraPermission] = useState("prompt");
  const [scanStatus, setScanStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedQR, setDetectedQR] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          onCameraActive(true);
          setCameraPermission("granted");
          setScanStatus("scanning");
          startQRScanning();
        }
      } catch (error) {
        console.error("Camera access error:", error);
        if (error.name === "NotAllowedError") {
          setCameraPermission("denied");
          setErrorMessage("Camera permission denied. Please enable camera access.");
        } else if (error.name === "NotFoundError") {
          setErrorMessage("No camera device found.");
        } else {
          setErrorMessage("Failed to access camera: " + error.message);
        }
        setScanStatus("error");
        onCameraActive(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup camera stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [onCameraActive]);

  const startQRScanning = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    const scanInterval = 100; // Scan every 100ms

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 2,
        });

        if (code) {
          setScanStatus("detected");
          setDetectedQR(code.data);
          onScanResult(code.data);

          // Auto-proceed after detecting QR
          setTimeout(() => {
            onScanned();
          }, 1500);
        }
      }
    }, scanInterval);
  };

  const handleManualScan = () => {
    // Simulate scan for demo purposes
    setScanStatus("detected");
    setDetectedQR("https://studentdeals.com/verify?code=VELLORE-2024-12345");
    onScanResult("https://studentdeals.com/verify?code=VELLORE-2024-12345");

    setTimeout(() => {
      onScanned();
    }, 1500);
  };

  return (
    <main className="scanner page-screen">
      <StatusBar />
      <div className="scanner-header">
        <button className="round-btn" onClick={onCancel}>
          <X size={21} />
        </button>
        <div className="scanner-title">
          <div>PROOFPASS</div>
          <b>Scan Verifier QR</b>
        </div>
        <button className="round-btn">
          <Zap size={20} />
        </button>
      </div>

      <div className="verifier-pill">
        <span className="blue-dot"></span>
        Verifier: <b>StudentDeals Partner</b>
        <span className="lock">▮</span>
      </div>

      <div className="camera-container">
        {cameraPermission === "granted" ? (
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className="scan-overlay">
              <div className="corner tl"></div>
              <div className="corner tr"></div>
              <div className="corner bl"></div>
              <div className="corner br"></div>
              <div className={`scan-indicator ${scanStatus}`}>
                {scanStatus === "scanning" && <div className="pulse"></div>}
                {scanStatus === "detected" && (
                  <div className="detected-indicator">✓ QR Detected</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="camera-error">
            <AlertCircle size={48} />
            <p>{errorMessage || "Camera access is required."}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="scan-instructions">
        <b>Point camera at StudentDeals QR</b>
        <p>
          Keep QR code centered inside the frame to verify
          <br />
          Vijay Rohra's credential
        </p>
      </div>

      <div className="scan-actions">
        <button className="simulate-btn" onClick={handleManualScan}>
          <Camera size={16} /> Simulate Scan
        </button>
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="home-indicator"></div>
    </main>
  );
}

function PrivacyGate({ scanResult, onFinish }) {
  return (
    <main className="privacy-page page-screen">
      <StatusBar />
      <div className="privacy-sheet">
        <div className="grabber"></div>

        <div className="gate-icon">
          <Shield size={24} />
        </div>
        <h1>Privacy Gate</h1>
        <p className="request">StudentDeals is requesting credential proof:</p>

        <div className="shared-card">
          <div className="shared-title">● SHARED VIA ZERO-KNOWLEDGE PROOF</div>
          <div className="shared-main">
            <Check size={18} />
            <b>Student Status = Verified</b>
          </div>
          <p>
            Cryptographically proved without exposing private
            <br />
            records or college identity card.
          </p>
        </div>

        <div className="private-card">
          <div className="private-head">
            <span>
              <UserRoundX size={14} /> Information kept private:
            </span>
            <b>100% PROTECTED</b>
          </div>

          <PrivateRow icon={<UserRoundX size={14} />} label="Full Name">
            <span className="redacted">Vijay Rohra</span>
            <em>REDACTED</em>
          </PrivateRow>
          <PrivateRow
            icon={<FileLock2 size={14} />}
            label={
              <>
                Branch /
                <br />
                Major
              </>
            }
          >
            <span className="redacted">
              CSE (Data
              <br />
              Science)
            </span>
            <em>SHIELDED</em>
          </PrivateRow>
          <PrivateRow
            icon={<LockKeyhole size={14} />}
            label={
              <>
                Photo & Reg
                <br />
                Number
              </>
            }
          >
            <span className="redacted dots">••••••••••</span>
            <em>HIDDEN</em>
          </PrivateRow>
        </div>

        {scanResult && (
          <div className="scan-result">
            <small>QR Verified: {scanResult.substring(0, 40)}...</small>
          </div>
        )}

        <button className="approve" onClick={onFinish}>
          <Shield size={16} /> Approve Request
        </button>
        <button className="reject" onClick={onFinish}>
          Reject &amp; Close
        </button>
      </div>
      <div className="bottom-line"></div>
    </main>
  );
}

function PrivateRow({ icon, label, children }) {
  return (
    <div className="private-row">
      <span className="private-icon">{icon}</span>
      <span className="private-label">{label}</span>
      <div className="private-value">{children}</div>
    </div>
  );
}

export default MobilePortraitApp;
