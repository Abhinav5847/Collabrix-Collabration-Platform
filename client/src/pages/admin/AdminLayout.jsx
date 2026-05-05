import React from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom"; // Added Outlet
import { useDispatch, useSelector } from "react-redux";
import { 
  MdDashboard, 
  MdPeople, 
  MdSettings, 
  MdLogout, 
  MdSecurity 
} from "react-icons/md";
import { logout } from "../../store/slices/authSlice";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Accessing the user state from Redux
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/collabrix_admin", icon: <MdDashboard size={20} /> },
    { name: "Users", path: "/admin/users", icon: <MdPeople size={20} /> },
    { name: "Security", path: "/admin/security", icon: <MdSecurity size={20} /> },
    { name: "Settings", path: "/admin/settings", icon: <MdSettings size={20} /> },
  ];

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <aside 
        className="bg-dark text-white d-flex flex-column p-3" 
        style={{ width: "260px", position: "fixed", height: "100vh", zIndex: 1000 }}
      >
        <div className="mb-4 px-2">
          <h4 className="fw-bold text-primary mb-0">Collabrix</h4>
          <small className="text-muted fw-bold">ADMIN CONSOLE</small>
        </div>

        <nav className="nav nav-pills flex-column mb-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/collabrix_admin"} // Prevents dashboard from staying active
              className={({ isActive }) => 
                `nav-link text-white d-flex align-items-center gap-3 mb-2 ${isActive ? "active bg-primary" : "opacity-75"}`
              }
            >
              {item.icon} {item.name}
            </NavLink>
          ))}
        </nav>

        <hr className="text-muted" />
        
        <button 
          onClick={handleLogout}
          className="btn btn-link text-danger text-decoration-none d-flex align-items-center gap-3 px-2 py-2"
        >
          <MdLogout size={20} /> <span>Sign Out</span>
        </button>
      </aside>

      <main className="flex-grow-1" style={{ marginLeft: "260px" }}>
        <header 
          className="bg-white border-bottom px-4 py-2 sticky-top d-flex justify-content-between align-items-center"
          style={{ height: "64px" }}
        >
          <div className="text-muted small fw-medium">
            Project: <span className="text-dark">Collabrix_v1</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div className="fw-bold small">{user?.username || user?.email?.split('@')[0] || "Admin"}</div>
              <div className="text-muted x-small" style={{ fontSize: "0.7rem" }}>Staff Account</div>
            </div>
            <div 
              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
              style={{ width: "38px", height: "38px" }}
            >
              {(user?.username?.[0] || user?.email?.[0] || "A").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4">
          <div className="container-fluid p-0">
            {/* CRITICAL FIX: The Outlet component renders the child routes */}
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;