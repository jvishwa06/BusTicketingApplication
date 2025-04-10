import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    companyName: '',
    companyAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setFormData({ ...formData, role: role });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const dataToSend = { ...formData };
    delete dataToSend.confirmPassword;

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5001/users/register', dataToSend);
      
      if (response.data.success) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create your Account</h2>
            <p className="auth-subtitle">Join BusBooking to book tickets for your journey</p>
          </div>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="role-selection-container">
              <label className="form-label">I am a</label>
              <div className="role-selection">
                <button
                  type="button"
                  className={`role-button ${selectedRole === 'user' ? 'active' : ''}`}
                  onClick={() => handleRoleChange('user')}
                >
                  <span className="role-icon">👤</span>
                  <span>Passenger</span>
                </button>
                <button
                  type="button"
                  className={`role-button ${selectedRole === 'operator' ? 'active' : ''}`}
                  onClick={() => handleRoleChange('operator')}
                >
                  <span className="role-icon">🚍</span>
                  <span>Bus Operator</span>
                </button>
              </div>
            </div>
            
            {selectedRole && (
              <div className="form-fields">
                <div className="form-field">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
                
                {selectedRole === 'operator' && (
                  <>
                    <div className="form-field">
                      <label htmlFor="companyName">Company Name</label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Enter your company name"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="companyAddress">Company Address</label>
                      <textarea
                        id="companyAddress"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleChange}
                        placeholder="Enter your company address"
                        required
                      ></textarea>
                    </div>
                  </>
                )}
                
                <div className="form-action">
                  <button
                    type="submit"
                    className="auth-button"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
