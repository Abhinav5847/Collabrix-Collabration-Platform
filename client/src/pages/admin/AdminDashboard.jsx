import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminPortalData } from "../../store/slices/adminSlice";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdPeople, MdWorkspaces, MdDescription, MdVideoCall } from "react-icons/md";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminPortalData());
  }, [dispatch]);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  // Mock data for the "Flow" visualization based on totals
  const flowData = [
    { name: 'Start', val: 0 },
    { name: 'Users', val: stats.users?.total || 0 },
    { name: 'Workspaces', val: stats.workspaces?.total || 0 },
    { name: 'Docs', val: stats.docs?.total || 0 },
  ];

  return (
    <div className="animate__animated animate__fadeIn">
      <h3 className="fw-bold mb-4 text-dark">Platform Analytics</h3>

      <div className="row g-4 mb-5">
        {[
          { label: "Total Users", val: stats.users?.total, icon: <MdPeople />, color: "bg-primary" },
          { label: "Active Workspaces", val: stats.workspaces?.total, icon: <MdWorkspaces />, color: "bg-success" },
          { label: "Documents", val: stats.docs?.total, icon: <MdDescription />, color: "bg-info" },
          { label: "AI Meetings", val: stats.meetings?.total, icon: <MdVideoCall />, color: "bg-dark" },
        ].map((item, i) => (
          <div className="col-md-3" key={i}>
            <div className="card border-0 shadow-sm p-4 h-100">
              <div className={`${item.color} bg-opacity-10 p-3 rounded-circle d-inline-block mb-3 text-center`} style={{width: '50px'}}>
                <span className={item.color.replace('bg-', 'text-')}>{item.icon}</span>
              </div>
              <h6 className="text-muted small fw-bold text-uppercase">{item.label}</h6>
              <h2 className="fw-bold mb-0">{item.val}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm p-4">
        <h5 className="fw-bold mb-4">Platform Growth Flow</h5>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <AreaChart data={flowData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="val" stroke="#0d6efd" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;