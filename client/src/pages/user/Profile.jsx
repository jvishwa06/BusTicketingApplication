import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    companyName: '',
    companyAddress: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/profile');
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          companyName: userData.companyName || '',
          companyAddress: userData.companyAddress || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone
      };
      
      if (user?.role === 'operator') {
        updateData.companyName = formData.companyName;
        updateData.companyAddress = formData.companyAddress;
      }
      
      if (formData.newPassword && formData.currentPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await api.put('/users/profile', updateData);
      
      if (response.data.success) {
        setSuccess('Profile updated successfully');
        setUser({...user, ...updateData});
        setIsEditing(false);
        
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) navigate('/login', { replace: true });
  };
  
  const goToSearchBus = () => {
    navigate('/search-bus');
  };
  
  const goToMyBookings = () => {
    navigate('/my-bookings');
  };

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-container">
          <div className="logo">
            <h1>HYPERBUS</h1>
          </div>
          <nav className="main-nav">
            <ul>
              <li>
                <button className="nav-link" onClick={goToMyBookings}>
                  My Bookings
                </button>
              </li>
              <li>
                <button className="nav-link" onClick={goToSearchBus}>
                  Search Bus
                </button>
              </li>
              <li>
                <button className="nav-link active">
                  Profile
                </button>
              </li>
              <li>
                <button className="nav-link logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <div className="profile-container">
          <h2 className="page-title">My Profile</h2>
          
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          
          <div className="profile-content">
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="profile-title">
                  <h3>{user?.name}</h3>
                  <p className="user-role">{user?.role === 'operator' ? 'Bus Operator' : 'Passenger'}</p>
                </div>
                
                {!isEditing && (
                  <button onClick={toggleEdit} className="profile-edit-button">
                    Edit Profile
                  </button>
                )}
              </div>
              
              {!isEditing ? (
                <div className="profile-details">
                  <div className="profile-info-section">
                    <h4>Personal Information</h4>
                    
                    <div className="info-row">
                      <div className="info-group">
                        <label>Full Name</label>
                        <p>{user?.name}</p>
                      </div>
                      
                      <div className="info-group">
                        <label>Email Address</label>
                        <p>{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <div className="info-group">
                        <label>Phone Number</label>
                        <p>{user?.phone || 'Not provided'}</p>
                      </div>
                      
                      <div className="info-group">
                        <label>Account Type</label>
                        <p>{user?.role === 'operator' ? 'Bus Operator' : 'Passenger'}</p>
                      </div>
                    </div>
                    
                    {user?.role === 'operator' && (
                      <div className="info-section">
                        <h4>Company Information</h4>
                        
                        <div className="info-row">
                          <div className="info-group full-width">
                            <label>Company Name</label>
                            <p>{user?.companyName || 'Not provided'}</p>
                          </div>
                        </div>
                        
                        <div className="info-row">
                          <div className="info-group full-width">
                            <label>Company Address</label>
                            <p>{user?.companyAddress || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-section">
                    <h4>Update Profile Information</h4>
                    
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div className="form-field">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    
                    <div className="form-field disabled">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                      />
                      <small>Email cannot be changed</small>
                    </div>
                  </div>
                  
                  {user?.role === 'operator' && (
                    <div className="form-section">
                      <h4>Company Information</h4>
                      <p className="section-subtitle">Company details (read-only)</p>
                      
                      <div className="form-field disabled">
                        <label htmlFor="companyName">Company Name</label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          value={formData.companyName || 'Not provided'}
                          disabled
                        />
                      </div>
                      
                      <div className="form-field disabled">
                        <label htmlFor="companyAddress">Company Address</label>
                        <input
                          type="text"
                          id="companyAddress"
                          name="companyAddress"
                          value={formData.companyAddress || 'Not provided'}
                          disabled
                        />
                      </div>
                      <small>Contact support to update company information</small>
                    </div>
                  )}
                  
                  <div className="form-section">
                    <h4>Change Password</h4>
                    <p className="section-subtitle">Leave blank if you don't want to change your password</p>
                    
                    <div className="form-field">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter your current password"
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password"
                        />
                      </div>
                      
                      <div className="form-field">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={toggleEdit} 
                      className="cancel-button" 
                      style={{ height: '42px', padding: '0 24px', lineHeight: '42px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="save-button"
                      style={{ height: '42px', padding: '0 24px', lineHeight: '42px' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
