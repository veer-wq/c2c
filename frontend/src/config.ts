// Set VITE_API_URL to the laptop's LAN API URL (for example,
// http://192.168.x.x:8000) for phone demos. VITE_API_BASE_URL remains a
// backwards-compatible alias. Without either variable, a page opened on a
// LAN hostname uses that same hostname on port 8000 rather than loopback.
const env = (import.meta as any).env || {};
const browserApiUrl = `http://${window.location.hostname}:8000`;
export const API_BASE_URL: string =
  env.VITE_API_URL || env.VITE_API_BASE_URL || browserApiUrl;

// Set VITE_WALLET_PUBLIC_URL to the laptop's LAN URL (for example,
// http://192.168.x.x:5173) when `window.location` is localhost. The QR link
// always points at this public wallet URL and never includes a hard-coded IP.
export const WALLET_PUBLIC_URL: string =
  env.VITE_WALLET_PUBLIC_URL || window.location.origin;

// Demo identity used throughout the flow. This is a hackathon demo, so
// there's a single hardcoded student the Issuer panel creates a credential
// for, and the Wallet loads.
export const DEMO_STUDENT_ID = "DEMO001";
export const DEMO_STUDENT_NAME = "Vijay Rohra";
export const DEMO_ISSUER = "VIT Vellore";
