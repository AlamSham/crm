const CustomerEnquiry = require('../models/enquiry');

// List enquiries with pagination and filters
exports.listEnquiries = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      priority,
    } = req.query;

    const q = {};
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (search) {
      q.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { products: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      CustomerEnquiry.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      CustomerEnquiry.countDocuments(q),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// Create enquiry
exports.createEnquiry = async (req, res, next) => {
  try {
    const data = req.body || {};
    const created = await CustomerEnquiry.create(data);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// Update enquiry
exports.updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};
    const updated = await CustomerEnquiry.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete enquiry
exports.deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await CustomerEnquiry.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Enquiry not found' });
    res.json({ message: 'Enquiry deleted' });
  } catch (err) {
    next(err);
  }
};

