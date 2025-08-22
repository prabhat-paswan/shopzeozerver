const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/type/:banner_type/:limit?', bannerController.getActiveBannersByType);
router.get('/featured', bannerController.getFeaturedBanners);
router.post('/:id/analytics', bannerController.updateBannerAnalytics);

// Protected routes (admin only) - TEMPORARILY DISABLED FOR TESTING
// router.use(authenticate);
// router.use(authorize('admin'));

// Banner CRUD operations
router.post('/', bannerController.upload.single('image'), bannerController.createBanner);

router.get('/', bannerController.getAllBanners);
router.get('/:id', bannerController.getBannerById);

router.put('/:id', bannerController.upload.single('image'), bannerController.updateBanner);

router.delete('/:id', bannerController.deleteBanner);

// Banner management operations
router.patch('/:id/toggle-status', bannerController.toggleBannerStatus);
router.patch('/:id/toggle-featured', bannerController.toggleBannerFeatured);

// Export functionality
router.get('/export/csv', bannerController.exportBanners);

module.exports = router;
