import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleUserStatus } from "../../store/slices/adminSlice";
import { MdBlock, MdCheckCircle, MdPerson } from "react-icons/md";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { management, loading } = useSelector((state) => state.admin);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark">Verified Users</h3>
        <div className="badge bg-success px-3 py-2">{management.users.length} Verified Users</div>
      </div>

      <div className="card border-0 shadow-sm p-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>User Info</th>
                <th>Email Address</th>
                <th>Joined</th>
                <th>Account Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {management.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-soft-primary p-2 rounded-circle text-primary"><MdPerson /></div>
                      <span className="fw-bold">{u.username}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td className="small text-muted">{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge rounded-pill ${u.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button 
                      onClick={() => dispatch(toggleUserStatus(u.id))}
                      className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    >
                      {u.is_active ? <><MdBlock className="me-1" /> Deactivate</> : <><MdCheckCircle className="me-1" /> Activate</>}
                    </button>
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

export default AdminUsers;