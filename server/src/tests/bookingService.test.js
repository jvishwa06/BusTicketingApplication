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
                busId: { totalSeats: 40 },
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

            const result = await BookingService.createBooking(mockUserId, { tripId: mockTripId, seats: mockSeats });

            expect(TripRepository.getTripById).toHaveBeenCalledWith(mockTripId);
            expect(BookingRepository.createBooking).toHaveBeenCalledWith(mockBooking);
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
});