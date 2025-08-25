const { sequelize } = require('../config/database');
const Brand = require('../models/Brand');

const updateBrandUrls = async () => {
  try {
    console.log('🔄 Starting brand URL update...');
    
    // Get all brands
    const brands = await Brand.findAll();
    console.log(`📊 Found ${brands.length} brands to update`);
    
    let updatedCount = 0;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    for (const brand of brands) {
      let needsUpdate = false;
      const updates = {};
      
      // Update logo URL if it exists and doesn't already have full URL
      if (brand.logo && !brand.logo.startsWith('http')) {
        const logoPath = brand.logo.replace(/\\/g, '/').replace('uploads/', '');
        updates.logo = `${baseUrl}/uploads/${logoPath}`;
        needsUpdate = true;
        console.log(`🖼️  Updating logo: ${brand.logo} → ${updates.logo}`);
      }
      
      // Update banner URL if it exists and doesn't already have full URL
      if (brand.banner && !brand.banner.startsWith('http')) {
        const bannerPath = brand.banner.replace(/\\/g, '/').replace('uploads/', '');
        updates.banner = `${baseUrl}/uploads/${bannerPath}`;
        needsUpdate = true;
        console.log(`🖼️  Updating banner: ${brand.banner} → ${updates.banner}`);
      }
      
      // Update the brand if needed
      if (needsUpdate) {
        await brand.update(updates);
        updatedCount++;
        console.log(`✅ Updated brand: ${brand.name}`);
      }
    }
    
    console.log(`🎉 Brand URL update completed! Updated ${updatedCount} brands`);
    
  } catch (error) {
    console.error('❌ Error updating brand URLs:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the update
updateBrandUrls();
