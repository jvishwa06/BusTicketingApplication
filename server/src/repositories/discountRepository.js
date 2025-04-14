import Discount from '../models/discount.js';
import { appLogger } from '../utils/logger.js';

class DiscountRepository {
  async createDiscount(discountData) {
    try {
      const discount = await Discount.create(discountData);
      appLogger.info(`Discount created in database with ID: ${discount._id}`);
      return discount;
    } catch (error) {
      appLogger.error(`Database error creating discount: ${error.message}`);
      throw error;
    }
  }


  async findDiscounts(query = {}) {
    try {
      const discounts = await Discount.find(query);
      appLogger.info(`Retrieved ${discounts.length} discounts from database`);
      return discounts;
    } catch (error) {
      appLogger.error(`Database error retrieving discounts: ${error.message}`);
      throw error;
    }
  }


  async findByCode(code) {
    try {
      if (!code) return null;
      
      const discount = await Discount.findOne({ code: code.toUpperCase() });
      if (discount) {
        appLogger.info(`Found discount in database with code: ${code}`);
      } else {
        appLogger.info(`No discount found in database with code: ${code}`);
      }
      return discount;
    } catch (error) {
      appLogger.error(`Database error finding discount by code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find a discount by its ID
   * @param {String} id - The discount ID
   * @returns {Promise<Object|null>} - The found discount or null
   */
  async findById(id) {
    try {
      const discount = await Discount.findById(id);
      if (discount) {
        appLogger.info(`Found discount in database with ID: ${id}`);
      } else {
        appLogger.info(`No discount found in database with ID: ${id}`);
      }
      return discount;
    } catch (error) {
      appLogger.error(`Database error finding discount by ID: ${error.message}`);
      throw error;
    }
  }


  async updateById(id, updateData) {
    try {
      const discount = await Discount.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (discount) {
        appLogger.info(`Updated discount in database with ID: ${id}`);
      } else {
        appLogger.warn(`Attempted to update non-existent discount with ID: ${id}`);
      }
      
      return discount;
    } catch (error) {
      appLogger.error(`Database error updating discount: ${error.message}`);
      throw error;
    }
  }

  async incrementUsageCount(id) {
    try {
      const discount = await Discount.findByIdAndUpdate(
        id,
        { $inc: { usageCount: 1 } },
        { new: true }
      );
      
      if (discount) {
        appLogger.info(`Incremented usage count for discount ID: ${id}`);
      } else {
        appLogger.warn(`Attempted to increment usage count for non-existent discount ID: ${id}`);
      }
      
      return discount;
    } catch (error) {
      appLogger.error(`Database error incrementing discount usage: ${error.message}`);
      throw error;
    }
  }


  async deleteById(id) {
    try {
      const discount = await Discount.findByIdAndDelete(id);
      
      if (discount) {
        appLogger.info(`Deleted discount from database with ID: ${id}`);
      } else {
        appLogger.warn(`Attempted to delete non-existent discount with ID: ${id}`);
      }
      
      return discount;
    } catch (error) {
      appLogger.error(`Database error deleting discount: ${error.message}`);
      throw error;
    }
  }
}

export default new DiscountRepository();
