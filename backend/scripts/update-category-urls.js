const { sequelize } = require('../config/database');
const Category = require('../models/Category');

const updateCategoryUrls = async () => {
  try {
    console.log('🔄 Starting category URL update...');
    
    // Get all categories
    const categories = await Category.findAll();
    console.log(`📊 Found ${categories.length} categories to update`);
    
    let updatedCount = 0;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    for (const category of categories) {
      let needsUpdate = false;
      const updates = {};
      
      // Update image URL if it exists and doesn't already have full URL
      if (category.image && !category.image.startsWith('http')) {
        const imagePath = category.image.replace(/\\/g, '/').replace('uploads/', '');
        updates.image = `${baseUrl}/uploads/${imagePath}`;
        needsUpdate = true;
        console.log(`🖼️  Updating image: ${category.image} → ${updates.image}`);
      }
      
      // Update the category if needed
      if (needsUpdate) {
        await category.update(updates);
        updatedCount++;
        console.log(`✅ Updated category: ${category.name}`);
      }
    }
    
    console.log(`🎉 Category URL update completed! Updated ${updatedCount} categories`);
    
  } catch (error) {
    console.error('❌ Error updating category URLs:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the update
updateCategoryUrls();
