import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import BookingModal from '../../components/booking/BookingModal.jsx';

const SearchBus = () => {
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    date: ''
  });
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [sortOption, setSortOption] = useState('departureTime');
  const [filterOptions, setFilterOptions] = useState({
    ac: false,
    sleeper: false,
    seater: false,
    morning: false,
    afternoon: false,
    evening: false,
    night: false
  });

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Effect to apply sort and filter whenever results, sortOption, or filterOptions change
  useEffect(() => {
    applyFiltersAndSort();
  }, [results, sortOption, filterOptions]);

  const applyFiltersAndSort = () => {
    let filtered = [...results];
    
    // Apply bus type filters
    if (filterOptions.ac || filterOptions.sleeper || filterOptions.seater) {
      filtered = filtered.filter(trip => {
        const busType = trip.busId?.type?.toLowerCase() || '';
        if (filterOptions.ac && busType.includes('ac')) return true;
        if (filterOptions.sleeper && busType.includes('sleeper')) return true;
        if (filterOptions.seater && busType.includes('seater')) return true;
        return !(filterOptions.ac || filterOptions.sleeper || filterOptions.seater);
      });
    }
    
    // Apply time of day filters
    if (filterOptions.morning || filterOptions.afternoon || filterOptions.evening || filterOptions.night) {
      filtered = filtered.filter(trip => {
        const departureHour = new Date(trip.departureTime).getHours();
        if (filterOptions.morning && departureHour >= 5 && departureHour < 12) return true;
        if (filterOptions.afternoon && departureHour >= 12 && departureHour < 17) return true;
        if (filterOptions.evening && departureHour >= 17 && departureHour < 21) return true;
        if (filterOptions.night && (departureHour >= 21 || departureHour < 5)) return true;
        return !(filterOptions.morning || filterOptions.afternoon || filterOptions.evening || filterOptions.night);
      });
    }
    
    // Sort results
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price':
          return a.price - b.price;
        case 'duration':
          return calculateDurationInMinutes(a.departureTime, a.arrivalTime) - 
                 calculateDurationInMinutes(b.departureTime, b.arrivalTime);
        case 'departureTime':
          return new Date(a.departureTime) - new Date(b.departureTime);
        case 'arrivalTime':
          return new Date(a.arrivalTime) - new Date(b.arrivalTime);
        case 'seats':
          return b.availableSeats - a.availableSeats;
        default:
          return 0;
      }
    });
    
    setFilteredResults(filtered);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
  };

  const handleFilterChange = (option) => {
    setFilterOptions({
      ...filterOptions,
      [option]: !filterOptions[option]
    });
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) navigate('/login', { replace: true });
  };

  const goToProfile = () => {
    navigate('/profile');
  };
  
  const goToMyBookings = () => {
    navigate('/my-bookings');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
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
  
  const openBookingModal = (trip) => {
    setSelectedTrip(trip);
  };
  
  const closeBookingModal = () => {
    setSelectedTrip(null);
  };
  
  const handleBookingSuccess = () => {
    goToMyBookings();
  };
  
  const formatDate = (dateString) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const getAmenityIcon = (amenity) => {
    switch(amenity.toLowerCase()) {
      case 'wifi':
        return '📶';
      case 'charging':
        return '🔌';
      case 'water':
        return '💧';
      case 'blanket':
        return '🛏️';
      case 'movie':
        return '🎬';
      case 'refreshment':
        return '🥤';
      default:
        return '✓';
    }
  };
  
  const getBusTypeIcon = (type) => {
    const typeLC = type?.toLowerCase() || '';
    if (typeLC.includes('ac') && typeLC.includes('sleeper')) return '❄️🛏️';
    if (typeLC.includes('sleeper')) return '🛏️';
    if (typeLC.includes('ac')) return '❄️';
    return '💺';
  };
  
  const getTimeOfDay = (dateTime) => {
    const hour = new Date(dateTime).getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };
  
  const getDayDifference = (dep, arr) => {
    const depDate = new Date(dep).setHours(0, 0, 0, 0);
    const arrDate = new Date(arr).setHours(0, 0, 0, 0);
    return (arrDate - depDate) / (1000 * 60 * 60 * 24);
  };

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo">
            <h1>BusBooking</h1>
          </div>
          <nav className="main-nav">
            <ul>
              <li>
                <button className="nav-link" onClick={goToMyBookings}>
                  My Bookings
                </button>
              </li>
              <li>
                <button className="nav-link" onClick={goToProfile}>
                  {user ? user.name || 'Profile' : 'Profile'}
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
      
      {/* Main Content */}
      <main className="main-content">
        <section className="search-section">
          <div className="search-container">
            <h2 className="search-title">Book Bus Tickets</h2>
            
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-row">
                <div className="search-field">
                  <label htmlFor="source">FROM</label>
                  <input
                    type="text"
                    id="source"
                    name="source"
                    placeholder="Enter source city"
                    value={formData.source}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="swap-icon">
                  <span>⇄</span>
                </div>
                
                <div className="search-field">
                  <label htmlFor="destination">TO</label>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    placeholder="Enter destination city"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="search-field">
                  <label htmlFor="date">TRAVEL DATE</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="search-button"
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search Buses'}
                </button>
              </div>
            </form>
          </div>
        </section>
        
        {/* Search Results */}
        <section className="results-section">
          {error && <div className="alert alert-error">{error}</div>}
          
          {results.length > 0 ? (
            <div className="results-container">
              <div className="results-header">
                <h3 className="results-title">
                  {filteredResults.length} Buses Available from {formData.source} to {formData.destination}
                </h3>
                <div className="journey-date">
                  {formData.date && (
                    <span>{new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
              
              <div className="results-filters">
                <div className="filter-section">
                  <div className="filter-title">Sort By:</div>
                  <div className="sort-options">
                    <button 
                      className={`sort-option ${sortOption === 'departureTime' ? 'active' : ''}`}
                      onClick={() => handleSortChange('departureTime')}
                    >
                      Departure
                    </button>
                    <button 
                      className={`sort-option ${sortOption === 'arrivalTime' ? 'active' : ''}`}
                      onClick={() => handleSortChange('arrivalTime')}
                    >
                      Arrival
                    </button>
                    <button 
                      className={`sort-option ${sortOption === 'duration' ? 'active' : ''}`}
                      onClick={() => handleSortChange('duration')}
                    >
                      Duration
                    </button>
                    <button 
                      className={`sort-option ${sortOption === 'price' ? 'active' : ''}`}
                      onClick={() => handleSortChange('price')}
                    >
                      Price
                    </button>
                    <button 
                      className={`sort-option ${sortOption === 'seats' ? 'active' : ''}`}
                      onClick={() => handleSortChange('seats')}
                    >
                      Seats
                    </button>
                  </div>
                </div>
                
                <div className="filter-section">
                  <div className="filter-title">Filter By:</div>
                  <div className="filter-group">
                    <div className="filter-category">Bus Type:</div>
                    <div className="filter-options">
                      <button 
                        className={`filter-chip ${filterOptions.ac ? 'active' : ''}`}
                        onClick={() => handleFilterChange('ac')}
                      >
                        AC
                      </button>
                      <button 
                        className={`filter-chip ${filterOptions.sleeper ? 'active' : ''}`}
                        onClick={() => handleFilterChange('sleeper')}
                      >
                        Sleeper
                      </button>
                      <button 
                        className={`filter-chip ${filterOptions.seater ? 'active' : ''}`}
                        onClick={() => handleFilterChange('seater')}
                      >
                        Seater
                      </button>
                    </div>
                  </div>
                  
                  <div className="filter-group">
                    <div className="filter-category">Departure Time:</div>
                    <div className="filter-options">
                      <button 
                        className={`filter-chip ${filterOptions.morning ? 'active' : ''}`}
                        onClick={() => handleFilterChange('morning')}
                      >
                        Morning
                      </button>
                      <button 
                        className={`filter-chip ${filterOptions.afternoon ? 'active' : ''}`}
                        onClick={() => handleFilterChange('afternoon')}
                      >
                        Afternoon
                      </button>
                      <button 
                        className={`filter-chip ${filterOptions.evening ? 'active' : ''}`}
                        onClick={() => handleFilterChange('evening')}
                      >
                        Evening
                      </button>
                      <button 
                        className={`filter-chip ${filterOptions.night ? 'active' : ''}`}
                        onClick={() => handleFilterChange('night')}
                      >
                        Night
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="results-grid">
                {filteredResults.map((trip) => (
                  <div key={trip._id} className="bus-card">
                    <div className="bus-header">
                      <div className="bus-operator">
                        <h4 className="bus-name">{trip.busId?.name || 'Unknown Bus'}</h4>
                        <div className="bus-rating">
                          <span className="rating-stars">★★★★☆</span>
                          <span className="rating-count">4.1</span>
                        </div>
                      </div>
                      <div className="bus-type-badge">
                        <span className="type-icon">{getBusTypeIcon(trip.busId?.type)}</span>
                        <span className="type-text">{trip.busId?.type || 'Standard'}</span>
                      </div>
                    </div>
                    
                    <div className="trip-details">
                      <div className="trip-timing">
                        <div className="departure-details">
                          <div className="time-large">{new Date(trip.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          <div className="time-period">{getTimeOfDay(trip.departureTime)}</div>
                          <div className="date-display">{formatDate(trip.departureTime)}</div>
                          <div className="place-name">{trip.source}</div>
                        </div>
                        
                        <div className="trip-duration-display">
                          <div className="duration-line-container">
                            <div className="duration-line">
                              <span className="dot start"></span>
                              <span className="line"></span>
                              <span className="dot end"></span>
                            </div>
                          </div>
                          <div className="duration-text">
                            {calculateDuration(trip.departureTime, trip.arrivalTime)}
                          </div>
                          {getDayDifference(trip.departureTime, trip.arrivalTime) > 0 && (
                            <div className="overnight-tag">
                              +{getDayDifference(trip.departureTime, trip.arrivalTime)} day
                            </div>
                          )}
                        </div>
                        
                        <div className="arrival-details">
                          <div className="time-large">{new Date(trip.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          <div className="time-period">{getTimeOfDay(trip.arrivalTime)}</div>
                          <div className="date-display">{formatDate(trip.arrivalTime)}</div>
                          <div className="place-name">{trip.destination}</div>
                        </div>
                      </div>
                      
                      <div className="bus-amenities">
                        <div className="amenity-title">Amenities</div>
                        <div className="amenity-list">
                          {['WiFi', 'Charging', 'Water', 'Blanket'].map((amenity, index) => (
                            <div className="amenity-item" key={index}>
                              <span className="amenity-icon">{getAmenityIcon(amenity)}</span>
                              <span className="amenity-name">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-section">
                      <div className="price-details">
                        <div className="price-amount">${trip.price}</div>
                        <div className="price-per-person">per seat</div>
                      </div>
                      
                      <div className="seat-availability">
                        <div className={`seat-status ${trip.availableSeats > 10 ? 'many' : trip.availableSeats > 0 ? 'few' : 'none'}`}>
                          {trip.availableSeats > 0 ? `${trip.availableSeats} seats available` : 'Sold Out'}
                        </div>
                      </div>
                      
                      <button 
                        className="view-seats-button" 
                        onClick={() => openBookingModal(trip)}
                        disabled={trip.availableSeats <= 0}
                      >
                        {trip.availableSeats <= 0 ? 'Sold Out' : 'View Seats'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Searching for buses...</p>
            </div>
          ) : results.length === 0 && !error ? (
            <div className="no-results">
              <div className="no-results-icon">🚍</div>
              <h3>No Buses Found</h3>
              <p>Try different dates or destinations</p>
            </div>
          ) : null}
        </section>
      </main>
      
      {selectedTrip && (
        <BookingModal 
          trip={selectedTrip} 
          onClose={closeBookingModal} 
          onBookingSuccess={handleBookingSuccess} 
        />
      )}
    </div>
  );
};

// Helper function to calculate trip duration
const calculateDuration = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const durationMs = endTime - startTime;
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

// Helper function to calculate duration in minutes for sorting
const calculateDurationInMinutes = (start, end) => {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return (endTime - startTime) / (1000 * 60);
};

export default SearchBus;
