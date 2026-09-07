# ProofPass Wallet - Mobile Portrait View with Camera QR Scanning

This is an enhanced version of the ProofPass Wallet with real camera support and QR code scanning functionality optimized for mobile portrait view.

## Features

✨ **Real Camera Integration**
- Requests camera permission on app load
- Continuous QR code scanning from live camera feed
- Auto-detection and transition when QR is recognized
- Graceful error handling for camera access denial

🔍 **QR Code Scanning**
- Uses `jsQR` library for accurate QR detection
- Scans at 100ms intervals for responsive detection
- Displays scanning status (scanning, detected, error)
- Visual feedback with pulse animation during scanning
- Simulated scan button for testing without real camera

📱 **Mobile Portrait Optimized**
- Full-screen portrait layout
- Touch-friendly buttons and interactive elements
- Smooth transitions between wallet, scanner, and privacy gate
- Status bar, home indicator, and mobile aesthetics
- Responsive to different screen sizes (320px - 480px width)

🔒 **Privacy & Security**
- Zero-knowledge proof verification display
- Protected information indication (redacted, shielded, hidden)
- Clear privacy policy communication
- Secure credential sharing flow

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - Vite will output a localhost URL (typically `http://localhost:5173`)
   - Open this URL in your browser or mobile device

### Using on Mobile Device

For testing on actual mobile devices:

1. Get your local machine's IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. Access from mobile:
   - Connect mobile to same WiFi network
   - Visit `http://<YOUR_IP>:5173` on mobile browser

3. Grant Camera Permission
   - When prompted, allow camera access
   - The app will start scanning QR codes immediately

## Usage Flow

### 1. **Wallet Screen**
   - Display user's ProofPass credentials
   - Shows student ID card with verification status
   - Tap "Scan QR to Verify" to initiate verification

### 2. **Scanner Screen**
   - Live camera feed displays automatically
   - Shows QR scanning frame with corner indicators
   - Displays verifier information (StudentDeals Partner)
   - **Real scanning**: Point camera at QR code
   - **Test scanning**: Use "Simulate Scan" button

### 3. **Privacy Gate Screen**
   - Shows what data is being shared (Student Status = Verified)
   - Displays what information stays private (100% protected)
   - Shows zero-knowledge proof method
   - Approve or reject the verification request

## Building for Production

```bash
npm run build
```

Build output will be in the `dist/` directory. This can be deployed to any static hosting service.

## Architecture

### Components

- **MobilePortraitApp**: Main app container managing page state
- **StatusBar**: Mobile status bar with time and signal
- **Wallet**: Main wallet display with credentials
- **Scanner**: Live camera QR code scanner
- **PrivacyGate**: Privacy verification gate screen
- **PrivateRow**: Privacy information display component

### Key Files

- `src/MobilePortraitApp.jsx` - Main component with camera/QR logic
- `src/mobile-styles.css` - Complete mobile styling
- `src/main-mobile.jsx` - Mobile app entry point
- `package.json` - Updated with jsQR dependency

### State Management

```javascript
// Main app state
const [page, setPage] = useState("wallet");           // Current page
const [cameraActive, setCameraActive] = useState();   // Camera status
const [scanResult, setScanResult] = useState();       // QR scan result
```

### Camera & QR Scanning Flow

1. Scanner component mounts → Request camera permission
2. On permission granted → Start video stream
3. Draw video frames to canvas → Run jsQR detection
4. QR detected → Display confirmation → Auto-navigate
5. User can also click "Simulate Scan" for testing
6. On cancel → Stop camera stream, cleanup

## Troubleshooting

### Camera Not Working
- **Issue**: Camera permission denied
  - Solution: Check browser settings and grant camera permission
  - Solution: Try in HTTPS environment (required by some browsers)

- **Issue**: "No camera device found"
  - Solution: Ensure device has a camera
  - Solution: Check if camera is being used by another app

### QR Not Detecting
- **Issue**: QR code not being detected
  - Solution: Ensure good lighting
  - Solution: Keep QR code centered in frame
  - Solution: Use "Simulate Scan" button to test flow

### Performance Issues
- **Issue**: App runs slowly
  - Solution: Close other browser tabs
  - Solution: Clear browser cache
  - Solution: Use latest Chrome/Safari version

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | All features supported |
| Safari | ✅ Full | Requires iOS 15+, HTTPS on mobile |
| Firefox | ✅ Full | Works well on desktop and mobile |
| Edge | ✅ Full | Chromium-based, full support |
| Opera | ✅ Full | Chromium-based, full support |

## Dependencies

```json
{
  "react": "^18.3.1",           // UI framework
  "react-dom": "^18.3.1",       // React DOM renderer
  "lucide-react": "^0.468.0",   // Icon library
  "jsqr": "^1.4.0",             // QR code detection
  "vite": "^6.0.5"              // Build tool
}
```

## Testing

### Manual Testing Checklist
- [ ] Camera permission prompt appears
- [ ] Camera feed displays in scanner
- [ ] Scanning frame with corners shows correctly
- [ ] Simulate Scan button triggers detection
- [ ] QR detection shows "✓ QR Detected"
- [ ] Auto-navigate to privacy gate after 1.5s
- [ ] Cancel button returns to wallet
- [ ] Approve/Reject buttons work
- [ ] All buttons are touch-friendly
- [ ] Mobile layout looks correct on different screen sizes

### Test Data

**Simulated QR Result:**
```
https://studentdeals.com/verify?code=VELLORE-2024-12345
```

**Student Information:**
- Name: Vijay Rohra
- University: VIT Vellore
- Program: CSE (Data Science)
- Year: 3rd Year
- Valid Until: May 2027

## Performance Optimization

- QR scanning runs at 100ms intervals (adjustable)
- Canvas operations limited to when video is ready
- Proper cleanup of camera streams on unmount
- CSS animations use GPU acceleration
- Minimal re-renders through React state optimization

## Security Considerations

- Camera stream is only used locally in browser
- No data is sent to backend during scanning
- QR code results are passed only within component state
- Privacy Gate shows zero-knowledge proof architecture
- Personal data remains protected and encrypted

## Future Enhancements

- [ ] Support for multiple credential types
- [ ] Backend integration for actual verification
- [ ] Biometric authentication
- [ ] Offline mode with cached credentials
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Credential expiry notifications
- [ ] Transaction history tracking
- [ ] NFC scanning support
- [ ] Batch credential verification

## Contributing

Feel free to fork, modify, and submit pull requests for improvements.

## License

This project is part of the C2C (Credential to Credential) initiative.

## Support

For issues, questions, or suggestions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Test with "Simulate Scan" button first
4. Try on a different device or browser
5. File an issue with detailed error description

---

**Last Updated:** 2026-09-07
**Mobile Portrait Wallet v1.0.0 with Camera QR Scanning**
