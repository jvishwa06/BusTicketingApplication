import AdminService from '../services/adminService.js';
import AdminRepository from '../repositories/adminRepository.js';
import { logger } from '../utils/logger.js';

jest.mock('../repositories/adminRepository.js');
jest.mock('../utils/logger.js');

describe('AdminService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('blockUser', () => {
        it('should block a user successfully', async () => {
            const mockUserId = '12345';
            const mockUser = { id: mockUserId, blocked: true };
            AdminRepository.updateUserStatus.mockResolvedValue(mockUser);

            const result = await AdminService.blockUser(mockUserId);

            expect(AdminRepository.updateUserStatus).toHaveBeenCalledWith(mockUserId, true);
            expect(logger.info).toHaveBeenCalled();
            expect(result).toEqual({ message: 'User blocked successfully', user: mockUser });
        });

        it('should throw an error if user not found', async () => {
            const mockUserId = '12345';
            AdminRepository.updateUserStatus.mockResolvedValue(null);

            await expect(AdminService.blockUser(mockUserId)).rejects.toThrow(`User with ID ${mockUserId} not found`);
            expect(logger.warn).toHaveBeenCalled();
        });
    });

    describe('unblockUser', () => {
        it('should unblock a user successfully', async () => {
            const mockUserId = '12345';
            const mockUser = { id: mockUserId, blocked: false };
            AdminRepository.updateUserStatus.mockResolvedValue(mockUser);

            const result = await AdminService.unblockUser(mockUserId);

            expect(AdminRepository.updateUserStatus).toHaveBeenCalledWith(mockUserId, false);
            expect(logger.info).toHaveBeenCalled();
            expect(result).toEqual({ message: 'User unblocked successfully', user: mockUser });
        });

        it('should throw an error if user not found', async () => {
            const mockUserId = '12345';
            AdminRepository.updateUserStatus.mockResolvedValue(null);

            await expect(AdminService.unblockUser(mockUserId)).rejects.toThrow(`User with ID ${mockUserId} not found`);
            expect(logger.warn).toHaveBeenCalled();
        });
    });
});
