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
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  console.log('Handling file upload with files:', files);
  
  // Handle both single file and array of files
  let imageFile = null;
  if (files && files.image) {
    if (Array.isArray(files.image)) {
      imageFile = files.image[0];
    } else {
      imageFile = files.image;
    }
  }
  
  if (imageFile) {
    try {
      console.log('Processing banner image upload:', {
        originalname: imageFile.originalname,
        mimetype: imageFile.mimetype,
        size: imageFile.size,
        path: imageFile.path
      });
      
      // Create upload directory if it doesn't exist
      const uploadDir = 'uploads/banners';
      const fullUploadDir = path.join(__dirname, '..', uploadDir);
      await fs.mkdir(fullUploadDir, { recursive: true });
      
      // Generate unique filename with proper extension handling
      const timestamp = Date.now();
      const originalName = imageFile.originalname || 'banner';
      const extension = path.extname(originalName) || '.jpg';
      const filename = `banner-${timestamp}-${Math.round(Math.random() * 1E9)}${extension}`;
      const filepath = path.join(fullUploadDir, filename);
      
      console.log('Saving banner image to:', filepath);
      
      // Check if file was saved by multer or if we need to save it
      if (imageFile.path && fs.existsSync(imageFile.path)) {
        // File was already saved by multer, just copy it to our location
        await fs.copyFile(imageFile.path, filepath);
        // Delete the temporary file
        await fs.unlink(imageFile.path);
      } else if (imageFile.buffer) {
        // File is in buffer, save it
        await fs.writeFile(filepath, imageFile.buffer);
      } else {
        throw new Error('No file data available');
      }
      
      // Return just the filename for database storage
      uploadedFiles.image = filename;
      
      console.log('Banner image uploaded successfully:', filename);
    } catch (error) {
      console.error('Banner image upload error:', error);
      throw new Error(`Banner image upload failed: ${error.message}`);
    }
  } else {
    console.log('No banner image provided in files:', files);
    throw new Error('Banner image is required');
  }
  
  return uploadedFiles;
};

// Helper function to delete old files
const deleteOldFiles = async (banner, newFiles) => {
  const filesToDelete = [];
  
  if (newFiles.image && banner.image && newFiles.image !== banner.image) {
    const oldImagePath = path.join(__dirname, '..', 'uploads/banners', banner.image);
    filesToDelete.push(oldImagePath);
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
      type,
      data,
      zone_id,
      featured,
      default_link
    } = req.body;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and type are required'
      });
    }

    // Validate banner type
    const validTypes = ['store_wise', 'item_wise', 'category_wise', 'common'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner type. Must be one of: store_wise, item_wise, category_wise, common'
      });
    }

    // Validate data field based on type
    if (type !== 'common' && !data) {
      return res.status(400).json({
        success: false,
        message: `Data field is required for ${type} banners`
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
      type,
      image: uploadedFiles.image,
      data: data || null,
      zone_id: parseInt(zone_id) || 1,
      featured: featured === 'true' ? 1 : 0,
      default_link,
      status: 1, // Default to active
      created_by: 'admin'
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

// Get all banners with pagination
const getBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    
    const whereClause = {};
    
    // Filter by type
    if (type) {
      whereClause.type = type;
    }
    
    // Filter by status
    if (status !== undefined) {
      whereClause.status = parseInt(status);
    }

    const { count, rows: banners } = await Banner.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(limit) * (parseInt(page) - 1)
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    // Transform data to match frontend expectations
    const transformedBanners = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.type, // Map type to subtitle for display
      description: banner.data, // Map data to description for display
      image: `/uploads/banners/${banner.image}`, // Construct full image URL
      banner_type: banner.type,
      button_text: banner.default_link ? 'View' : null,
      button_url: banner.default_link,
      is_active: banner.status === 1,
      is_featured: banner.featured === 1,
      sort_order: 0, // Not available in current schema
      clicks: 0, // Not available in current schema
      impressions: 0, // Not available in current schema
      ctr: 0 // Not available in current schema
    }));

    res.json({
      success: true,
      data: {
        banners: transformedBanners,
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
        const imagePath = path.join(__dirname, '..', 'uploads/banners', banner.image);
        await fs.unlink(imagePath);
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

    const newStatus = banner.status === 1 ? 0 : 1;
    await banner.update({ status: newStatus });

    res.json({
      success: true,
      message: `Banner ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
      data: { status: newStatus }
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

    const newFeatured = banner.featured === 1 ? 0 : 1;
    await banner.update({ featured: newFeatured });

    res.json({
      success: true,
      message: `Banner ${newFeatured === 1 ? 'featured' : 'unfeatured'} successfully`,
      data: { featured: newFeatured }
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

module.exports = {
  upload,
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  toggleBannerFeatured
};
