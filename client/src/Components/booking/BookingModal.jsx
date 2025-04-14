import { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import '../../index.css';

const BookingModal = ({ trip, onClose, onBookingSuccess }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingsData, setBookingsData] = useState({ 
    bookedSeats: [],  
    pendingSeats: []  
  });
  // Add new state variables for discount functionality
  const [discountCode, setDiscountCode] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  
  const [realAvailableSeats, setRealAvailableSeats] = useState(trip.availableSeats);
  
  const totalSeats = trip.busId.totalSeats;
  const price = trip.price;
  
  // Calculate total price with discount applied
  const calculateTotalPrice = () => {
    const basePrice = selectedSeats.length * price;
    if (discountInfo && discountInfo.valid) {
      return discountInfo.finalAmount;
    }
    return basePrice;
  };
  
  // Add function to validate discount code
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }
    
    try {
      setDiscountLoading(true);
      setDiscountError('');
      
      const response = await api.post('/discounts/validate', {
        code: discountCode,
        amount: selectedSeats.length * price,
        busType: trip.busId.type
      });
      
      if (response.data.success) {
        setDiscountInfo(response.data.data);
        if (!response.data.data.valid) {
          setDiscountError(response.data.message);
        }
      } else {
        setDiscountError(response.data.message || 'Invalid discount code');
        setDiscountInfo(null);
      }
    } catch (err) {
      setDiscountError(err.response?.data?.message || 'Error validating discount code');
      setDiscountInfo(null);
    } finally {
      setDiscountLoading(false);
    }
  };
  
  // Clear discount when seat selection changes
  useEffect(() => {
    if (discountInfo) {
      setDiscountInfo(null);
      setDiscountError('');
    }
  }, [selectedSeats]);
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // First, always get trip data with all booked and pending seats from all users
        const tripResponse = await api.get(`/trips/${trip._id}`);
        
        if (tripResponse.data.success && tripResponse.data.data) {
          const tripData = tripResponse.data.data;
          const allBookedSeats = tripData.bookedSeats || [];
          const allPendingSeats = tripData.pendingSeats || [];
          
          console.log('All booked seats from trip API:', allBookedSeats);
          console.log('All pending seats from trip API:', allPendingSeats);
          
          // Set the booking data from the trip endpoint that includes ALL users' seats
          setBookingsData({
            bookedSeats: allBookedSeats,
            pendingSeats: allPendingSeats
          });
          
          // Calculate real available seats using complete trip data
          const calculatedAvailableSeats = totalSeats - (allBookedSeats.length + allPendingSeats.length);
          setRealAvailableSeats(calculatedAvailableSeats);
          
          console.log(`Trip ${trip._id} total calculation:
            Total seats: ${totalSeats}
            All booked seats: ${allBookedSeats.length} (${allBookedSeats.join(',')})
            All pending seats: ${allPendingSeats.length} (${allPendingSeats.join(',')})
            Available: ${calculatedAvailableSeats}
          `);
          
        } else {
          // Fallback to user's own bookings if trip data isn't available
          console.log('Trip data not available, falling back to user bookings');
          
          const userResponse = await api.get('/bookings/user');
          
          if (userResponse.data.success && userResponse.data.data && userResponse.data.data.length > 0) {
            const allBookings = userResponse.data.data;
            
            const tripBookings = allBookings.filter(booking => 
              booking.tripId && booking.tripId._id === trip._id
            );
            
            const bookedSeats = [];
            const pendingSeats = [];
            
            // Process user's bookings for this trip
            tripBookings.forEach(booking => {
              if (booking.paymentStatus === 'success') {
                bookedSeats.push(...booking.seats);
              } else {
                pendingSeats.push(...booking.seats);
              }
            });
            
            setBookingsData({ bookedSeats, pendingSeats });
            console.log('User booking data only (incomplete):', { bookedSeats, pendingSeats });
            
            // Using user booking data is incomplete, just using for display
            // We don't calculate available seats here because it would be wrong
          }
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      }
    };
    
    fetchBookings();
  }, [trip._id, trip.availableSeats, totalSeats]);
  
  const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
  
  const toggleSeatSelection = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };
  
  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Creating booking with trip:', trip);
      
      // Prepare booking data with optional discount
      const bookingData = {
        tripId: trip._id,
        seats: selectedSeats
      };
      
      // Include discount information if a valid discount was applied
      if (discountInfo && discountInfo.valid) {
        bookingData.discountId = discountInfo.discountId;
        bookingData.discountAmount = discountInfo.discountAmount;
      }
      
      const response = await api.post('/bookings/user', bookingData);
      
      if (response.data.success) {
        setSuccess(true);
        
        // Immediately update our local state to reflect the new booking
        setBookingsData(prevState => ({
          bookedSeats: prevState.bookedSeats,
          pendingSeats: [...prevState.pendingSeats, ...selectedSeats]
        }));
        
        // Calculate new available seats locally
        const newUnavailableSeats = [...bookingsData.bookedSeats, ...bookingsData.pendingSeats, ...selectedSeats];
        setRealAvailableSeats(totalSeats - newUnavailableSeats.length);
        
        // Notify parent component of booking success
        onBookingSuccess(response.data.data);
        
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book seats. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <div className="booking-modal-header">
          <h3>Book Seats</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="booking-modal-content">
          <div className="trip-summary">
            <p><strong>Bus:</strong> {trip.busId.name} ({trip.busId.type})</p>
            <p><strong>From:</strong> {trip.source}</p>
            <p><strong>To:</strong> {trip.destination}</p>
            <p><strong>Departure:</strong> {new Date(trip.departureTime).toLocaleString()}</p>
            <p><strong>Price per seat:</strong> ${price}</p>
          </div>
          
          <div className="seat-selection">
            <h4>Select Seats</h4>
            <div className="seat-grid">
              {allSeats.map(seat => {
                const isBooked = bookingsData.bookedSeats.includes(seat);
                const isPending = bookingsData.pendingSeats.includes(seat);
                const isAvailable = !isBooked && !isPending;
                
                let seatClass = 'available';
                if (isBooked) seatClass = 'unavailable';
                if (isPending) seatClass = 'pending-payment';
                
                return (
                  <button
                    key={seat}
                    className={`seat ${seatClass} ${selectedSeats.includes(seat) ? 'selected' : ''}`}
                    onClick={() => {
                      if (isAvailable) {
                        toggleSeatSelection(seat);
                      }
                    }}
                    disabled={!isAvailable}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
            
            <div className="seat-legend">
              <div className="legend-item">
                <span className="legend-box available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-box selected"></span>
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <span className="legend-box pending-payment"></span>
                <span>Pending Payment</span>
              </div>
              <div className="legend-item">
                <span className="legend-box unavailable"></span>
                <span>Booked</span>
              </div>
            </div>
          </div>
          
          {/* Add discount code section */}
          <div className="discount-section">
            <h4>Have a discount code?</h4>
            <div className="discount-input-container">
              <input 
                type="text" 
                placeholder="Enter discount code" 
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="discount-input"
                disabled={discountLoading || success}
              />
              <button 
                onClick={validateDiscountCode}
                className="apply-discount-btn"
                disabled={discountLoading || !discountCode.trim() || success}
              >
                {discountLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
            
            {discountError && <div className="discount-error">{discountError}</div>}
            
            {discountInfo && discountInfo.valid && (
              <div className="discount-success">
                <p>Discount applied successfully!</p>
                <div className="discount-details">
                  <div className="discount-row">
                    <span>Original Price:</span>
                    <span>${selectedSeats.length * price}</span>
                  </div>
                  <div className="discount-row">
                    <span>Discount Amount:</span>
                    <span>-${discountInfo.discountAmount}</span>
                  </div>
                  <div className="discount-row total">
                    <span>Final Price:</span>
                    <span>${discountInfo.finalAmount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="booking-summary">
            <p><strong>Selected Seats:</strong> {selectedSeats.length ? selectedSeats.join(', ') : 'None'}</p>
            <p><strong>Total Price:</strong> ${calculateTotalPrice()}</p>
          </div>
          
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">Booking successful!</div>}
          
          <div className="booking-buttons">
            <button className="cancel-booking" onClick={onClose}>Cancel</button>
            <button 
              className="confirm-booking" 
              disabled={loading || selectedSeats.length === 0}
              onClick={handleBooking}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
