const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/enquiryController');

// List
router.get('/', ctrl.listEnquiries);
// Create
router.post('/', ctrl.createEnquiry);
// Update
router.put('/:id', ctrl.updateEnquiry);
// Delete
router.delete('/:id', ctrl.deleteEnquiry);

module.exports = router;
