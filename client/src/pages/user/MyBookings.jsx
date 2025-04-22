import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../utils/api.js';
import BookingDetailsModal from '../../components/booking/BookingDetailsModal.jsx';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/user');
      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        setError('Failed to fetch bookings.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await api.delete(`/bookings/${bookingId}`);
      if (response.data.success) {
        setBookings(bookings.filter(booking => booking._id !== bookingId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };
  
  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };
  
  const closeBookingDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const goToSearchBus = () => {
    navigate('/search-bus');
  };

  const goToProfile = () => {
    navigate('/profile');
  };
  
  const goToMyBookings = () => {
    navigate('/my-bookings');
  };
  
  const handleLogout = async () => {
    const success = await logout();
    if (success) navigate('/login', { replace: true });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getBusTypeDisplay = (type) => {
    if (!type) return 'Unknown';
    
    // Format the bus type in a more readable way
    const formattedType = type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    // Add bus type icon
    switch(type.toLowerCase()) {
      case 'ac':
        return '❄️ AC';
      case 'non-ac':
        return '🚌 Non-AC';
      case 'sleeper':
        return '🛏️ Sleeper';
      case 'seater':
        return '💺 Seater';
      case 'ac sleeper':
      case 'sleeper ac':
        return '❄️🛏️ AC Sleeper';
      case 'ac seater':
      case 'seater ac':
        return '❄️💺 AC Seater';
      default:
        return formattedType;
    }
  };
  
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

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
                <button className="nav-link active" onClick={goToMyBookings}>
                  My Bookings
                </button>
              </li>
              <li>
                <button className="nav-link" onClick={goToSearchBus}>
                  Search Bus
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

      <main className="main-content">
        <div className="bookings-container">
          <h2 className="page-title">My Bookings</h2>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚌</div>
              <h3>No Bookings Found</h3>
              <p>You haven't made any bookings yet.</p>
              <button className="primary-button" onClick={goToSearchBus}>
                Book a Trip Now
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-status-bar">
                    <span className={`status-badge ${booking.paymentStatus}`}>
                      {booking.paymentStatus === 'success' ? 'Confirmed' : 
                      booking.paymentStatus === 'pending' ? 'Payment Pending' : 'Payment Failed'}
                    </span>
                    <span className="booking-date">Booked on {formatShortDate(booking.createdAt)}</span>
                  </div>
                  
                  <div className="booking-main">
                    <div className="booking-trip-details">
                      <div className="bus-info">
                        <h3 className="bus-name">{booking.tripId?.busId?.name || 'Bus information unavailable'}</h3>
                        <span className="bus-type">{getBusTypeDisplay(booking.tripId?.busId?.type)}</span>
                      </div>
                      
                      <div className="journey-details">
                        <div className="journey-points">
                          <div className="departure-info">
                            <div className="time">{booking.tripId ? formatTime(booking.tripId.departureTime) : 'N/A'}</div>
                            <div className="date">{booking.tripId ? formatShortDate(booking.tripId.departureTime) : 'N/A'}</div>
                            <div className="place">{booking.tripId?.source || 'Unknown'}</div>
                          </div>
                          
                          <div className="journey-line">
                            <div className="dot start"></div>
                            <div className="line"></div>
                            <div className="dot end"></div>
                            {booking.tripId && booking.tripId.departureTime && booking.tripId.arrivalTime && (
                              <div className="duration-text">
                                {calculateDuration(booking.tripId.departureTime, booking.tripId.arrivalTime)}
                              </div>
                            )}
                          </div>
                          
                          <div className="arrival-info">
                            <div className="time">{booking.tripId ? formatTime(booking.tripId.arrivalTime) : 'N/A'}</div>
                            <div className="date">{booking.tripId ? formatShortDate(booking.tripId.arrivalTime) : 'N/A'}</div>
                            <div className="place">{booking.tripId?.destination || 'Unknown'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-details-sidebar">
                      <div className="booking-meta">
                        <div className="seats-info">
                          <label>Seats</label>
                          <div className="seat-numbers">{booking.seats.join(', ')}</div>
                        </div>
                        
                        <div className="price-info">
                          <label>Total Price</label>
                          <div className="price">${booking.totalPrice}</div>
                        </div>
                        
                        <div className="booking-id">
                          <label>Booking ID</label>
                          <div className="id">{booking._id.substr(-8)}</div>
                        </div>
                      </div>
                      
                      <div className="booking-actions">
                        <button 
                          className="view-details-button" 
                          onClick={() => viewBookingDetails(booking)}
                        >
                          View Details
                        </button>
                        <button 
                          className="cancel-button" 
                          onClick={() => handleDeleteBooking(booking._id)}
                        >
                          {booking.paymentStatus === 'success' ? 'Cancel Reservation' : 'Cancel Booking'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {showDetailsModal && (
        <BookingDetailsModal 
          booking={selectedBooking}
          onClose={closeBookingDetailsModal}
        />
      )}
    </div>
  );
};

export default MyBookings;