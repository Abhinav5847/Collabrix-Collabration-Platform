import { useState } from "react";

const mockDocuments = [
  { id: 1, title: "Q4 Product Roadmap", workspace: "Product Team", updatedAt: "2 min ago", editors: ["AJ", "SK", "MR"], role: "editor", online: 3, starred: true, color: "#6366f1" },
  { id: 2, title: "API Design Specification", workspace: "Engineering", updatedAt: "18 min ago", editors: ["RK", "PL"], role: "editor", online: 1, starred: true, color: "#0ea5e9" },
  { id: 3, title: "Marketing Campaign Brief", workspace: "Marketing", updatedAt: "1 hr ago", editors: ["NS", "TW", "AJ", "BM"], role: "viewer", online: 0, starred: false, color: "#f59e0b" },
  { id: 4, title: "Sprint Planning Notes", workspace: "Engineering", updatedAt: "3 hrs ago", editors: ["MR", "RK"], role: "editor", online: 0, starred: false, color: "#10b981" },
  { id: 5, title: "Brand Guidelines v2", workspace: "Design", updatedAt: "Yesterday", editors: ["SK", "NS"], role: "viewer", online: 0, starred: false, color: "#ec4899" },
  { id: 6, title: "Investor Deck 2025", workspace: "Executive", updatedAt: "2 days ago", editors: ["BM"], role: "viewer", online: 0, starred: true, color: "#8b5cf6" },
];

const mockActivity = [
  { id: 1, user: "Arjun J", avatar: "AJ", action: "edited", doc: "Q4 Product Roadmap", time: "2 min ago", color: "#6366f1" },
  { id: 2, user: "Sara K", avatar: "SK", action: "commented on", doc: "API Design Specification", time: "15 min ago", color: "#0ea5e9" },
  { id: 3, user: "Meera R", avatar: "MR", action: "shared", doc: "Sprint Planning Notes", time: "1 hr ago", color: "#10b981" },
  { id: 4, user: "Raj K", avatar: "RK", action: "created", doc: "Backend Architecture v3", time: "2 hrs ago", color: "#f59e0b" },
  { id: 5, user: "Priya L", avatar: "PL", action: "mentioned you in", doc: "API Design Specification", time: "3 hrs ago", color: "#ec4899" },
];

const workspaces = ["All Workspaces", "Engineering", "Product Team", "Marketing", "Design", "Executive"];

const stats = [
  { label: "Total Documents", value: "128", change: "+12", up: true, icon: "📄" },
  { label: "Active Collaborators", value: "24", change: "+3", up: true, icon: "👥" },
  { label: "Edits Today", value: "347", change: "+89", up: true, icon: "✏️" },
  { label: "Pending Reviews", value: "9", change: "-2", up: false, icon: "🔔" },
];

function Avatar({ initials, color, size = 32, border = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "22", border: border ? `2px solid #1a1d2e` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, color: color,
      fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
    }}>{initials}</div>
  );
}

function AvatarStack({ editors, max = 3 }) {
  const colors = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];
  const shown = editors.slice(0, max);
  const rest = editors.length - max;
  return (
    <div style={{ display: "flex", marginLeft: 4 }}>
      {shown.map((e, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}>
          <Avatar initials={e} color={colors[i % colors.length]} size={26} border />
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          width: 26, height: 26, borderRadius: "50%", background: "#2a2d42",
          border: "2px solid #1a1d2e", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, color: "#9ca3af",
          fontWeight: 600, marginLeft: -8, zIndex: 0, flexShrink: 0,
        }}>+{rest}</div>
      )}
    </div>
  );
}

function DocCard({ doc, onOpen }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      style={{
        background: hovered ? "#1e2235" : "#171a2b",
        border: `1px solid ${hovered ? doc.color + "55" : "#252840"}`,
        borderRadius: 14, padding: "20px", cursor: "pointer",
        transition: "all 0.2s ease", position: "relative", overflow: "hidden",
      }}
    >

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: doc.color, borderRadius: "14px 14px 0 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: doc.color + "18",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>📄</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {doc.online > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#10b98118", borderRadius: 20, padding: "3px 8px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>{doc.online} live</span>
            </div>
          )}
          {doc.starred && <span style={{ fontSize: 14, color: "#f59e0b" }}>★</span>}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 6, lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>
        {doc.title}
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{
          fontSize: 11, color: doc.color, background: doc.color + "18",
          padding: "3px 8px", borderRadius: 20, fontWeight: 500,
        }}>{doc.workspace}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <AvatarStack editors={doc.editors} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>{doc.updatedAt}</span>
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600,
            background: doc.role === "editor" ? "#6366f118" : "#64748b18",
            color: doc.role === "editor" ? "#818cf8" : "#64748b",
          }}>{doc.role}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeWorkspace, setActiveWorkspace] = useState("All Workspaces");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);

  const filtered = mockDocuments.filter(d => {
    const wsMatch = activeWorkspace === "All Workspaces" || d.workspace === activeWorkspace;
    const qMatch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    return wsMatch && qMatch;
  });

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "documents", label: "My Documents", icon: "📄" },
    { id: "shared", label: "Shared With Me", icon: "👥" },
    { id: "starred", label: "Starred", icon: "★" },
    { id: "activity", label: "Activity", icon: "⚡" },
    { id: "trash", label: "Trash", icon: "🗑" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f1120; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252840; border-radius: 2px; }
        .nav-item:hover { background: #1e2235 !important; }
        .new-btn:hover { background: #4f46e5 !important; transform: translateY(-1px); }
        .search-input:focus { outline: none; border-color: #6366f155 !important; }
        .ws-chip:hover { background: #1e2235 !important; cursor: pointer; }
        .icon-btn:hover { background: #1e2235 !important; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#0f1120", color: "#f1f5f9", overflow: "hidden" }}>

        {sidebarOpen && (
          <div style={{ width: 240, background: "#12152a", borderRight: "1px solid #1e2235", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Logo */}
            <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1e2235" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>CollabSpace</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>WORKSPACE</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 14px 8px" }}>
              <button className="new-btn" style={{
                width: "100%", padding: "10px", borderRadius: 10, border: "none",
                background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Document
              </button>
            </div>

            <nav style={{ padding: "8px 10px", flex: 1 }}>
              {navItems.map(item => (
                <div
                  key={item.id}
                  className="nav-item"
                  onClick={() => setActiveNav(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 9, marginBottom: 2,
                    cursor: "pointer", transition: "background 0.15s",
                    background: activeNav === item.id ? "#1e2235" : "transparent",
                    borderLeft: activeNav === item.id ? "2px solid #6366f1" : "2px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: activeNav === item.id ? 600 : 400, color: activeNav === item.id ? "#a5b4fc" : "#94a3b8" }}>{item.label}</span>
                  {item.id === "activity" && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />}
                </div>
              ))}
            </nav>

            <div style={{ padding: "12px 14px", borderTop: "1px solid #1e2235" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>Workspaces</div>
              {["Engineering","Product Team","Marketing","Design"].map((ws, i) => {
                const colors = ["#6366f1","#0ea5e9","#f59e0b","#ec4899"];
                return (
                  <div key={ws} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 7, marginBottom: 2, cursor: "pointer" }}
                    className="nav-item">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{ws}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "14px", borderTop: "1px solid #1e2235" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar initials="YO" color="#6366f1" size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>You (Owner)</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>you@email.com</div>
                </div>
                <div style={{ fontSize: 16, color: "#475569", cursor: "pointer" }}>⋯</div>
              </div>
            </div>
          </div>
        )}


        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>


          <div style={{ background: "#12152a", borderBottom: "1px solid #1e2235", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <button className="icon-btn" onClick={() => setSidebarOpen(v => !v)}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", padding: "6px 8px", borderRadius: 7, transition: "background 0.15s" }}>
              ☰
            </button>

            <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
              <input
                className="search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                style={{
                  width: "100%", background: "#1a1d2e", border: "1px solid #252840",
                  borderRadius: 9, padding: "8px 12px 8px 36px", color: "#f1f5f9",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "border 0.2s",
                }}
              />
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
  
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#10b98112", border: "1px solid #10b98130", borderRadius: 20, padding: "5px 12px" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>4 online</span>
              </div>

              <div style={{ position: "relative" }}>
                <button className="icon-btn" onClick={() => setNotifOpen(v => !v)}
                  style={{ background: "#1a1d2e", border: "1px solid #252840", color: "#94a3b8", fontSize: 15, cursor: "pointer", padding: "7px 10px", borderRadius: 9, transition: "background 0.15s" }}>
                  🔔
                  <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#6366f1", border: "2px solid #12152a" }} />
                </button>
                {notifOpen && (
                  <div style={{ position: "absolute", right: 0, top: 44, width: 280, background: "#12152a", border: "1px solid #1e2235", borderRadius: 12, padding: 12, zIndex: 100, boxShadow: "0 20px 40px #00000060" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Notifications</div>
                    {mockActivity.slice(0, 3).map(a => (
                      <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e2235" }}>
                        <Avatar initials={a.avatar} color={a.color} size={28} />
                        <div>
                          <div style={{ fontSize: 12, color: "#cbd5e1" }}><b style={{ color: "#f1f5f9" }}>{a.user}</b> {a.action} <b style={{ color: "#a5b4fc" }}>{a.doc}</b></div>
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Avatar initials="YO" color="#6366f1" size={34} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>

            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 4 }}>Good morning, You 👋</h1>
              <p style={{ fontSize: 14, color: "#64748b" }}>Here's what's happening across your workspaces today.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
              {stats.map((s, i) => {
                const colors = ["#6366f1","#0ea5e9","#10b981","#f59e0b"];
                return (
                  <div key={i} style={{ background: "#12152a", border: "1px solid #1e2235", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 14px 0 100%", background: colors[i] + "10" }} />
                    <div style={{ fontSize: 20, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-1px", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{s.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11, color: s.up ? "#10b981" : "#f43f5e", fontWeight: 600 }}>{s.up ? "▲" : "▼"} {s.change}</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>vs yesterday</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All Workspaces", "Engineering", "Product Team", "Marketing"].map(ws => (
                      <button key={ws} className="ws-chip"
                        onClick={() => setActiveWorkspace(ws)}
                        style={{
                          padding: "5px 12px", borderRadius: 20, border: "1px solid",
                          fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                          fontFamily: "'DM Sans', sans-serif",
                          borderColor: activeWorkspace === ws ? "#6366f1" : "#252840",
                          background: activeWorkspace === ws ? "#6366f118" : "transparent",
                          color: activeWorkspace === ws ? "#a5b4fc" : "#64748b",
                        }}>
                        {ws}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: "#475569" }}>{filtered.length} documents</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {filtered.map(doc => (
                    <DocCard key={doc.id} doc={doc} onOpen={() => {}} />
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#475569" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                      <div style={{ fontSize: 14 }}>No documents found</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    
                <div style={{ background: "#12152a", border: "1px solid #1e2235", borderRadius: 14, padding: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Live Now</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                  </div>
                  {[
                    { doc: "Q4 Product Roadmap", user: "Arjun J", avatar: "AJ", color: "#6366f1" },
                    { doc: "API Design Spec", user: "Raj K", avatar: "RK", color: "#0ea5e9" },
                    { doc: "Sprint Notes", user: "Meera R", avatar: "MR", color: "#10b981" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "1px solid #1e2235" : "none" }}>
                      <Avatar initials={item.avatar} color={item.color} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.doc}</div>
                        <div style={{ fontSize: 11, color: "#475569" }}>{item.user} is editing</div>
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                    </div>
                  ))}
                </div>

                {/* Activity feed */}
                <div style={{ background: "#12152a", border: "1px solid #1e2235", borderRadius: 14, padding: "18px", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 14 }}>Recent Activity</div>
                  {mockActivity.map((a, i) => (
                    <div key={a.id} style={{ display: "flex", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: i < mockActivity.length - 1 ? "1px solid #1a1d2e" : "none", position: "relative" }}>
                      {i < mockActivity.length - 1 && (
                        <div style={{ position: "absolute", left: 13, top: 30, bottom: -12, width: 1, background: "#1e2235" }} />
                      )}
                      <Avatar initials={a.avatar} color={a.color} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{a.user}</span>{" "}
                          {a.action}{" "}
                          <span style={{ color: "#a5b4fc", fontWeight: 500 }}>{a.doc}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                  <button style={{
                    width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #252840",
                    background: "transparent", color: "#64748b", fontSize: 12, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                  }}>View all activity →</button>
                </div>

                <div style={{ background: "#12152a", border: "1px solid #1e2235", borderRadius: 14, padding: "18px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>Quick Actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "New Document", icon: "📄", color: "#6366f1" },
                      { label: "Invite Member", icon: "👤", color: "#0ea5e9" },
                      { label: "New Workspace", icon: "🏢", color: "#10b981" },
                    ].map((action, i) => (
                      <button key={i} className="nav-item" style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 9, border: "1px solid #252840",
                        background: "transparent", cursor: "pointer", transition: "background 0.15s",
                        fontFamily: "'DM Sans', sans-serif", textAlign: "left", width: "100%",
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: action.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{action.icon}</div>
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
