import express from 'express';
import DiscountController from '../controllers/discountController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware.authenticate);

// router.post('/validate', authMiddleware.authorizeRoles('user'), DiscountController.validateDiscount);
router.post('/', authMiddleware.authorizeRoles('operator'),  DiscountController.createDiscount);
router.get('/', authMiddleware.authorizeRoles('operator'), DiscountController.getAllDiscounts);
router.get('/:code', authMiddleware.authorizeRoles('operator'),  DiscountController.getDiscountByCode);
router.put('/:id', authMiddleware.authorizeRoles('operator'),  DiscountController.updateDiscount);
router.delete('/:id', authMiddleware.authorizeRoles('operator'),  DiscountController.deleteDiscount);

export default router;