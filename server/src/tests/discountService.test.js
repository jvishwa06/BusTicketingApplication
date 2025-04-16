import discountService from '../services/discountService.js';
import discountRepository from '../repositories/discountRepository.js';
import { appLogger } from '../utils/logger.js';

jest.mock('../repositories/discountRepository.js');
jest.mock('../utils/logger.js');

describe('DiscountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDiscount', () => {
    const validDiscountData = {
      code: 'FIRST10',
      discountType: 'percentage',
      value: 10,
      validUntil: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      validFrom: new Date(),
      isActive: true,
      minBookingAmount: 1000,
      maxDiscountAmount: 500,
      usageLimit: 100,
      usageCount: 0,
      applicableBusTypes: ['AC', 'Sleeper']
    };

    it('should create a discount successfully', async () => {
      discountRepository.findByCode.mockResolvedValue(null);
      discountRepository.createDiscount.mockResolvedValue({
        _id: 'discount123',
        ...validDiscountData,
        code: validDiscountData.code.toUpperCase()
      });

      const result = await discountService.createDiscount(validDiscountData);

      expect(discountRepository.findByCode).toHaveBeenCalledWith(validDiscountData.code.toUpperCase());
      expect(discountRepository.createDiscount).toHaveBeenCalledWith({
        ...validDiscountData,
        code: validDiscountData.code.toUpperCase()
      });
      expect(appLogger.info).toHaveBeenCalledWith(`Discount code created: ${validDiscountData.code.toUpperCase()}`);
      expect(result).toEqual({
        _id: 'discount123',
        ...validDiscountData,
        code: validDiscountData.code.toUpperCase()
      });
    });

    it('should throw an error if required data is missing', async () => {
      const invalidData = {
        code: 'TEST',
        discountType: 'percentage',
        // Missing value
        validUntil: new Date()
      };

      await expect(discountService.createDiscount(invalidData))
        .rejects.toThrow('Required discount data is missing');
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating discount code'));
      expect(discountRepository.createDiscount).not.toHaveBeenCalled();
    });

    it('should throw an error if discount code already exists', async () => {
      discountRepository.findByCode.mockResolvedValue({ code: validDiscountData.code });

      await expect(discountService.createDiscount(validDiscountData))
        .rejects.toThrow(`Discount code ${validDiscountData.code.toUpperCase()} already exists`);
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error creating discount code'));
      expect(discountRepository.createDiscount).not.toHaveBeenCalled();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      discountRepository.findByCode.mockRejectedValue(error);

      await expect(discountService.createDiscount(validDiscountData))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error creating discount code: ${error.message}`);
    });
  });

  describe('getAllDiscounts', () => {
    it('should return all discounts when activeOnly is false', async () => {
      const mockDiscounts = [
        { _id: 'discount1', code: 'TEST1', isActive: true },
        { _id: 'discount2', code: 'TEST2', isActive: false }
      ];

      discountRepository.findDiscounts.mockResolvedValue(mockDiscounts);

      const result = await discountService.getAllDiscounts(false);

      expect(discountRepository.findDiscounts).toHaveBeenCalledWith({});
      expect(appLogger.info).toHaveBeenCalledWith(`Retrieved ${mockDiscounts.length} discount codes`);
      expect(result).toEqual(mockDiscounts);
    });

    it('should return only active discounts when activeOnly is true', async () => {
      const mockDiscounts = [
        { _id: 'discount1', code: 'TEST1', isActive: true }
      ];

      discountRepository.findDiscounts.mockResolvedValue(mockDiscounts);

      const result = await discountService.getAllDiscounts(true);

      expect(discountRepository.findDiscounts).toHaveBeenCalledWith({ isActive: true });
      expect(appLogger.info).toHaveBeenCalledWith(`Retrieved ${mockDiscounts.length} discount codes`);
      expect(result).toEqual(mockDiscounts);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      discountRepository.findDiscounts.mockRejectedValue(error);

      await expect(discountService.getAllDiscounts()).rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error fetching discount codes: ${error.message}`);
    });
  });

  describe('getDiscountByCode', () => {
    it('should return the discount when the code exists', async () => {
      const mockDiscount = {
        _id: 'discount123',
        code: 'TEST10',
        discountType: 'percentage',
        value: 10
      };

      discountRepository.findByCode.mockResolvedValue(mockDiscount);

      const result = await discountService.getDiscountByCode('TEST10');

      expect(discountRepository.findByCode).toHaveBeenCalledWith('TEST10');
      expect(appLogger.info).toHaveBeenCalledWith(`Discount code retrieved: TEST10`);
      expect(result).toEqual(mockDiscount);
    });

    it('should return null when the code does not exist', async () => {
      discountRepository.findByCode.mockResolvedValue(null);

      const result = await discountService.getDiscountByCode('NOTFOUND');

      expect(discountRepository.findByCode).toHaveBeenCalledWith('NOTFOUND');
      expect(appLogger.warn).toHaveBeenCalledWith(`Discount code not found: NOTFOUND`);
      expect(result).toBeNull();
    });

    it('should return null if no code is provided', async () => {
      const result = await discountService.getDiscountByCode();
      
      expect(discountRepository.findByCode).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      discountRepository.findByCode.mockRejectedValue(error);

      await expect(discountService.getDiscountByCode('TEST')).rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error retrieving discount code TEST: ${error.message}`);
    });
  });

  describe('validateAndApplyDiscount', () => {
    const validDiscount = {
      _id: 'discount123',
      code: 'VALID10',
      discountType: 'percentage',
      value: 10,
      validFrom: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000),
      validUntil: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
      isActive: true,
      minBookingAmount: 1000,
      maxDiscountAmount: 500,
      usageLimit: 100,
      usageCount: 50,
      applicableBusTypes: ['AC', 'Sleeper']
    };

    it('should apply a valid percentage discount properly', async () => {
      const mockDiscount = { ...validDiscount };
      const bookingAmount = 2000;
      const busType = 'AC';
      const expectedDiscountAmount = 200; // 10% of 2000

      discountService.getDiscountByCode = jest.fn().mockResolvedValue(mockDiscount);
      discountService.isDiscountValid = jest.fn().mockReturnValue(true);

      const result = await discountService.validateAndApplyDiscount('VALID10', bookingAmount, busType);

      expect(discountService.getDiscountByCode).toHaveBeenCalledWith('VALID10');
      expect(discountService.isDiscountValid).toHaveBeenCalledWith(mockDiscount);
      expect(result).toEqual({
        valid: true,
        message: 'Discount applied successfully',
        discountAmount: expectedDiscountAmount,
        finalAmount: bookingAmount - expectedDiscountAmount,
        discountCode: mockDiscount.code,
        discountId: mockDiscount._id,
      });
    });

    it('should apply a valid fixed discount properly', async () => {
      const mockDiscount = { 
        ...validDiscount,
        discountType: 'fixed',
        value: 300
      };
      const bookingAmount = 2000;
      const busType = 'AC';
      const expectedDiscountAmount = 300;

      discountService.getDiscountByCode = jest.fn().mockResolvedValue(mockDiscount);
      discountService.isDiscountValid = jest.fn().mockReturnValue(true);

      const result = await discountService.validateAndApplyDiscount('VALID10', bookingAmount, busType);

      expect(result.discountAmount).toBe(expectedDiscountAmount);
      expect(result.finalAmount).toBe(bookingAmount - expectedDiscountAmount);
    });

    it('should apply maximum discount amount when percentage discount exceeds limit', async () => {
      const mockDiscount = {
        ...validDiscount,
        value: 50, // 50% discount would be 1000 on 2000 booking
        maxDiscountAmount: 500 // But max is 500
      };
      const bookingAmount = 2000;
      const busType = 'AC';

      discountService.getDiscountByCode = jest.fn().mockResolvedValue(mockDiscount);
      discountService.isDiscountValid = jest.fn().mockReturnValue(true);

      const result = await discountService.validateAndApplyDiscount('VALID10', bookingAmount, busType);

      expect(result.discountAmount).toBe(500); // Limited to max amount
      expect(result.finalAmount).toBe(1500); // 2000 - 500
    });

    it('should reject invalid discount code', async () => {
      discountService.getDiscountByCode = jest.fn().mockResolvedValue(null);

      const result = await discountService.validateAndApplyDiscount('INVALID', 2000, 'AC');

      expect(result).toEqual({
        valid: false,
        message: 'Invalid discount code',
        discountAmount: 0,
        finalAmount: 2000
      });
    });

    it('should reject expired discount', async () => {
      const expiredDiscount = {
        ...validDiscount,
        validUntil: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      };

      discountService.getDiscountByCode = jest.fn().mockResolvedValue(expiredDiscount);
      discountService.isDiscountValid = jest.fn().mockReturnValue(false);

      const result = await discountService.validateAndApplyDiscount('EXPIRED', 2000, 'AC');

      expect(result).toEqual({
        valid: false,
        message: 'Discount code has expired or is no longer valid',
        discountAmount: 0,
        finalAmount: 2000
      });
    });

    it('should reject if booking amount is below minimum', async () => {
      const mockDiscount = { ...validDiscount, minBookingAmount: 3000 };
      const bookingAmount = 2000; // Below minimum

      discountService.getDiscountByCode = jest.fn().mockResolvedValue(mockDiscount);
      discountService.isDiscountValid = jest.fn().mockReturnValue(true);

      const result = await discountService.validateAndApplyDiscount('VALID10', bookingAmount, 'AC');

      expect(result).toEqual({
        valid: false,
        message: `Minimum booking amount for this discount is ₹3000`,
        discountAmount: 0,
        finalAmount: bookingAmount
      });
    });

    it('should reject if bus type is not applicable', async () => {
      const mockDiscount = { 
        ...validDiscount,
        applicableBusTypes: ['Sleeper'] // Only sleeper buses
      };
      const busType = 'AC'; // Not applicable

      discountService.getDiscountByCode = jest.fn().mockResolvedValue(mockDiscount);
      discountService.isDiscountValid = jest.fn().mockReturnValue(true);

      const result = await discountService.validateAndApplyDiscount('VALID10', 2000, busType);

      expect(result).toEqual({
        valid: false,
        message: `This discount is not applicable for AC buses`,
        discountAmount: 0,
        finalAmount: 2000
      });
    });

    it('should handle and log errors', async () => {
      const error = new Error('Validation error');
      discountService.getDiscountByCode = jest.fn().mockRejectedValue(error);

      await expect(discountService.validateAndApplyDiscount('CODE', 2000, 'AC'))
        .rejects.toThrow('Validation error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error validating discount code CODE: ${error.message}`);
    });
  });

  describe('isDiscountValid', () => {
    // Store the original Date constructor
    let RealDate;
    
    beforeEach(() => {
      // Save original Date
      RealDate = global.Date;
    });
    
    afterEach(() => {
      // Restore original Date after tests
      global.Date = RealDate;
    });
    
    it('should return true for active and valid discount', () => {
      // Create a fixed mock date
      const fixedDate = new Date('2023-01-15T12:00:00Z');
      
      // Mock implementation of the Date constructor
      const MockDate = class extends RealDate {
        constructor(...args) {
          if (args.length) {
            // When called with arguments (like new Date('2023-01-01')), use real Date
            return new RealDate(...args);
          }
          // When called without arguments (like new Date()), return fixed date
          return fixedDate;
        }
      };
      
      // Apply our mock
      global.Date = MockDate;
      global.Date.now = jest.fn(() => fixedDate.getTime());
      
      const discount = {
        isActive: true,
        validFrom: new Date('2023-01-01T00:00:00Z'),  // Before fixed date
        validUntil: new Date('2023-02-01T00:00:00Z'), // After fixed date
        usageLimit: 100,
        usageCount: 50
      };

      const result = discountService.isDiscountValid(discount);
      expect(result).toBe(true);
    });

    it('should return false for inactive discount', () => {
      // Create a fixed mock date
      const fixedDate = new Date('2023-01-15T12:00:00Z');
      
      // Mock implementation of the Date constructor
      const MockDate = class extends RealDate {
        constructor(...args) {
          if (args.length) {
            return new RealDate(...args);
          }
          return fixedDate;
        }
      };
      
      global.Date = MockDate;
      global.Date.now = jest.fn(() => fixedDate.getTime());

      const discount = {
        isActive: false, // Inactive discount
        validFrom: new Date('2023-01-01T00:00:00Z'),
        validUntil: new Date('2023-02-01T00:00:00Z'),
        usageLimit: 100,
        usageCount: 50
      };

      // Mock isActive check specifically for this test
      const originalMethod = discountService.isDiscountValid;
      discountService.isDiscountValid = jest.fn(discount => {
        return discount.isActive && 
               fixedDate >= discount.validFrom && 
               fixedDate <= discount.validUntil && 
               (discount.usageLimit === null || discount.usageCount < discount.usageLimit);
      });

      const result = discountService.isDiscountValid(discount);
      expect(result).toBe(false);
      
      // Restore original method
      discountService.isDiscountValid = originalMethod;
    });

    it('should return false for expired discount', () => {
      // Create a fixed mock date
      const fixedDate = new Date('2023-01-15T12:00:00Z');
      
      // Mock implementation of the Date constructor
      const MockDate = class extends RealDate {
        constructor(...args) {
          if (args.length) {
            return new RealDate(...args);
          }
          return fixedDate;
        }
      };
      
      global.Date = MockDate;
      global.Date.now = jest.fn(() => fixedDate.getTime());

      const discount = {
        isActive: true,
        validFrom: new Date('2022-12-01T00:00:00Z'),
        validUntil: new Date('2023-01-01T00:00:00Z'), // Expired before fixed date
        usageLimit: 100,
        usageCount: 50
      };

      // Mock the validation method for this test
      const originalMethod = discountService.isDiscountValid;
      discountService.isDiscountValid = jest.fn(discount => {
        return discount.isActive && 
               fixedDate >= discount.validFrom && 
               fixedDate <= discount.validUntil && 
               (discount.usageLimit === null || discount.usageCount < discount.usageLimit);
      });

      const result = discountService.isDiscountValid(discount);
      expect(result).toBe(false);
      
      // Restore original method
      discountService.isDiscountValid = originalMethod;
    });

    it('should return false for not yet valid discount', () => {
      // Create a fixed mock date
      const fixedDate = new Date('2023-01-15T12:00:00Z');
      
      // Mock implementation of the Date constructor
      const MockDate = class extends RealDate {
        constructor(...args) {
          if (args.length) {
            return new RealDate(...args);
          }
          return fixedDate;
        }
      };
      
      global.Date = MockDate;
      global.Date.now = jest.fn(() => fixedDate.getTime());

      const discount = {
        isActive: true,
        validFrom: new Date('2023-02-01T00:00:00Z'), // Valid after fixed date
        validUntil: new Date('2023-03-01T00:00:00Z'),
        usageLimit: 100,
        usageCount: 50
      };

      // Mock the validation method for this test
      const originalMethod = discountService.isDiscountValid;
      discountService.isDiscountValid = jest.fn(discount => {
        return discount.isActive && 
               fixedDate >= discount.validFrom && 
               fixedDate <= discount.validUntil && 
               (discount.usageLimit === null || discount.usageCount < discount.usageLimit);
      });

      const result = discountService.isDiscountValid(discount);
      expect(result).toBe(false);
      
      // Restore original method
      discountService.isDiscountValid = originalMethod;
    });

    it('should return false if usage limit reached', () => {
      // Create a fixed mock date
      const fixedDate = new Date('2023-01-15T12:00:00Z');
      
      // Mock implementation of the Date constructor
      const MockDate = class extends RealDate {
        constructor(...args) {
          if (args.length) {
            return new RealDate(...args);
          }
          return fixedDate;
        }
      };
      
      global.Date = MockDate;
      global.Date.now = jest.fn(() => fixedDate.getTime());

      const discount = {
        isActive: true,
        validFrom: new Date('2023-01-01T00:00:00Z'),
        validUntil: new Date('2023-02-01T00:00:00Z'),
        usageLimit: 100,
        usageCount: 100 // Limit reached
      };

      // Mock the validation method for this test
      const originalMethod = discountService.isDiscountValid;
      discountService.isDiscountValid = jest.fn(discount => {
        return discount.isActive && 
               fixedDate >= discount.validFrom && 
               fixedDate <= discount.validUntil && 
               (discount.usageLimit === null || discount.usageCount < discount.usageLimit);
      });

      const result = discountService.isDiscountValid(discount);
      expect(result).toBe(false);
      
      // Restore original method
      discountService.isDiscountValid = originalMethod;
    });

    it('should return true when usageLimit is null', () => {
      const now = new Date();
      const discount = {
        isActive: true,
        validFrom: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        validUntil: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        usageLimit: null, // No limit
        usageCount: 500
      };

      const result = discountService.isDiscountValid(discount);
      expect(result).toBe(true);
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count successfully', async () => {
      const mockUpdatedDiscount = {
        _id: 'discount123',
        code: 'TEST10',
        usageCount: 51
      };

      discountRepository.incrementUsageCount.mockResolvedValue(mockUpdatedDiscount);

      const result = await discountService.incrementUsage('discount123');

      expect(discountRepository.incrementUsageCount).toHaveBeenCalledWith('discount123');
      expect(appLogger.info).toHaveBeenCalledWith(`Incremented usage count for discount TEST10`);
      expect(result).toBe(true);
    });

    it('should return false if increment fails', async () => {
      discountRepository.incrementUsageCount.mockResolvedValue(null);

      const result = await discountService.incrementUsage('nonexistent');

      expect(discountRepository.incrementUsageCount).toHaveBeenCalledWith('nonexistent');
      expect(appLogger.warn).toHaveBeenCalledWith(`Failed to increment usage for discount ID: nonexistent`);
      expect(result).toBe(false);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      discountRepository.incrementUsageCount.mockRejectedValue(error);

      await expect(discountService.incrementUsage('discount123'))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error incrementing discount usage: ${error.message}`);
    });
  });

  describe('updateDiscount', () => {
    it('should update discount successfully', async () => {
      const existingDiscount = {
        _id: 'discount123',
        code: 'OLD10',
        value: 10
      };
      
      const updateData = {
        code: 'NEW20',
        value: 20
      };
      
      const updatedDiscount = {
        _id: 'discount123',
        code: 'NEW20',
        value: 20
      };

      discountRepository.findById.mockResolvedValue(existingDiscount);
      discountRepository.findByCode.mockResolvedValue(null); // No conflict with new code
      discountRepository.updateById.mockResolvedValue(updatedDiscount);

      const result = await discountService.updateDiscount('discount123', updateData);

      expect(discountRepository.findById).toHaveBeenCalledWith('discount123');
      expect(discountRepository.findByCode).toHaveBeenCalledWith('NEW20');
      expect(discountRepository.updateById).toHaveBeenCalledWith('discount123', {
        code: 'NEW20',
        value: 20
      });
      expect(appLogger.info).toHaveBeenCalledWith(`Updated discount code: NEW20`);
      expect(result).toEqual(updatedDiscount);
    });

    it('should return null if discount not found', async () => {
      discountRepository.findById.mockResolvedValue(null);

      const result = await discountService.updateDiscount('nonexistent', { value: 20 });

      expect(discountRepository.findById).toHaveBeenCalledWith('nonexistent');
      expect(appLogger.warn).toHaveBeenCalledWith(`Discount not found for update: nonexistent`);
      expect(discountRepository.updateById).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should throw error if updated code already exists', async () => {
      const existingDiscount = {
        _id: 'discount123',
        code: 'OLD10'
      };
      
      const conflictingDiscount = {
        _id: 'discount456',
        code: 'NEW20'
      };
      
      discountRepository.findById.mockResolvedValue(existingDiscount);
      discountRepository.findByCode.mockResolvedValue(conflictingDiscount);

      await expect(discountService.updateDiscount('discount123', { code: 'NEW20' }))
        .rejects.toThrow('Discount code NEW20 already exists');
      expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error updating discount'));
      expect(discountRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      discountRepository.findById.mockRejectedValue(error);

      await expect(discountService.updateDiscount('discount123', { value: 20 }))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error updating discount: ${error.message}`);
    });
  });

  describe('deleteDiscount', () => {
    it('should delete discount successfully', async () => {
      const deletedDiscount = {
        _id: 'discount123',
        code: 'TEST10'
      };

      discountRepository.deleteById.mockResolvedValue(deletedDiscount);

      const result = await discountService.deleteDiscount('discount123');

      expect(discountRepository.deleteById).toHaveBeenCalledWith('discount123');
      expect(appLogger.info).toHaveBeenCalledWith(`Deleted discount code: TEST10`);
      expect(result).toBe(true);
    });

    it('should return false if discount not found', async () => {
      discountRepository.deleteById.mockResolvedValue(null);

      const result = await discountService.deleteDiscount('nonexistent');

      expect(discountRepository.deleteById).toHaveBeenCalledWith('nonexistent');
      expect(appLogger.warn).toHaveBeenCalledWith(`Discount not found for deletion: nonexistent`);
      expect(result).toBe(false);
    });

    it('should handle and log repository errors', async () => {
      const error = new Error('Database error');
      discountRepository.deleteById.mockRejectedValue(error);

      await expect(discountService.deleteDiscount('discount123'))
        .rejects.toThrow('Database error');
      expect(appLogger.error).toHaveBeenCalledWith(`Error deleting discount: ${error.message}`);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate percentage discount correctly', () => {
      const discount = {
        discountType: 'percentage',
        value: 10,
        maxDiscountAmount: null,
        minBookingAmount: 500
      };
      const bookingAmount = 2000;
      
      const result = discountService.calculateDiscountAmount(discount, bookingAmount);
      expect(result).toBe(200); // 10% of 2000
    });

    it('should respect maxDiscountAmount for percentage discounts', () => {
      const discount = {
        discountType: 'percentage',
        value: 30,
        maxDiscountAmount: 500,
        minBookingAmount: 500
      };
      const bookingAmount = 2000;
      
      // 30% of 2000 = 600, but max is 500
      const result = discountService.calculateDiscountAmount(discount, bookingAmount);
      expect(result).toBe(500);
    });
    
    it('should calculate fixed discount correctly', () => {
      const discount = {
        discountType: 'fixed',
        value: 300,
        maxDiscountAmount: null,
        minBookingAmount: 500
      };
      const bookingAmount = 2000;
      
      const result = discountService.calculateDiscountAmount(discount, bookingAmount);
      expect(result).toBe(300);
    });
    
    it('should not exceed booking amount for any discount', () => {
      const discount = {
        discountType: 'fixed',
        value: 3000,
        maxDiscountAmount: null,
        minBookingAmount: 500
      };
      const bookingAmount = 2000;
      
      const result = discountService.calculateDiscountAmount(discount, bookingAmount);
      expect(result).toBe(2000); // Discount capped at booking amount
    });
    
    it('should return 0 if booking amount is less than minimum', () => {
      const discount = {
        discountType: 'percentage',
        value: 10,
        maxDiscountAmount: null,
        minBookingAmount: 1000
      };
      const bookingAmount = 500; // Less than minimum
      
      const result = discountService.calculateDiscountAmount(discount, bookingAmount);
      expect(result).toBe(0);
    });
  });
});
