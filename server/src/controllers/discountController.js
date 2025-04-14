import DiscountService from '../services/discountService.js';
import { appLogger } from '../utils/logger.js';

class DiscountController {
  static async createDiscount(req, res) {
    try {
      const discount = await DiscountService.createDiscount(req.body);
      appLogger.info(`Discount created: ${discount.code}`);
      res.status(201).json({
        success: true,
        message: 'Discount code created successfully',
        data: discount
      });
    } catch (error) {
      appLogger.error(`Error creating discount: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }


  static async getAllDiscounts(req, res) {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const discounts = await DiscountService.getAllDiscounts(activeOnly);
      appLogger.info(`Retrieved ${discounts.length} discount codes`);
      res.status(200).json({
        success: true,
        message: 'Discount codes retrieved successfully',
        data: discounts
      });
    } catch (error) {
      appLogger.error(`Error retrieving discounts: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    }
  }

  static async getDiscountByCode(req, res) {
    try {
      const { code } = req.params;
      const discount = await DiscountService.getDiscountByCode(code);
      
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Discount code not found',
          data: null
        });
      }
      
      appLogger.info(`Retrieved discount code: ${code}`);
      res.status(200).json({
        success: true,
        message: 'Discount code retrieved successfully',
        data: discount
      });
    } catch (error) {
      appLogger.error(`Error retrieving discount: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    }
  }


  static async validateDiscount(req, res) {
    try {
      const { code, amount, busType } = req.body;
      
      if (!code || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Discount code and amount are required',
          data: null
        });
      }
      
      const result = await DiscountService.validateAndApplyDiscount(
        code,
        Number(amount),
        busType
      );
      
      if (!result.valid) {
        return res.status(200).json({
          success: false,
          message: result.message,
          data: {
            valid: false,
            discountAmount: 0,
            finalAmount: amount
          }
        });
      }
      
      appLogger.info(`Successfully validated discount code: ${code}`);
      res.status(200).json({
        success: true,
        message: 'Discount code applied successfully',
        data: {
          valid: true,
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount,
          discountId: result.discountId
        }
      });
    } catch (error) {
      appLogger.error(`Error validating discount: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    }
  }


  static async updateDiscount(req, res) {
    try {
      const { id } = req.params;
      const discount = await DiscountService.updateDiscount(id, req.body);
      
      if (!discount) {
        return res.status(404).json({
          success: false,
          message: 'Discount code not found',
          data: null
        });
      }
      
      appLogger.info(`Updated discount code: ${discount.code}`);
      res.status(200).json({
        success: true,
        message: 'Discount code updated successfully',
        data: discount
      });
    } catch (error) {
      appLogger.error(`Error updating discount: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }


  static async deleteDiscount(req, res) {
    try {
      const { id } = req.params;
      const success = await DiscountService.deleteDiscount(id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Discount code not found',
          data: null
        });
      }
      
      appLogger.info(`Deleted discount with ID: ${id}`);
      res.status(200).json({
        success: true,
        message: 'Discount code deleted successfully',
        data: null
      });
    } catch (error) {
      appLogger.error(`Error deleting discount: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    }
  }
}

export default DiscountController;
