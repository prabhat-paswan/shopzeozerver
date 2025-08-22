const Banner = require('../models/Banner');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for banner image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/banners');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for banners
  }
});

// Helper function to handle file uploads
const handleFileUpload = async (files) => {
  const uploadedFiles = {};
  
  if (files.image) {
    uploadedFiles.image = files.image[0].path;
  }
  
  return uploadedFiles;
};

// Helper function to delete old files
const deleteOldFiles = async (banner, newFiles) => {
  const filesToDelete = [];
  
  if (newFiles.image && banner.image && newFiles.image !== banner.image) {
    filesToDelete.push(banner.image);
  }
  
  for (const filePath of filesToDelete) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }
};

// Create a new banner
const createBanner = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image_alt_text,
      banner_type,
      resource_type,
      resource_id,
      resource_url,
      button_text,
      button_url,
      start_date,
      end_date,
      is_active,
      is_featured,
      sort_order,
      target_audience,
      display_conditions,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;

    // Validate required fields
    if (!title || !banner_type) {
      return res.status(400).json({
        success: false,
        message: 'Title and banner type are required'
      });
    }

    // Handle file uploads
    let uploadedFiles = {};
    if (req.files) {
      uploadedFiles = await handleFileUpload(req.files);
    }

    // Validate image requirement
    if (!uploadedFiles.image) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required'
      });
    }

    // Create banner
    const banner = await Banner.create({
      title,
      subtitle,
      description,
      image: uploadedFiles.image,
      image_alt_text,
      banner_type,
      resource_type,
      resource_id: resource_id ? parseInt(resource_id) : null,
      resource_url,
      button_text,
      button_url,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      is_active: is_active === 'true',
      is_featured: is_featured === 'true',
      sort_order: sort_order ? parseInt(sort_order) : 0,
      target_audience,
      display_conditions,
      meta_title,
      meta_description,
      meta_keywords
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
};

// Get all banners with pagination and search
const getAllBanners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      featured = '',
      banner_type = '',
      resource_type = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search by banner content
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { subtitle: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by status
    if (status !== '') {
      whereClause.is_active = status === 'active';
    }

    // Filter by featured
    if (featured !== '') {
      whereClause.is_featured = featured === 'featured';
    }

    // Filter by banner type
    if (banner_type) {
      whereClause.banner_type = banner_type;
    }

    // Filter by resource type
    if (resource_type) {
      whereClause.resource_type = resource_type;
    }

    const { count, rows: banners } = await Banner.findAndCountAll({
      where: whereClause,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        banners,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message
    });
  }
};

// Get banner by ID
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner',
      error: error.message
    });
  }
};

// Update banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Handle file uploads
    let uploadedFiles = {};
    if (req.files) {
      uploadedFiles = await handleFileUpload(req.files);
    }

    // Merge uploaded files with update data
    const finalUpdateData = { ...updateData, ...uploadedFiles };

    // Delete old files if new ones are uploaded
    if (Object.keys(uploadedFiles).length > 0) {
      await deleteOldFiles(banner, uploadedFiles);
    }

    await banner.update(finalUpdateData);

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
};

// Delete banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete associated image file
    if (banner.image) {
      try {
        await fs.unlink(banner.image);
      } catch (error) {
        console.error('Error deleting banner image:', error);
      }
    }

    await banner.destroy();

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
};

// Toggle banner status
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const newStatus = !banner.is_active;
    await banner.update({ is_active: newStatus });

    res.json({
      success: true,
      message: `Banner ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner status',
      error: error.message
    });
  }
};

// Toggle banner featured status
const toggleBannerFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const newFeaturedStatus = !banner.is_featured;
    await banner.update({ is_featured: newFeaturedStatus });

    res.json({
      success: true,
      message: `Banner ${newFeaturedStatus ? 'featured' : 'unfeatured'} successfully`,
      data: { is_featured: newFeaturedStatus }
    });
  } catch (error) {
    console.error('Toggle banner featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner featured status',
      error: error.message
    });
  }
};

// Export banners to CSV
const exportBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    // Convert to CSV format
    const csvData = banners.map(banner => ({
      'Banner ID': banner.id,
      'Title': banner.title,
      'Subtitle': banner.subtitle || '',
      'Description': banner.description || '',
      'Banner Type': banner.banner_type,
      'Resource Type': banner.resource_type || '',
      'Resource ID': banner.resource_id || '',
      'Resource URL': banner.resource_url || '',
      'Button Text': banner.button_text || '',
      'Button URL': banner.button_url || '',
      'Start Date': banner.start_date || '',
      'End Date': banner.end_date || '',
      'Featured': banner.is_featured ? 'Yes' : 'No',
      'Status': banner.is_active ? 'Active' : 'Inactive',
      'Sort Order': banner.sort_order,
      'Clicks': banner.clicks || 0,
      'Impressions': banner.impressions || 0,
      'CTR': banner.ctr || 0,
      'Target Audience': banner.target_audience || '',
      'Created Date': banner.created_at
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=banners.csv');

    // Simple CSV conversion
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value || ''}"`).join(','))
    ].join('\n');

    res.send(csvString);
  } catch (error) {
    console.error('Export banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export banners',
      error: error.message
    });
  }
};

// Get active banners by type
const getActiveBannersByType = async (req, res) => {
  try {
    const { banner_type, limit = 5 } = req.params;

    const banners = await Banner.findAll({
      where: { 
        is_active: true,
        banner_type: banner_type
      },
      order: [['sort_order', 'ASC'], ['is_featured', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Get active banners by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active banners',
      error: error.message
    });
  }
};

// Get featured banners
const getFeaturedBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { is_active: true, is_featured: true },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Get featured banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured banners',
      error: error.message
    });
  }
};

// Update banner analytics (clicks, impressions)
const updateBannerAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'click' or 'impression'

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    let updateData = {};
    
    if (action === 'click') {
      updateData.clicks = (banner.clicks || 0) + 1;
    } else if (action === 'impression') {
      updateData.impressions = (banner.impressions || 0) + 1;
    }

    // Calculate CTR (Click Through Rate)
    if (updateData.impressions && updateData.clicks) {
      updateData.ctr = ((updateData.clicks / updateData.impressions) * 100).toFixed(2);
    } else if (updateData.clicks && banner.impressions) {
      updateData.ctr = ((updateData.clicks / banner.impressions) * 100).toFixed(2);
    }

    await banner.update(updateData);

    res.json({
      success: true,
      message: 'Banner analytics updated successfully',
      data: { 
        clicks: updateData.clicks || banner.clicks,
        impressions: updateData.impressions || banner.impressions,
        ctr: updateData.ctr || banner.ctr
      }
    });
  } catch (error) {
    console.error('Update banner analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner analytics',
      error: error.message
    });
  }
};

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  toggleBannerFeatured,
  exportBanners,
  getActiveBannersByType,
  getFeaturedBanners,
  updateBannerAnalytics,
  upload
};
