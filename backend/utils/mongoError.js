
const getDuplicateKeyMessage = (error, fallback = 'Duplicate value already exists') => {
  if (!error || error.code !== 11000) return fallback;

  const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
  if (!field) return fallback;

  const labels = { sku: 'SKU', email: 'Email', username: 'Username' };
  const label  = labels[field] || (field.charAt(0).toUpperCase() + field.slice(1));
  return `${label} already exists`;
};

module.exports = { getDuplicateKeyMessage };
