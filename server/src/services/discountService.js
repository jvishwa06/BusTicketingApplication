import discountRepository from '../repositories/discountRepository.js';
import { appLogger } from '../utils/logger.js';

class DiscountService {
  async createDiscount(discountData) {
    try {
      if (!discountData.code || !discountData.discountType || !discountData.value || !discountData.validUntil) {
        throw new Error('Required discount data is missing');
      }
      
      discountData.code = discountData.code.toUpperCase();
      
      const existingDiscount = await discountRepository.findByCode(discountData.code);
      if (existingDiscount) {
        throw new Error(`Discount code ${discountData.code} already exists`);
      }
      
      const discount = await discountRepository.createDiscount(discountData);
      appLogger.info(`Discount code created: ${discount.code}`);
      return discount;
    } catch (error) {
      appLogger.error(`Error creating discount code: ${error.message}`);
      throw error;
    }
  }


  async getAllDiscounts(activeOnly = false) {
    try {
      const query = activeOnly ? { isActive: true } : {};
      const discounts = await discountRepository.findDiscounts(query);
      appLogger.info(`Retrieved ${discounts.length} discount codes`);
      return discounts;
    } catch (error) {
      appLogger.error(`Error fetching discount codes: ${error.message}`);
      throw error;
    }
  }


  async getDiscountByCode(code) {
    try {
      if (!code) return null;
      
      const discount = await discountRepository.findByCode(code);
      if (!discount) {
        appLogger.warn(`Discount code not found: ${code}`);
        return null;
      }
      
      appLogger.info(`Discount code retrieved: ${code}`);
      return discount;
    } catch (error) {
      appLogger.error(`Error retrieving discount code ${code}: ${error.message}`);
      throw error;
    }
  }

  async validateAndApplyDiscount(code, bookingAmount, busType) {
    try {
      const discount = await this.getDiscountByCode(code);
      
      if (!discount) {
        return {
          valid: false,
          message: 'Invalid discount code',
          discountAmount: 0,
          finalAmount: bookingAmount
        };
      }

      if (!this.isDiscountValid(discount)) {
        return {
          valid: false,
          message: 'Discount code has expired or is no longer valid',
          discountAmount: 0,
          finalAmount: bookingAmount
        };
      }

      if (discount.minBookingAmount > bookingAmount) {
        return {
          valid: false,
          message: `Minimum booking amount for this discount is ₹${discount.minBookingAmount}`,
          discountAmount: 0,
          finalAmount: bookingAmount
        };
      }

      if (discount.applicableBusTypes && 
          discount.applicableBusTypes.length > 0 && 
          !discount.applicableBusTypes.includes(busType)) {
        return {
          valid: false,
          message: `This discount is not applicable for ${busType} buses`,
          discountAmount: 0,
          finalAmount: bookingAmount
        };
      }

      const discountAmount = this.calculateDiscountAmount(discount, bookingAmount);
      const finalAmount = bookingAmount - discountAmount;

      appLogger.info(`Applied discount code ${code}, amount: ${discountAmount}`);
      
      return {
        valid: true,
        message: 'Discount applied successfully',
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        discountCode: discount.code,
        discountId: discount._id
      };
    } catch (error) {
      appLogger.error(`Error validating discount code ${code}: ${error.message}`);
      throw error;
    }
  }
  
 
  isDiscountValid(discount) {
    const now = new Date();
    return (
      discount.isActive &&
      now >= discount.validFrom &&
      now <= discount.validUntil &&
      (discount.usageLimit === null || discount.usageCount < discount.usageLimit)
    );
  }
  

  calculateDiscountAmount(discount, bookingAmount) {
    if (bookingAmount < discount.minBookingAmount) {
      return 0;
    }

    let discountAmount = 0;
    if (discount.discountType === 'percentage') {
      discountAmount = (bookingAmount * discount.value) / 100;
      if (discount.maxDiscountAmount !== null && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }
    } else { // fixed discount
      discountAmount = discount.value;
    }

    return Math.min(discountAmount, bookingAmount); // Cannot discount more than the booking amount
  }

  async incrementUsage(discountId) {
    try {
      const result = await discountRepository.incrementUsageCount(discountId);
      
      if (!result) {
        appLogger.warn(`Failed to increment usage for discount ID: ${discountId}`);
        return false;
      }
      
      appLogger.info(`Incremented usage count for discount ${result.code}`);
      return true;
    } catch (error) {
      appLogger.error(`Error incrementing discount usage: ${error.message}`);
      throw error;
    }
  }


  async updateDiscount(discountId, updateData) {
    try {
      const existingDiscount = await discountRepository.findById(discountId);
      if (!existingDiscount) {
        appLogger.warn(`Discount not found for update: ${discountId}`);
        return null;
      }
      
      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase();
        const codeExists = await discountRepository.findByCode(updateData.code);
        if (codeExists && codeExists._id.toString() !== discountId) {
          throw new Error(`Discount code ${updateData.code} already exists`);
        }
      }
      
      const discount = await discountRepository.updateById(discountId, updateData);
      appLogger.info(`Updated discount code: ${discount.code}`);
      return discount;
    } catch (error) {
      appLogger.error(`Error updating discount: ${error.message}`);
      throw error;
    }
  }

  async deleteDiscount(discountId) {
    try {
      const result = await discountRepository.deleteById(discountId);
      
      if (!result) {
        appLogger.warn(`Discount not found for deletion: ${discountId}`);
        return false;
      }
      
      appLogger.info(`Deleted discount code: ${result.code}`);
      return true;
    } catch (error) {
      appLogger.error(`Error deleting discount: ${error.message}`);
      throw error;
    }
  }
}

export default new DiscountService();
