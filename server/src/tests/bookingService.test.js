import BookingService from '../services/bookingService.js';
import BookingRepository from '../repositories/bookingRepository.js';
import TripRepository from '../repositories/tripRepository.js';

jest.mock('../repositories/bookingRepository.js');
jest.mock('../repositories/tripRepository.js');
jest.mock('../utils/logger.js');

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
                totalPrice: 100,
                discount: 0,
                discountId: null
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
            const mockSeats = [0, 41]; // Invalid seats (outside range 1-40)
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
            const mockSeats = [1, 1, 2]; // Duplicate seat 1
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
                { seats: [1, 3] }, // Seat 1 already booked
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
                availableSeats: 2, // Only 2 seats available
                price: 50
            };

            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.getBookingsByTripId.mockResolvedValue([]);

            await expect(BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats }))
                .rejects.toThrow('Not enough available seats.');
                
            expect(BookingRepository.createBooking).not.toHaveBeenCalled();
        });

        it('should create booking without discount code', async () => {
            // Mock setup
            const mockUserId = 'user123';
            const mockTripId = 'trip123';
            const mockSeats = [1, 2];
            const mockTrip = {
                busId: { totalSeats: 40, type: 'AC' },
                availableSeats: 10,
                price: 50,
            };
            
            TripRepository.getTripById.mockResolvedValue(mockTrip);
            BookingRepository.getBookingsByTripId.mockResolvedValue([]);
            TripRepository.updateTrip.mockResolvedValue({ ...mockTrip, availableSeats: 8 });
            
            const mockBooking = {
                userId: mockUserId,
                tripId: mockTripId,
                seats: mockSeats,
                totalPrice: 100, // 2 seats * 50 price per seat
                discount: 0,
                discountId: null
            };
            
            BookingRepository.createBooking.mockResolvedValue(mockBooking);

            const result = await BookingService.createBooking(mockUserId, { 
                tripId: mockTripId, 
                seats: mockSeats
            });

            expect(TripRepository.updateTrip).toHaveBeenCalledWith(mockTripId, { availableSeats: 8 });
            expect(result).toEqual(mockBooking);
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
    });

    describe('getAllBookings', () => {
        it('should return all bookings', async () => {
            const mockBookings = [{ id: 'b1' }, { id: 'b2' }];
            BookingRepository.getAllBookings.mockResolvedValue(mockBookings);

            const result = await BookingService.getAllBookings();

            expect(BookingRepository.getAllBookings).toHaveBeenCalled();
            expect(result).toEqual(mockBookings);
        });
    });

    describe('getBookingById', () => {
        it('should return a booking by ID', async () => {
            const mockBooking = { id: 'b1', userId: 'user123', tripId: 't1' };
            BookingRepository.getBookingById.mockResolvedValue(mockBooking);

            const result = await BookingService.getBookingById('b1');

            expect(BookingRepository.getBookingById).toHaveBeenCalledWith('b1');
            expect(result).toEqual(mockBooking);
        });
    });

    describe('updateBooking', () => {
        it('should update a booking successfully', async () => {
            const mockBookingId = 'b1';
            const mockUpdateData = { seats: [3, 4] };
            const mockUpdatedBooking = { id: mockBookingId, ...mockUpdateData };
            BookingRepository.updateBooking.mockResolvedValue(mockUpdatedBooking);

            const result = await BookingService.updateBooking(mockBookingId, mockUpdateData);

            expect(BookingRepository.updateBooking).toHaveBeenCalledWith(mockBookingId, mockUpdateData);
            expect(result).toEqual(mockUpdatedBooking);
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
    
    describe('getBookingsByTripId', () => {
        it('should return bookings for a trip', async () => {
            const mockTripId = 'trip123';
            const mockBookings = [
                { id: 'b1', tripId: mockTripId, seats: [1, 2] },
                { id: 'b2', tripId: mockTripId, seats: [3, 4] }
            ];
            
            BookingRepository.getBookingsByTripId.mockResolvedValue(mockBookings);

            const result = await BookingService.getBookingsByTripId(mockTripId);

            expect(BookingRepository.getBookingsByTripId).toHaveBeenCalledWith(mockTripId);
            expect(result).toEqual(mockBookings);
        });

        it('should handle errors when fetching trip bookings', async () => {
            const mockTripId = 'trip123';
            const mockError = new Error('Database error');
            
            BookingRepository.getBookingsByTripId.mockRejectedValue(mockError);

            await expect(BookingService.getBookingsByTripId(mockTripId))
                .rejects.toThrow('Database error');
        });
    });
    
    describe('getBookingsByTripIds', () => {
        it('should return bookings for multiple trips', async () => {
            const mockTripIds = ['trip1', 'trip2'];
            const mockBookings = [
                { id: 'b1', tripId: 'trip1', seats: [1, 2] },
                { id: 'b2', tripId: 'trip2', seats: [3, 4] }
            ];
            
            BookingRepository.getBookingsByTripIds.mockResolvedValue(mockBookings);

            const result = await BookingService.getBookingsByTripIds(mockTripIds);

            expect(BookingRepository.getBookingsByTripIds).toHaveBeenCalledWith(mockTripIds);
            expect(result).toEqual(mockBookings);
        });

        it('should throw an error if tripIds is invalid', async () => {
            await expect(BookingService.getBookingsByTripIds(null))
                .rejects.toThrow('Valid trip IDs are required to fetch bookings');
                
            await expect(BookingService.getBookingsByTripIds([]))
                .rejects.toThrow('Valid trip IDs are required to fetch bookings');
                
            expect(BookingRepository.getBookingsByTripIds).not.toHaveBeenCalled();
        });

        it('should handle errors when fetching bookings for multiple trips', async () => {
            const mockTripIds = ['trip1', 'trip2'];
            const mockError = new Error('Database error');
            
            BookingRepository.getBookingsByTripIds.mockRejectedValue(mockError);

            await expect(BookingService.getBookingsByTripIds(mockTripIds))
                .rejects.toThrow('Database error');
        });
    });
});