import { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import '../../index.css';

const BookingModal = ({ trip, onClose, onBookingSuccess }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingsData, setBookingsData] = useState({ 
    bookedSeats: [],  // Seats with confirmed payment
    pendingSeats: []  // Seats with pending payment
  });
  
  const totalSeats = trip.busId.totalSeats;
  const availableSeats = trip.availableSeats;
  const price = trip.price;
  
  // Fetch bookings to identify booked and pending payment seats
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Since we don't have a specific endpoint for trip bookings, we'll use the user bookings endpoint
        // and then filter the results for this trip
        const response = await api.get('/bookings/user');
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          const allBookings = response.data.data;
          
          // Filter bookings for this specific trip
          const tripBookings = allBookings.filter(booking => 
            booking.tripId && booking.tripId._id === trip._id
          );
          
          // Separate seats by payment status
          const bookedSeats = [];
          const pendingSeats = [];
          
          // Process all bookings for this trip
          tripBookings.forEach(booking => {
            if (booking.paymentStatus === 'success') {
              bookedSeats.push(...booking.seats);
            } else {
              pendingSeats.push(...booking.seats);
            }
          });
          
          setBookingsData({ bookedSeats, pendingSeats });
          console.log('Booking data for trip:', { bookedSeats, pendingSeats });
        } else {
          // If there are no bookings, we need to check with the trip's data
          console.log('No user bookings found, checking trip data');
          
          // Make another API call to get all bookings for this trip
          // This would need a new endpoint in your API
          try {
            const adminResponse = await api.get(`/trips/${trip._id}`);
            if (adminResponse.data.success && adminResponse.data.data) {
              const tripData = adminResponse.data.data;
              if (tripData.bookedSeats) {
                setBookingsData({
                  bookedSeats: tripData.bookedSeats,
                  pendingSeats: []
                });
                console.log('Using trip data for booked seats:', tripData.bookedSeats);
              }
            }
          } catch (tripErr) {
            console.log('Could not get specific trip booking data');
          }
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      }
    };
    
    fetchBookings();
  }, [trip._id]);
  
  // Generate array of all seat numbers
  const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
  
  // Handle seat selection
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
      
      // Use the trip data we already have - no need to fetch it again
      const response = await api.post('/bookings/user', {
        tripId: trip._id,
        seats: selectedSeats
      });
      
      if (response.data.success) {
        setSuccess(true);
        onBookingSuccess(response.data.data);
        
        // Close the modal after showing success message
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
                // Check if seat is booked or has pending payment
                const isBooked = bookingsData.bookedSeats.includes(seat);
                const isPending = bookingsData.pendingSeats.includes(seat);
                const isAvailable = !isBooked && !isPending;
                
                // Determine the appropriate CSS class for the seat
                let seatClass = 'available';
                if (isBooked) seatClass = 'unavailable';
                if (isPending) seatClass = 'pending-payment';
                
                return (
                  <button
                    key={seat}
                    className={`seat ${seatClass} ${selectedSeats.includes(seat) ? 'selected' : ''}`}
                    onClick={() => {
                      // Only allow selection if the seat is available
                      if (isAvailable) {
                        toggleSeatSelection(seat);
                      }
                    }}
                    // Disable button for booked or pending seats
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
          
          <div className="booking-summary">
            <p><strong>Selected Seats:</strong> {selectedSeats.length ? selectedSeats.join(', ') : 'None'}</p>
            <p><strong>Total Price:</strong> ${selectedSeats.length * price}</p>
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
