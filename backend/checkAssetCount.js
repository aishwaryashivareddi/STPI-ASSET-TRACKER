import { sequelize, Asset } from './models/index.js';

async function checkCount() {
  try {
    const count = await Asset.count();
    console.log(`\nTotal assets in database: ${count}`);
    
    const byType = await Asset.findAll({
      attributes: [
        'asset_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['asset_type']
    });
    
    console.log('\nAssets by type:');
    byType.forEach(item => {
      console.log(`   ${item.asset_type}: ${item.dataValues.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkCount();
