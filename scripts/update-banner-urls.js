const { sequelize } = require('../config/database');
const Banner = require('../models/Banner');

const updateBannerUrls = async () => {
  try {
    console.log('🔄 Starting banner URL update...');
    
    // Get all banners
    const banners = await Banner.findAll();
    console.log(`📊 Found ${banners.length} banners to update`);
    
    let updatedCount = 0;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    for (const banner of banners) {
      let needsUpdate = false;
      const updates = {};
      
      // Update image URL if it exists and doesn't already have full URL
      if (banner.image && !banner.image.startsWith('http')) {
        const imagePath = banner.image.replace(/\\/g, '/').replace('uploads/', '');
        updates.image = `${baseUrl}/uploads/${imagePath}`;
        needsUpdate = true;
        console.log(`🖼️  Updating image: ${banner.image} → ${updates.image}`);
      }
      
      // Update the banner if needed
      if (needsUpdate) {
        await banner.update(updates);
        updatedCount++;
        console.log(`✅ Updated banner: ${banner.title}`);
      }
    }
    
    console.log(`🎉 Banner URL update completed! Updated ${updatedCount} banners`);
    
  } catch (error) {
    console.error('❌ Error updating banner URLs:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the update
updateBannerUrls();
