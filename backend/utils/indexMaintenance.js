const mongoose = require('mongoose');

const dropLegacyProductSkuIndex = async () => {
  try {
    const indexes    = await mongoose.connection.collection('products').indexes();
    const legacyIdx  = indexes.find((i) => i.name === 'sku_1' || i.key?.sku === 1);
    if (!legacyIdx) return;

    await mongoose.connection.collection('products').dropIndex(legacyIdx.name);
    console.log(`[IndexMaintenance] Dropped legacy index: ${legacyIdx.name}`);
  } catch (err) {
    console.warn('[IndexMaintenance] Warning:', err.message);
  }
};

module.exports = { dropLegacyProductSkuIndex };
