const Supplier     = require('../models/Supplier');
const asyncHandler = require('../utils/asyncHandler');

const getSuppliers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name:          { $regex: search, $options: 'i' } },
      { email:         { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [suppliers, total] = await Promise.all([
    Supplier.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(query)
  ]);

  res.json({ suppliers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(supplier);
});

const createSupplier = asyncHandler(async (req, res) => {
  const { name, email, phone, address, contactPerson, notes } = req.body;
  const supplier = await Supplier.create({ name, email, phone, address, contactPerson, notes });
  res.status(201).json(supplier);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const { name, email, phone, address, contactPerson, notes } = req.body;
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id, { name, email, phone, address, contactPerson, notes },
    { new: true, runValidators: true }
  );
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json(supplier);
});

const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  );
  if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
  res.json({ message: 'Supplier deleted successfully' });
});

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
