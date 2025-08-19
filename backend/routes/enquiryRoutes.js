const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/enquiryController');

// Protect all enquiry routes
router.use(verifyAccessToken);

// List
router.get('/', ctrl.listEnquiries);
// Create
router.post('/', ctrl.createEnquiry);
// Update
router.put('/:id', ctrl.updateEnquiry);
// Delete
router.delete('/:id', ctrl.deleteEnquiry);

module.exports = router;
