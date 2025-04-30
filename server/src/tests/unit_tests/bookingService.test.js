import BookingService from '../../services/bookingService.js';
import BookingRepository from '../../repositories/bookingRepository.js';
import TripRepository from '../../repositories/tripRepository.js';

jest.mock('../../repositories/bookingRepository.js');
jest.mock('../../repositories/tripRepository.js');
jest.mock('../../utils/logger.js');

describe('BookingService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createBooking', () => {
        it('should create a booking successfully', async () => {
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
                userId: mockUserId, 
                tripId: mockTripId, 
                seats: mockSeats, 
                totalPrice: 100
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.getBookingsByTripId.mockResolvedValue([]);
            BookingRepository.createBooking.mockResolvedValue(mockBooking);
            TripRepository.updateTrip.mockResolvedValue({ ...mockTrip, availableSeats: 8 });

            const result = await BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats });

            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(BookingRepository.getBookingsByTripId).toHaveBeenCalledWith(mockTripId);
            expect(TripRepository.updateTrip).toHaveBeenCalledWith(mockTripId, { availableSeats: 8 });
            expect(BookingRepository.createBooking).toHaveBeenCalledWith(mockBooking);
            expect(result).toEqual(mockBooking);
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
                .rejects.toThrow(`Bus details not found for trip ${mockTripId}`);
                
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
            BookingRepository.getBookingsByTripId.mockResolvedValue(existingBookings);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow(`Seats 1 are already booked.`);
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
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
            BookingRepository.getBookingsByTripId.mockResolvedValue([]);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow('Not enough available seats.');
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
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

    describe('deleteBooking', () => {
        it('should delete a booking successfully', async () => {
            const mockBookingId = 'b1';
            const mockDeletedBooking = { id: mockBookingId };
            BookingRepository.deleteBooking.mockResolvedValue(mockDeletedBooking);

            const result = await BookingService.deleteBooking(mockBookingId);

            expect(BookingRepository.deleteBooking).toHaveBeenCalledWith(mockBookingId);
            expect(result).toEqual(mockDeletedBooking);
        });

        it('should handle and log errors when deleting a booking', async () => {
            const mockBookingId = 'b1';
            const mockError = new Error('Database error');
            
            BookingRepository.deleteBooking.mockRejectedValue(mockError);
            
            await expect(BookingService.deleteBooking(mockBookingId))
                .rejects.toThrow('Database error');
        });

        it('should return null when booking not found for deletion', async () => {
            const mockBookingId = 'nonexistent';
            
            BookingRepository.deleteBooking.mockResolvedValue(null);
            
            const result = await BookingService.deleteBooking(mockBookingId);
            
            expect(result).toBeNull();
            expect(BookingRepository.deleteBooking).toHaveBeenCalledWith(mockBookingId);
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

        it('should handle errors when fetching operator bookings', async () => {
            const mockOperatorId = 'operator123';
            const mockError = new Error('Database error');
            
            BookingRepository.getBookingsByOperatorId.mockRejectedValue(mockError);

            await expect(BookingService.getOperatorBookings(mockOperatorId))
                .rejects.toThrow('Database error');
        });
    });
});