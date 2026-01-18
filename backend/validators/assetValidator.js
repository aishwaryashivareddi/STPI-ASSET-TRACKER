import { body } from 'express-validator';
import { handleValidationErrors } from './authValidator.js';

export const validateCreateAsset = [
  body('name').trim().notEmpty().withMessage('Asset name is required'),
  body('asset_type').isIn(['HSDC', 'COMPUTER', 'ELECTRICAL', 'OFFICE', 'FURNITURE', 'FIREFIGHTING', 'BUILDING']).withMessage('Invalid asset type'),
  body('branch_id').isInt().withMessage('Branch ID must be a number'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('purchase_value').optional().isFloat({ min: 0 }).withMessage('Purchase value must be positive'),
  handleValidationErrors
];

export const validateTestingStatus = [
  body('testing_status').isIn(['Passed', 'Failed']).withMessage('Invalid testing status'),
  handleValidationErrors
];
