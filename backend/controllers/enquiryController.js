const CustomerEnquiry = require('../models/enquiry');
const Customer = require('../models/customer');

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

// Convert enquiry to customer (create or merge)
exports.convertEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enquiry = await CustomerEnquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

    // Try match by email or phone
    const matchQuery = [];
    if (enquiry.email) matchQuery.push({ email: enquiry.email });
    if (enquiry.phone) matchQuery.push({ phone: enquiry.phone });

    let customer = null;
    if (matchQuery.length) {
      customer = await Customer.findOne({ $or: matchQuery });
    }

    const now = new Date();

    if (customer) {
      // Merge: update interestedProducts (union) and push history
      const unionProducts = Array.from(new Set([...(customer.interestedProducts || []), ...(enquiry.products || [])]));
      customer.interestedProducts = unionProducts;
      customer.history = customer.history || [];
      customer.history.push({ date: now, action: 'Converted from enquiry', details: `Enquiry ${enquiry._id} merged` });
      await customer.save();
    } else {
      // Create new customer
      customer = await Customer.create({
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        address: '',
        status: 'Warm',
        interestedProducts: enquiry.products || [],
        notes: enquiry.notes || '',
        history: [
          { date: now, action: 'Created', details: 'Customer created from enquiry' },
        ],
      });
    }

    // Link back and update enquiry status
    enquiry.linkedCustomerId = customer._id;
    enquiry.status = 'Responded';
    await enquiry.save();

    res.json({ message: 'Converted', customer });
  } catch (err) {
    next(err);
  }
};
