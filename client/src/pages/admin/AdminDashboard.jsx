import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminPortalData } from "../../store/slices/adminSlice";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { MdPeople, MdWorkspaces, MdDescription, MdVideoCall } from "react-icons/md";

/* ─── inline styles ─────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .adm-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f8;
    min-height: 100vh;
    padding: 1.5rem;
  }

  .adm-header-pill {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
    border-radius: 14px;
    padding: 0.45rem 1rem;
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: inline-block;
    margin-bottom: 0.5rem;
  }
  .adm-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.4rem, 4vw, 2rem);
    font-weight: 800;
    color: #0f0f1a;
    margin: 0 0 0.2rem;
    line-height: 1.1;
  }
  .adm-subtitle {
    font-size: 0.82rem;
    color: #7b8099;
    margin: 0;
  }

  .adm-stat-card {
    background: #fff;
    border-radius: 20px;
    padding: 1.4rem 1.5rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    height: 100%;
  }
  .adm-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  }
  .adm-stat-accent {
    position: absolute;
    top: -20px; right: -20px;
    width: 90px; height: 90px;
    border-radius: 50%;
    opacity: 0.1;
  }
  .adm-stat-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    margin-bottom: 1rem;
  }
  .adm-stat-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9aa0b8;
    margin-bottom: 0.3rem;
  }
  .adm-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.6rem, 3.5vw, 2.2rem);
    font-weight: 800;
    color: #0f0f1a;
    line-height: 1;
  }

  .adm-chart-card {
    background: #fff;
    border-radius: 20px;
    padding: 1.6rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    height: 100%;
  }
  .adm-chart-title {
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #0f0f1a;
    margin-bottom: 0.2rem;
  }
  .adm-chart-desc {
    font-size: 0.78rem;
    color: #9aa0b8;
    margin-bottom: 1.4rem;
  }

  .adm-tooltip {
    background: #1a1a2e;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.5rem 0.9rem;
    font-size: 0.8rem;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  }

  .adm-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60vh;
    flex-direction: column;
    gap: 1rem;
  }
  .adm-spinner {
    width: 44px; height: 44px;
    border: 3px solid #e4e6f0;
    border-top-color: #1a1a2e;
    border-radius: 50%;
    animation: adm-spin 0.8s linear infinite;
  }
  @keyframes adm-spin { to { transform: rotate(360deg); } }

  @keyframes adm-fadein {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .adm-fadein { animation: adm-fadein 0.5s ease both; }
  .adm-d1 { animation-delay: 0.05s; }
  .adm-d2 { animation-delay: 0.12s; }
  .adm-d3 { animation-delay: 0.19s; }
  .adm-d4 { animation-delay: 0.26s; }
  .adm-d5 { animation-delay: 0.33s; }
  .adm-d6 { animation-delay: 0.40s; }
`;

const PALETTE = {
  users:      { bg: '#eef2ff', icon: '#4361ee', accent: '#4361ee' },
  workspaces: { bg: '#ecfdf5', icon: '#059669', accent: '#059669' },
  docs:       { bg: '#fff7ed', icon: '#ea580c', accent: '#ea580c' },
  meetings:   { bg: '#fdf4ff', icon: '#9333ea', accent: '#9333ea' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="adm-tooltip">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || '#a5b4fc' }}>
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminPortalData());
  }, [dispatch]);

  if (loading) return (
    <div className="adm-loader">
      <style>{css}</style>
      <div className="adm-spinner" />
      <span style={{ fontFamily: 'DM Sans', color: '#7b8099', fontSize: '0.85rem' }}>
        Loading analytics…
      </span>
    </div>
  );

  // ── only real data from stats ──────────────────────────────────────────
  const u = stats.users?.total      || 0;
  const w = stats.workspaces?.total || 0;
  const d = stats.docs?.total       || 0;
  const m = stats.meetings?.total   || 0;

  // Original flowData from your code — untouched
  const flowData = [
    { name: 'Start',      val: 0 },
    { name: 'Users',      val: u },
    { name: 'Workspaces', val: w },
    { name: 'Docs',       val: d },
  ];

  // Bar chart derived from the same real totals
  const barData = [
    { name: 'Users',      val: u, color: PALETTE.users.accent      },
    { name: 'Workspaces', val: w, color: PALETTE.workspaces.accent  },
    { name: 'Docs',       val: d, color: PALETTE.docs.accent        },
    { name: 'Meetings',   val: m, color: PALETTE.meetings.accent    },
  ];

  const statCards = [
    { label: "Total Users",       val: u, icon: <MdPeople />,      key: 'users'      },
    { label: "Active Workspaces", val: w, icon: <MdWorkspaces />,  key: 'workspaces' },
    { label: "Documents",         val: d, icon: <MdDescription />, key: 'docs'       },
    { label: "AI Meetings",       val: m, icon: <MdVideoCall />,   key: 'meetings'   },
  ];

  return (
    <div className="adm-root">
      <style>{css}</style>

      {/* header */}
      <div className="adm-fadein adm-d1 mb-4">
        <div className="adm-header-pill">Admin Console</div>
        <h1 className="adm-title">Platform Analytics</h1>
        <p className="adm-subtitle">Live overview of your platform data</p>
      </div>

      {/* stat cards */}
      <div className="row g-3 mb-4">
        {statCards.map((item, i) => {
          const pal = PALETTE[item.key];
          return (
            <div className={`col-6 col-lg-3 adm-fadein adm-d${i + 1}`} key={i}>
              <div className="adm-stat-card">
                <div className="adm-stat-accent" style={{ background: pal.accent }} />
                <div className="adm-stat-icon" style={{ background: pal.bg, color: pal.icon }}>
                  {item.icon}
                </div>
                <div className="adm-stat-label">{item.label}</div>
                <div className="adm-stat-value">{item.val?.toLocaleString() ?? '—'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* charts */}
      <div className="row g-3">
        {/* area chart — original flowData, improved styling */}
        <div className="col-12 col-lg-7 adm-fadein adm-d5">
          <div className="adm-chart-card">
            <div className="adm-chart-title">Platform Growth Flow</div>
            <div className="adm-chart-desc">Cumulative totals across platform stages</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={flowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4361ee" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4361ee" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f1f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa0b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa0b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="val"
                  name="Total"
                  stroke="#4361ee"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVal)"
                  dot={{ r: 5, fill: '#4361ee', strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-12 col-lg-5 adm-fadein adm-d6">
          <div className="adm-chart-card">
            <div className="adm-chart-title">Category Totals</div>
            <div className="adm-chart-desc">Total count per platform entity</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f1f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa0b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9aa0b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="val" name="Total" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;