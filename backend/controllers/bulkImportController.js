const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Store = require('../models/Store');
const Brand = require('../models/Brand');

// CSV Column Mapping - User-friendly version
const CSV_COLUMNS = {
  'Product Code': 'product_code',
  'Amazon ASIN': 'amazon_asin',
  'Name': 'name',
  'Sku Id': 'sku_id',
  'Description': 'description',
  'Selling Price': 'selling_price',
  'MRP': 'billing_price_mrp',
  'Cost Price': 'cost_price',
  'Quantity': 'quantity',
  'Packaging Length (in cm)': 'packaging_length',
  'Packaging Breadth (in cm)': 'packaging_width',
  'Packaging Height (in cm)': 'packaging_height',
  'Packaging Weight (in kg)': 'packaging_weight',
  'GST %': 'gst_percentage',
  'Image 1': 'image_1',
  'Image 2': 'image_2',
  'Image 3': 'image_3',
  'Image 4': 'image_4',
  'Image 5': 'image_5',
  'Image 6': 'image_6',
  'Image 7': 'image_7',
  'Image 8': 'image_8',
  'Image 9': 'image_9',
  'Image 10': 'image_10',
  'Video 1': 'video_1',
  'Video 2': 'video_2',
  'Product Type': 'product_type',
  'Size': 'size',
  'Colour': 'colour',
  'Return/Exchange Condition': 'return_exchange_condition',
  'HSN Code': 'hsn_code',
  'Customisation Id': 'customisation_id',
  'Category Name': 'category_name',
  'Sub Category Name': 'sub_category_name',
  'Store Name': 'store_name'
};

// Validation functions
const validateNumeric = (value, fieldName) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }
  return num;
};

const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value.toString().trim();
};

// Find category by name (case-insensitive)
const findCategoryByName = async (categoryName) => {
  if (!categoryName) return null;
  
  const category = await Category.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')), 
      sequelize.fn('LOWER', categoryName.trim())
    )
  });
  
  if (!category) {
    throw new Error(`Category "${categoryName}" not found. Please check the spelling or create it first.`);
  }
  
  return category.id;
};

// Find subcategory by name and category (case-insensitive)
const findSubCategoryByName = async (subCategoryName, categoryId) => {
  if (!subCategoryName) return null;
  
  const subCategory = await SubCategory.findOne({
    where: {
      category_id: categoryId,
      name: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')), 
        sequelize.fn('LOWER', subCategoryName.trim())
      )
    }
  });
  
  if (!subCategory) {
    throw new Error(`Subcategory "${subCategoryName}" not found in the selected category. Please check the spelling or create it first.`);
  }
  
  return subCategory.id;
};

// Find store by name (case-insensitive)
const findStoreByName = async (storeName) => {
  if (!storeName) return null;
  
  console.log(`Looking for store with name: "${storeName}"`);
  
  const store = await Store.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')), 
      sequelize.fn('LOWER', storeName.trim())
    )
  });
  
  if (!store) {
    const availableStores = await getAvailableStoreNames();
    console.log(`Store not found. Available stores: ${availableStores}`);
    throw new Error(`Store "${storeName}" not found. Please check the spelling or create it first. Available stores: ${availableStores}`);
  }
  
  console.log(`Found store: ${store.name} with ID: ${store.id}`);
  return store.id;
};

// Helper function to get available store names for better error messages
const getAvailableStoreNames = async () => {
  try {
    const stores = await Store.findAll({
      attributes: ['name'],
      where: { is_active: true }
    });
    return stores.map(s => s.name).join(', ');
  } catch (error) {
    return 'Unable to fetch store list';
  }
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const processMediaUrls = (row) => {
  const media = {
    images: [],
    videos: []
  };

  // Process images
  for (let i = 1; i <= 10; i++) {
    const imageKey = `image_${i}`;
    if (row[imageKey] && row[imageKey].trim()) {
      let imageUrl = row[imageKey].trim();
      
      // If it's a URL, store it as-is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        media.images.push(imageUrl);
      } else {
        // Assume it's a filename, build the full URL
        media.images.push(`/uploads/products/${imageUrl}`);
      }
    }
  }

  // Process videos
  for (let i = 1; i <= 2; i++) {
    const videoKey = `video_${i}`;
    if (row[videoKey] && row[videoKey].trim()) {
      let videoUrl = row[videoKey].trim();
      
      if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
        media.videos.push(videoUrl);
      } else {
        media.videos.push(`/uploads/products/${videoUrl}`);
      }
    }
  }

  return media;
};

// Main bulk import function
const bulkImportProducts = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const { upsertMode = 'upsert' } = req.body; // 'skip' or 'upsert'
    const filePath = req.file.path;
    
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      duplicates: 0,
      upserts: 0,
      errors: []
    };

    const products = [];
    const failedRows = [];

    // Parse CSV file
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          results.total++;
          
          try {
            // Validate required fields
            const name = validateRequired(row['Name'], 'Name');
            const skuId = validateRequired(row['Sku Id'], 'Sku Id');
            const categoryName = validateRequired(row['Category Name'], 'Category Name');
            const storeName = validateRequired(row['Store Name'], 'Store Name');
            
            // Find IDs by names
            const categoryId = await findCategoryByName(categoryName);
            const storeId = await findStoreByName(storeName);
            const subCategoryId = row['Sub Category Name'] ? 
              await findSubCategoryByName(row['Sub Category Name'], categoryId) : null;
            
            // Check for duplicate SKU (only if upsert mode is 'skip')
            let existingProduct = null;
            if (upsertMode === 'skip') {
              existingProduct = await Product.findOne({ 
                where: { sku_id: skuId },
                transaction 
              });

              if (existingProduct) {
                results.duplicates++;
                failedRows.push({
                  row: results.total,
                  sku: skuId,
                  error: 'SKU already exists (skip mode)',
                  data: row
                });
                return;
              }
            }

            // Process and validate data
            const productData = {
              name,
              sku_id: skuId,
              product_code: row['Product Code'] || null,
              amazon_asin: row['Amazon ASIN'] || null,
              description: row['Description'] || null,
              selling_price: validateNumeric(row['Selling Price'], 'Selling Price'),
              billing_price_mrp: validateNumeric(row['MRP'], 'MRP'),
              cost_price: validateNumeric(row['Cost Price'], 'Cost Price'),
              gst_percentage: validateNumeric(row['GST %'], 'GST %'),
              hsn_code: row['HSN Code'] || null,
              product_type: row['Product Type'] || null,
              size: row['Size'] || null,
              colour: row['Colour'] || null,
              return_exchange_condition: row['Return/Exchange Condition'] || null,
              customisation_id: row['Customisation Id'] || null,
              category_id: categoryId,
              sub_category_id: subCategoryId,
              store_id: storeId,
              slug: generateSlug(name),
              is_active: true,
              is_featured: false
            };

            // Process media
            const media = processMediaUrls(row);
            if (media.images.length > 0) {
              productData.images = media.images.join(',');
            }
            if (media.videos.length > 0) {
              productData.videos = media.videos.join(',');
            }

            // Create or update product
            let product;
            if (existingProduct && upsertMode === 'upsert') {
              product = await existingProduct.update(productData, { transaction });
              results.upserts++;
            } else {
              // Always create new product if not in strict mode
              product = await Product.create(productData, { transaction });
              results.success++;
            }

            products.push(product);

          } catch (error) {
            results.failed++;
            failedRows.push({
              row: results.total,
              sku: row['Sku Id'] || 'N/A',
              error: error.message,
              data: row
            });
            results.errors.push({
              row: results.total,
              sku: row['Sku Id'] || 'N/A',
              error: error.message
            });
          }
        })
        .on('end', async () => {
          try {
            await transaction.commit();
            
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            
            res.json({
              success: true,
              message: 'Bulk import completed',
              results,
              failedRows
            });
          } catch (error) {
            await transaction.rollback();
            reject(error);
          }
        })
        .on('error', async (error) => {
          await transaction.rollback();
          reject(error);
        });
    });

  } catch (error) {
    await transaction.rollback();
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk import failed',
      error: error.message
    });
  }
};

// Get import status (for progress tracking)
const getImportStatus = async (req, res) => {
  // This would typically track progress of a background job
  // For now, return a simple status
  res.json({
    success: true,
    status: 'completed',
    message: 'Import status tracking not implemented yet'
  });
};

// Download failed rows CSV
const downloadFailedRows = async (req, res) => {
  try {
    const { failedRows } = req.body;
    
    if (!failedRows || failedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No failed rows to download'
      });
    }

    // Create CSV content
    const headers = Object.keys(CSV_COLUMNS).join(',') + ',Error Reason';
    const rows = failedRows.map(row => {
      const csvRow = Object.keys(CSV_COLUMNS).map(key => {
        const value = row.data[key] || '';
        return `"${value}"`;
      });
      csvRow.push(`"${row.error}"`);
      return csvRow.join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="failed_imports.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('Download failed rows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download failed rows',
      error: error.message
    });
  }
};

module.exports = {
  bulkImportProducts,
  getImportStatus,
  downloadFailedRows
};
