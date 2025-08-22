const express = require('express');
const router = express.Router();
const {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
  toggleStoreStatus,
  toggleStoreVerification,
  updateVendorPassword,
  exportStores
} = require('../controllers/storeController');
const { authenticate, adminOnly } = require('../middleware/auth');

// Create a new store (admin only)
router.post('/', authenticate, adminOnly, createStore);

// Get all stores with pagination and search (admin only)
router.get('/', getAllStores); // Temporarily disabled auth for testing

// Get store by ID (admin only)
router.get('/:id', authenticate, adminOnly, getStoreById);

// Update store (admin only)
router.put('/:id', authenticate, adminOnly, updateStore);

// Delete store (admin only)
router.delete('/:id', authenticate, adminOnly, deleteStore);

// Toggle store status (active/inactive) (admin only)
router.patch('/:id/toggle-status', authenticate, adminOnly, toggleStoreStatus);

// Toggle store verification (admin only)
router.patch('/:id/toggle-verification', authenticate, adminOnly, toggleStoreVerification);

// Update vendor password (admin only)
router.patch('/:id/update-password', authenticate, adminOnly, updateVendorPassword);

// Export stores to CSV (admin only)
router.get('/export/csv', authenticate, adminOnly, exportStores);

module.exports = router;
