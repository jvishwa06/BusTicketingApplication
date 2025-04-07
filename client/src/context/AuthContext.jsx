import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (formData) => {
    try {
      const response = await axios.post('http://localhost:5001/users/login', formData, { withCredentials: true });
      
      if (response.data.success) {
        const userData = { 
          token: response.data.data.token,
          isAuthenticated: true,
          role: 'user' 
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        try {
          const profileResponse = await axios.get('http://localhost:5001/users/profile', { 
            withCredentials: true,
            headers: { 
              Authorization: `Bearer ${response.data.data.token}` 
            }
          });
          
          if (profileResponse.data.success) {
            const completeUserData = {
              ...userData,
              ...profileResponse.data.data
            };
            setUser(completeUserData);
            localStorage.setItem('user', JSON.stringify(completeUserData));
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5001/users/logout');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);