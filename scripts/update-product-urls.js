const { sequelize } = require('../config/database');
const Product = require('../models/Product');

const updateProductUrls = async () => {
  try {
    console.log('🔄 Starting product URL update...');
    
    // Get all products
    const products = await Product.findAll();
    console.log(`📊 Found ${products.length} products to update`);
    
    let updatedCount = 0;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    for (const product of products) {
      let needsUpdate = false;
      const updates = {};
      
      // Update image URLs if they exist and don't already have full URLs
      const imageFields = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5', 'image_6', 'image_7', 'image_8', 'image_9', 'image_10'];
      
      for (const field of imageFields) {
        if (product[field] && !product[field].startsWith('http')) {
          const imagePath = product[field].replace(/\\/g, '/').replace('uploads/', '');
          updates[field] = `${baseUrl}/uploads/${imagePath}`;
          needsUpdate = true;
          console.log(`🖼️  Updating ${field}: ${product[field]} → ${updates[field]}`);
        }
      }
      
      // Update video URLs if they exist and don't already have full URLs
      const videoFields = ['video_1', 'video_2'];
      
      for (const field of videoFields) {
        if (product[field] && !product[field].startsWith('http')) {
          const videoPath = product[field].replace(/\\/g, '/').replace('uploads/', '');
          updates[field] = `${baseUrl}/uploads/${videoPath}`;
          needsUpdate = true;
          console.log(`🎥 Updating ${field}: ${product[field]} → ${updates[field]}`);
        }
      }
      
      // Update the product if needed
      if (needsUpdate) {
        await product.update(updates);
        updatedCount++;
        console.log(`✅ Updated product: ${product.name}`);
      }
    }
    
    console.log(`🎉 Product URL update completed! Updated ${updatedCount} products`);
    
  } catch (error) {
    console.error('❌ Error updating product URLs:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the update
updateProductUrls();
