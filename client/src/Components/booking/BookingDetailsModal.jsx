import React from 'react';
import '../../index.css';

const BookingDetailsModal = ({ booking, onClose }) => {
  if (!booking) return null;
  
  const formatDate = (dateString) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  const getPaymentStatusDisplay = (status) => {
    switch(status) {
      case 'success': return 'Confirmed';
      case 'pending': return 'Payment Pending';
      default: return 'Payment Failed';
    }
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h3>Booking Details</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="booking-modal-content">
          <div className="booking-detail-section">
            <h4>Booking Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Booking ID</span>
                <span className="detail-value">{booking._id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Booking Date</span>
                <span className="detail-value">{formatDate(booking.createdAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`detail-value status-text ${booking.paymentStatus}`}>
                  {getPaymentStatusDisplay(booking.paymentStatus)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Amount</span>
                <span className="detail-value price">${booking.totalPrice}</span>
              </div>
            </div>
          </div>
          
          <div className="booking-detail-section">
            <h4>Trip Information</h4>
            <div className="trip-detail-card">
              <div className="journey-route-horizontal">
                <div className="route-point-container">
                  <div className="route-point-departure">
                    <div className="point-time">{formatTime(booking.tripId.departureTime)}</div>
                    <div className="point-date">{formatDate(booking.tripId.departureTime)}</div>
                    <div className="location-name">{booking.tripId.source}</div>
                  </div>
                  
                  <div className="route-line-horizontal">
                    <span className="duration-text">{calculateDuration(booking.tripId.departureTime, booking.tripId.arrivalTime)}</span>
                  </div>
                  
                  <div className="route-point-arrival">
                    <div className="point-time">{formatTime(booking.tripId.arrivalTime)}</div>
                    <div className="point-date">{formatDate(booking.tripId.arrivalTime)}</div>
                    <div className="location-name">{booking.tripId.destination}</div>
                  </div>
                </div>
              </div>
              
              <div className="trip-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Trip ID</span>
                  <span className="detail-value">{booking.tripId._id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Route</span>
                  <span className="detail-value">{booking.tripId.source} to {booking.tripId.destination}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{calculateDuration(booking.tripId.departureTime, booking.tripId.arrivalTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Distance</span>
                  <span className="detail-value">{booking.tripId.distance || 'N/A'} km</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="booking-detail-section">
            <h4>Bus Details</h4>
            <div className="bus-details-card">
              <div className="bus-details-header">
                <h5>{booking.tripId.busId.name}</h5>
                <span className="bus-type">{booking.tripId.busId.type}</span>
              </div>
              
              <div className="bus-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Bus ID</span>
                  <span className="detail-value">{booking.tripId.busId._id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Operator</span>
                  <span className="detail-value">{booking.tripId.busId.operatorId?.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registration Number</span>
                  <span className="detail-value">{booking.tripId.busId.registrationNumber || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Seats</span>
                  <span className="detail-value">{booking.tripId.busId.totalSeats || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Amenities</span>
                  <span className="detail-value">
                    {booking.tripId.busId.amenities && booking.tripId.busId.amenities.length > 0 
                      ? booking.tripId.busId.amenities.join(', ') 
                      : 'No amenities information available'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Rating</span>
                  <span className="detail-value">
                    {booking.tripId.busId.rating ? `${booking.tripId.busId.rating}/5` : 'No ratings yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="booking-detail-section">
            <h4>Passenger & Seat Information</h4>
            <div className="passenger-details">
              <div className="detail-item">
                <span className="detail-label">Passenger Name</span>
                <span className="detail-value">{booking.userId?.name || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{booking.userId?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{booking.userId?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">User ID</span>
                <span className="detail-value">{booking.userId?._id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Seat Numbers</span>
                <span className="detail-value seat-list">{booking.seats.join(', ')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Number of Passengers</span>
                <span className="detail-value">{booking.seats.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Price per Seat</span>
                <span className="detail-value">${booking.seats.length ? (booking.totalPrice / booking.seats.length).toFixed(2) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Booking Address</span>
                <span className="detail-value">{booking.address || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="booking-detail-section">
            <h4>Payment Information</h4>
            <div className="payment-details">
              <div className="detail-item">
                <span className="detail-label">Payment Status</span>
                <span className={`detail-value status-text ${booking.paymentStatus}`}>
                  {getPaymentStatusDisplay(booking.paymentStatus)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment ID</span>
                <span className="detail-value">{booking.paymentId || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">{booking.paymentMethod || 'Online Payment'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Date</span>
                <span className="detail-value">{booking.paymentDate ? formatDate(booking.paymentDate) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Base Amount</span>
                <span className="detail-value">${booking.basePrice || booking.totalPrice}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tax</span>
                <span className="detail-value">${booking.taxAmount || 'Included in price'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Discount</span>
                <span className="detail-value">${booking.discount || '0.00'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Amount</span>
                <span className="detail-value price">${booking.totalPrice}</span>
              </div>
            </div>
          </div>
          
          <div className="booking-action-buttons">
            {booking.paymentStatus === 'success' && (
              <button className="download-ticket-btn">Download Ticket</button>
            )}
            {booking.paymentStatus !== 'success' && (
              <button className="cancel-booking">Cancel Booking</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
