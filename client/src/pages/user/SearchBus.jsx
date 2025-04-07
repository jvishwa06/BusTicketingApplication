import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';

const SearchBus = () => {
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    date: ''
  });
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    const success = await logout();
    if (success) navigate('/login', { replace: true });
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = async () => {
    setError('');
    setResults([]);
    try {
      setLoading(true);
      const response = await api.get('/trips/search', {
        params: formData
      });
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError('No trips found for the given criteria.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <button className="btn btn-secondary" onClick={goToProfile}>
          Profile
        </button>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <h2 className="search-title">Search for Buses</h2>
      <div className="form-group">
        <label htmlFor="source" className="form-label">Source</label>
        <input
          type="text"
          id="source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="destination" className="form-label">Destination</label>
        <input
          type="text"
          id="destination"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="date" className="form-label">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleSearch}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="results">
        {results.length > 0 ? (
          results.map((trip) => (
            <div key={trip._id} className="result-card">
              <h3>{trip.busId?.name || 'Unknown Bus'} ({trip.busId?.type || 'N/A'})</h3>
              <p><strong>From:</strong> {trip.source}</p>
              <p><strong>To:</strong> {trip.destination}</p>
              <p><strong>Departure:</strong> {new Date(trip.departureTime).toLocaleString()}</p>
              <p><strong>Arrival:</strong> {new Date(trip.arrivalTime).toLocaleString()}</p>
              <p><strong>Price:</strong> ${trip.price}</p>
              <p><strong>Available Seats:</strong> {trip.availableSeats}</p>
            </div>
          ))
        ) : results.length === 0 && !loading && !error ? (
          <p>No results to display. Try searching for trips.</p>
        ) : null}
      </div>
    </div>
  );
};

export default SearchBus;
