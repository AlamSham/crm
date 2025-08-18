const User = require('../models/user');
const cloudinary = require('../utils/cloudinary');
const bcrypt = require('bcrypt');

// helper to upload buffer to cloudinary
async function uploadAvatarBuffer(buffer) {
  if (!buffer) return null;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'crm/avatars', resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// List users with optional search and pagination
exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const query = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { role: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { name, email, active, password, isLeadAccess, isCatalogAccess, isTemplateAccess } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'password (min 6 chars) is required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // If avatar file provided, upload to Cloudinary
    let avatarUrl = null;
    if (req.file && req.file.buffer) {
      try {
        // Debug logs for avatar upload
        console.log('[users/create] Avatar provided:', {
          size: req.file.size,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        });
        // Check Cloudinary env quickly
        const missingEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
          .filter((k) => !process.env[k]);
        if (missingEnv.length) {
          console.error('[users/create] Cloudinary env missing:', missingEnv.join(', '));
        }

        avatarUrl = await uploadAvatarBuffer(req.file.buffer);
      } catch (e) {
        console.error('[users/create] Avatar upload failed:', e);
        return res.status(500).json({ message: 'Avatar upload failed', error: e.message });
      }
    } else {
      // No avatar attached
      if (req.file && !req.file.buffer) {
        console.warn('[users/create] Avatar file present but no buffer');
      } else {
        console.log('[users/create] No avatar provided');
      }
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name,
      email,
      role: 'Merchandiser',
      active,
      password: hashed,
      isLeadAccess: typeof isLeadAccess === 'string' ? isLeadAccess === 'true' : !!isLeadAccess,
      isCatalogAccess: typeof isCatalogAccess === 'string' ? isCatalogAccess === 'true' : !!isCatalogAccess,
      isTemplateAccess: typeof isTemplateAccess === 'string' ? isTemplateAccess === 'true' : !!isTemplateAccess,
      avatar: avatarUrl || undefined,
    });
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json(safe);
  } catch (err) {
    console.error('[users/create] Failed to create user:', err);
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, active, password, isLeadAccess, isCatalogAccess, isTemplateAccess } = req.body;

    const update = { };
    if (typeof name !== 'undefined') update.name = name;
    // role is fixed as 'Merchandiser' and not updatable via API
    if (typeof active !== 'undefined') update.active = active;
    // removed: isFollowUpPerson, isEmailAccess
    if (typeof isLeadAccess !== 'undefined') {
      update.isLeadAccess = typeof isLeadAccess === 'string' ? isLeadAccess === 'true' : !!isLeadAccess;
    }
    if (typeof isCatalogAccess !== 'undefined') {
      update.isCatalogAccess = typeof isCatalogAccess === 'string' ? isCatalogAccess === 'true' : !!isCatalogAccess;
    }
    if (typeof isTemplateAccess !== 'undefined') {
      update.isTemplateAccess = typeof isTemplateAccess === 'string' ? isTemplateAccess === 'true' : !!isTemplateAccess;
    }
    if (typeof password !== 'undefined' && String(password).length >= 6) {
      update.password = await bcrypt.hash(String(password), 10);
    }

    // If new avatar file provided, upload and set
    if (req.file && req.file.buffer) {
      try {
        const avatarUrl = await uploadAvatarBuffer(req.file.buffer);
        update.avatar = avatarUrl;
      } catch (e) {
        return res.status(500).json({ message: 'Avatar upload failed', error: e.message });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};


// Grant/Revoke Lead access
exports.grantLeadAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isLeadAccess = true;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to grant lead access', error: err.message });
  }
};

exports.revokeLeadAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isLeadAccess = false;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke lead access', error: err.message });
  }
};

// Grant/Revoke Catalog access
exports.grantCatalogAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isCatalogAccess = true;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to grant catalog access', error: err.message });
  }
};

exports.revokeCatalogAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isCatalogAccess = false;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke catalog access', error: err.message });
  }
};

// Grant/Revoke Template access
exports.grantTemplateAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isTemplateAccess = true;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to grant template access', error: err.message });
  }
};

exports.revokeTemplateAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isTemplateAccess = false;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke template access', error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

// Toggle active
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.active = !user.active;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle active', error: err.message });
  }
};
