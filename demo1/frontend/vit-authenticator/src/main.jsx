import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard, Users, ShieldCheck, FileText, Settings,
  KeyRound, Search, Check, X, CircleCheck
} from "lucide-react";
import "./styles.css";

const students = [
  { initials: "DJ", name: "Dhrunil Jumani", reg: "25BCE0673", dept: "Computer Science" },
  { initials: "PS", name: "Pranav Sharma", reg: "25BCE0412", dept: "Computer Science" },
  { initials: "VK", name: "Vijay Kumar", reg: "25BCE0889", dept: "Computer Science" }
];

function App() {
  const [issuedStudent, setIssuedStudent] = useState(null);
  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      `${s.name} ${s.reg} ${s.dept}`.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="vit-box">VIT</div>
          <div>
            <div className="brand-title">VIT Authenticator</div>
            <div className="brand-sub">ENTERPRISE REGISTRAR</div>
          </div>
        </div>

        <div className="nav-label">CORE NAVIGATION</div>

        <nav>
          <NavItem icon={<LayoutDashboard size={14}/>} label="Dashboard" />
          <NavItem active icon={<Users size={14}/>} label="Student Directory" dot />
          <NavItem icon={<ShieldCheck size={14}/>} label="Issued Credentials" />
          <NavItem icon={<FileText size={14}/>} label="Audit Logs" />
          <NavItem icon={<Settings size={14}/>} label="Settings" />
        </nav>

        <div className="sidebar-footer">Vellore Institute of Technology</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="portal-title">
            VIT Registrar Admin
            <span className="portal-badge">Autonomous Portal</span>
          </div>

          <div className="admin">
            <div className="admin-text">
              <strong>Dr. K. Ramanathan</strong>
              <span>Chief Registrar • SEC-ID: #8841</span>
            </div>
            <div className="avatar">KR</div>
          </div>
        </header>

        <section className="content">
          <div className="heading-row">
            <div>
              <h1>Student Identity Roster</h1>
              <p>Authorize, generate, and sign institutional ProofPass verification tokens.</p>
            </div>
            <div className="signing-status">
              <span className="online-dot"></span>
              Ed25519 Signing Key: <b>ONLINE</b>
            </div>
          </div>

          <div className="table-card">
            <div className="table-toolbar">
              <div className="enrolled">
                <strong>Enrolled Candidates</strong>
                <span className="pending">3 Pending Review</span>
              </div>
              <div className="search-box">
                <Search size={13}/>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter roster..."
                />
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>STUDENT NAME</th>
                  <th>REGISTRATION NUMBER</th>
                  <th>DEPARTMENT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.reg}>
                    <td>
                      <div className="student">
                        <span className="initials">{student.initials}</span>
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td><span className="reg">{student.reg}</span></td>
                    <td>{student.dept}</td>
                    <td>
                      <button
                        className="issue-btn"
                        onClick={() => setIssuedStudent(student)}
                      >
                        <KeyRound size={13}/>
                        ISSUE PROOFPASS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              Showing {filteredStudents.length} of {students.length} Active Candidates
            </div>
          </div>
        </section>
      </main>

      {issuedStudent && (
        <div className="modal-backdrop">
          <div className="success-modal">
            <div className="success-icon"><Check size={31}/></div>

            <h2>Credential Issued Successfully</h2>

            <div className="recipient">
              <span>RECIPIENT:</span>
              <b>{issuedStudent.reg}</b>
            </div>

            <div className="crypto-box">
              <div className="crypto-head">
                <span>CRYPTOGRAPHIC SPEC</span>
                <span className="verified"><CircleCheck size={9}/> Verified</span>
              </div>
              <p>
                Cryptographic Signature: <span>Ed25519 (Private Key Match).</span><br/>
                Payload: Student = TRUE, Valid Until: May 2029.
              </p>
            </div>

            <button className="close-btn" onClick={() => setIssuedStudent(null)}>
              Close &amp; Return to Roster
            </button>

            <div className="hardware">
              <ShieldCheck size={11}/>
              Hardware Security Module Signed • Ledger TX #994812
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, dot }) {
  return (
    <div className={`nav-item ${active ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
      {dot && <i className="nav-dot"></i>}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);