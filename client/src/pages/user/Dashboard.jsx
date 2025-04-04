import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="dashboard">
      <nav className="nav-header">
        <div className="container nav-content">
          <h1 className="nav-title">User Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <div className="container dashboard-content">
        <div className="card">
          <h2 className="card-title">Your Account Information</h2>
          <div className="info-grid">
            <div>
              <p className="info-item-label">Name</p>
              <p className="info-item-value">{user?.name}</p>
            </div>
            <div>
              <p className="info-item-label">Email</p>
              <p className="info-item-value">{user?.email}</p>
            </div>
            <div>
              <p className="info-item-label">Phone</p>
              <p className="info-item-value">{user?.phone}</p>
            </div>
            <div>
              <p className="info-item-label">Role</p>
              <p className="info-item-value" style={{ textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
