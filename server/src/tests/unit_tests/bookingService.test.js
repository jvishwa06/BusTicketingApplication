import BookingService from '../../services/bookingService.js';
import BookingRepository from '../../repositories/bookingRepository.js';
import TripRepository from '../../repositories/tripRepository.js';

jest.mock('../../repositories/bookingRepository.js');
jest.mock('../../repositories/tripRepository.js');
jest.mock('../../utils/logger.js');

describe('BookingService', () => {
    beforeEach(() => {
        BookingRepository.getBookingsByTripId = jest.fn();
        BookingRepository.createBooking = jest.fn();
        BookingRepository.getBookingsByUserId = jest.fn();
        BookingRepository.getBookingsByOperatorId = jest.fn();
        BookingRepository.getBookingById = jest.fn();
        BookingRepository.cancelBooking = jest.fn();
        BookingRepository.releaseSeats = jest.fn();
        TripRepository.getTripById = jest.fn();
        TripRepository.updateTrip = jest.fn();
        
        jest.useFakeTimers();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('createBooking', () => {
        jest.setTimeout(15000);

        it('should create a booking successfully', async () => {``
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { totalSeats: 40, type: 'AC' },
                availableSeats: 10,
                price: 50,
                save: jest.fn()
            };
            const mockBooking = { 
                _id: 'booking123',
                userId: mockUserId, 
                tripId: mockTripId, 
                seats: mockSeats, 
                totalPrice: 100
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.createBooking.mockResolvedValue(mockBooking);

            const result = await BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats });

            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(BookingRepository.createBooking).toHaveBeenCalledWith(
                { userId: mockUserId, totalPrice: 100, paymentStatus: 'pending' },
                mockTripId,
                mockSeats
            );
            expect(result).toEqual(mockBooking);
        });

        it('should set up payment timeout for pending bookings', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { totalSeats: 40, type: 'AC' },
                availableSeats: 10,
                price: 50
            };
            const mockBooking = { 
                _id: 'booking123',
                userId: mockUserId, 
                tripId: mockTripId, 
                seats: mockSeats, 
                totalPrice: 100,
                paymentStatus: 'pending'
            };

            const originalSetTimeout = global.setTimeout;
            let timeoutCallback;
            global.setTimeout = jest.fn((callback) => {
                timeoutCallback = callback;
                return { unref: jest.fn() };
            });

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.createBooking.mockResolvedValue(mockBooking);
            BookingRepository.getBookingById.mockResolvedValue(mockBooking);

            await BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats });
            
            expect(global.setTimeout).toHaveBeenCalled();
            
            if (timeoutCallback) {
                await timeoutCallback();
            }
            
            expect(BookingRepository.getBookingById).toHaveBeenCalledWith('booking123');
            expect(BookingRepository.releaseSeats).toHaveBeenCalledWith('booking123');
            
            global.setTimeout = originalSetTimeout;
        });

        it('should not release seats if payment status is not pending', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { totalSeats: 40, type: 'AC' },
                availableSeats: 10,
                price: 50
            };
            const mockBooking = { 
                _id: 'booking123',
                userId: mockUserId, 
                tripId: mockTripId, 
                seats: mockSeats, 
                totalPrice: 100,
                paymentStatus: 'completed'
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.createBooking.mockResolvedValue(mockBooking);
            BookingRepository.getBookingById.mockResolvedValue({...mockBooking, paymentStatus: 'completed'});

            await BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats });
            
            jest.runAllTimers();
            
            expect(BookingRepository.getBookingById).toHaveBeenCalledWith('booking123');
            expect(BookingRepository.releaseSeats).not.toHaveBeenCalled();
        });

        it('should handle errors in the timeout handler', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { totalSeats: 40, type: 'AC' },
                availableSeats: 10,
                price: 50
            };
            const mockBooking = { 
                _id: 'booking123',
                userId: mockUserId, 
                tripId: mockTripId, 
                seats: mockSeats, 
                totalPrice: 100
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.createBooking.mockResolvedValue(mockBooking);
            BookingRepository.getBookingById.mockRejectedValue(new Error('Database error'));

            await BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats });
            
            jest.runAllTimers();
            
            expect(BookingRepository.getBookingById).toHaveBeenCalledWith('booking123');
            expect(BookingRepository.releaseSeats).not.toHaveBeenCalled();
        });

        it('should throw an error if trip not found', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'nonexistent';
            const mockSeats = [1, 2];

            TripRepository.getTripById.mockResolvedValue(null);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow(`Trip with ID ${mockTripId} not found`);
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
        });

        it('should throw an error if bus details not found for trip', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: null,
                availableSeats: 10,
                price: 50
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow(`Cannot read properties of null (reading 'totalSeats')`);
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
        });

        it('should throw an error if invalid bus data for trip', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { /* no totalSeats property */ },
                availableSeats: 10,
                price: 50
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow(`Invalid bus data for trip ${mockTripId}`);
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
        });

        it('should throw an error if invalid seat numbers', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [0, 41]; 
            const mockTrip = {
                busId: { totalSeats: 40 },
                availableSeats: 10,
                price: 50
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow(`Invalid seat numbers: ${mockSeats.join(', ')}. Allowed range: 1 - 40`);
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
        });

        it('should throw an error if duplicate seats in the request', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 1, 2]; 
            const mockTrip = {
                busId: { totalSeats: 40 },
                availableSeats: 10,
                price: 50
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow('Duplicate seats detected in the request. Please select unique seats.');
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
        });

        it('should throw an error if seats already booked', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { totalSeats: 40 },
                availableSeats: 10,
                price: 50
            };
            const existingBookings = [
                { seats: [1, 3] }, 
            ];

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            
            // In the new implementation, seat availability is checked within createBooking
            // We need to mock createBooking to throw the appropriate error
            BookingRepository.createBooking.mockRejectedValue(new Error(`Seats already booked: 1`));

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow(`Seats already booked: 1`);
                
            expect(BookingRepository.createBooking).toHaveBeenCalled();
        });

        it('should throw an error if not enough available seats', async () => {
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2, 3];
            const mockTrip = {
                busId: { totalSeats: 40 },
                availableSeats: 2, 
                price: 50
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            
            // In the new implementation, available seats check is done within createBooking
            // We need to mock createBooking to throw the appropriate error
            BookingRepository.createBooking.mockRejectedValue(new Error('Not enough available seats'));

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow('Not enough available seats');
                
            expect(BookingRepository.createBooking).toHaveBeenCalled();
        });
    });

    describe('getUserBookings', () => {
        it('should return bookings for a user', async () => {
            const mockUserId = 'user123';
            const mockBookings = [{ id: 'b1', userId: mockUserId, tripId: 't1' }];
            BookingRepository.getBookingsByUserId.mockResolvedValue(mockBookings);

            const result = await BookingService.getUserBookings(mockUserId);

            expect(BookingRepository.getBookingsByUserId).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(mockBookings);
        });

        it('should handle and log errors when fetching user bookings', async () => {
            const mockUserId = 'user123';
            const mockError = new Error('Database error');
            
            BookingRepository.getBookingsByUserId.mockRejectedValue(mockError);
            
            await expect(BookingService.getUserBookings(mockUserId))
                .rejects.toThrow('Database error');
        });
    });

    describe('getOperatorBookings', () => {
        it('should return bookings for an operator', async () => {
            const mockOperatorId = 'operator123';
            const mockBookings = [
                { id: 'b1', tripId: 't1' },
                { id: 'b2', tripId: 't2' }
            ];
            
            BookingRepository.getBookingsByOperatorId.mockResolvedValue(mockBookings);
            
            const result = await BookingService.getOperatorBookings(mockOperatorId);
            
            expect(BookingRepository.getBookingsByOperatorId).toHaveBeenCalledWith(mockOperatorId);
            expect(result).toEqual(mockBookings);
        });

        it('should handle and log errors when fetching operator bookings', async () => {
            const mockOperatorId = 'operator123';
            const mockError = new Error('Database error');
            
            BookingRepository.getBookingsByOperatorId.mockRejectedValue(mockError);
            
            await expect(BookingService.getOperatorBookings(mockOperatorId))
                .rejects.toThrow('Database error');
        });
    });

    describe('cancelBooking', () => {
        it('should cancel a booking successfully', async () => {
            const mockBookingId = 'booking123';
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockTrip = {
                _id: mockTripId,
                availableSeats: 30,
                departureTime: new Date(Date.now() + 86400000) // 24 hours from now
            };
            const mockBooking = {
                _id: mockBookingId,
                userId: { _id: mockUserId },
                tripId: mockTripId,
                seats: [1, 2],
                status: 'active'
            };
            const updatedBooking = {
                ...mockBooking,
                status: 'cancelled',
                cancellationDate: expect.any(Date),
                cancellationReason: 'User requested cancellation'
            };

            BookingRepository.getBookingById.mockResolvedValue(mockBooking);
            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.cancelBooking.mockResolvedValue(updatedBooking);
            TripRepository.updateTrip.mockResolvedValue({
                ...mockTrip,
                availableSeats: 32 // 30 + 2
            });

            const result = await BookingService.cancelBooking(mockBookingId, mockUserId);

            expect(BookingRepository.getBookingById).toHaveBeenCalledWith(mockBookingId);
            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(BookingRepository.cancelBooking).toHaveBeenCalledWith(
                mockBookingId,
                'User requested cancellation'
            );
            expect(TripRepository.updateTrip).toHaveBeenCalledWith(
                mockTripId,
                { availableSeats: 32 }
            );
            expect(result).toEqual(updatedBooking);
        });

        it('should throw an error if booking not found', async () => {
            const mockBookingId = 'nonexistent';
            const mockUserId = 'user123';

            BookingRepository.getBookingById.mockResolvedValue(null);

            await expect(BookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects.toThrow('Booking not found');

            expect(BookingRepository.cancelBooking).not.toHaveBeenCalled();
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });

    it('should throw an error if user tries to cancel another user\'s booking (with userId as object)', async () => {
        const mockBookingId = 'booking123';
        const mockUserId = 'user123';
        const mockOtherUserId = 'other456';
        const mockBooking = {
            _id: mockBookingId,
            userId: { _id: mockOtherUserId }, // userId as an object with _id
            tripId: 'trip123',
            seats: [1, 2],
            status: 'active'
        };

        BookingRepository.getBookingById.mockResolvedValue(mockBooking);

            await expect(BookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects.toThrow('You can only cancel your own bookings');

            expect(BookingRepository.cancelBooking).not.toHaveBeenCalled();
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });

        it('should throw an error if user tries to cancel another user\'s booking (with userId as string)', async () => {
            const mockBookingId = 'booking123';
            const mockUserId = 'user123';
            const mockOtherUserId = 'other456';
            const mockBooking = {
                _id: mockBookingId,
                userId: mockOtherUserId, // userId directly as a string
                tripId: 'trip123',
                seats: [1, 2],
                status: 'active'
            };

            BookingRepository.getBookingById.mockResolvedValue(mockBooking);

            await expect(BookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects.toThrow('You can only cancel your own bookings');

            expect(BookingRepository.cancelBooking).not.toHaveBeenCalled();
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });

        it('should throw an error if booking is already cancelled', async () => {
            const mockBookingId = 'booking123';
            const mockUserId = 'user123';
            const mockBooking = {
                _id: mockBookingId,
                userId: { _id: mockUserId },
                tripId: 'trip123',
                seats: [1, 2],
                status: 'cancelled'
            };

            BookingRepository.getBookingById.mockResolvedValue(mockBooking);

            await expect(BookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects.toThrow('Booking is already cancelled');

            expect(BookingRepository.cancelBooking).not.toHaveBeenCalled();
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });

        it('should throw an error if trip not found', async () => {
            const mockBookingId = 'booking123';
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockBooking = {
                _id: mockBookingId,
                userId: { _id: mockUserId },
                tripId: mockTripId,
                seats: [1, 2],
                status: 'active'
            };

            BookingRepository.getBookingById.mockResolvedValue(mockBooking);
            TripRepository.getTripById.mockResolvedValue(null);

            await expect(BookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects.toThrow('Trip not found');

            expect(BookingRepository.cancelBooking).not.toHaveBeenCalled();
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });

        it('should throw an error if trying to cancel after trip departure', async () => {
            const mockBookingId = 'booking123';
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockTrip = {
                _id: mockTripId,
                availableSeats: 30,
                departureTime: new Date(Date.now() - 3600000) // 1 hour ago
            };
            const mockBooking = {
                _id: mockBookingId,
                userId: { _id: mockUserId },
                tripId: mockTripId,
                seats: [1, 2],
                status: 'active'
            };

            BookingRepository.getBookingById.mockResolvedValue(mockBooking);
            TripRepository.getTripById.mockResolvedValue(mockTrip);

            await expect(BookingService.cancelBooking(mockBookingId, mockUserId))
                .rejects.toThrow('Cannot cancel booking after trip departure');

            expect(BookingRepository.cancelBooking).not.toHaveBeenCalled();
            expect(TripRepository.updateTrip).not.toHaveBeenCalled();
        });
    });
});