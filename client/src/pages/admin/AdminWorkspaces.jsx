import React from "react";
import { useSelector } from "react-redux";
import { MdWorkspaces, MdSearch } from "react-icons/md";

const AdminWorkspaces = () => {
  const { management, loading } = useSelector((state) => state.admin);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark">Workspace Management</h3>
        <div className="badge bg-primary px-3 py-2">{management.workspaces.length} Total Workspaces</div>
      </div>

      <div className="card border-0 shadow-sm p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Workspace Name</th>
                <th>Owner Email</th>
                <th>Created Date</th>
                <th className="text-end">Management</th>
              </tr>
            </thead>
            <tbody>
              {management.workspaces.map((ws) => (
                <tr key={ws.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light p-2 rounded text-primary"><MdWorkspaces /></div>
                      <span className="fw-bold">{ws.name}</span>
                    </div>
                  </td>
                  <td>{ws.owner__email}</td>
                  <td className="text-muted">{new Date(ws.created_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkspaces;