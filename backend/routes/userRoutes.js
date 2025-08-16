const express = require('express');
const multer = require('multer');
const { verifyAccessToken } = require('../middleware/authMiddleware');
const {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  toggleActive,
  grantEmailAccess,
  grantFollowUpPerson,
  revokeEmailAccess,
  revokeFollowUpPerson,
} = require('../controllers/userController');

const router = express.Router();

// Multer memory storage to receive avatar file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Semantic routes (preferred)
router.get('/list', verifyAccessToken, listUsers);
router.post('/create', verifyAccessToken, upload.single('avatar'), createUser);
router.get('/get/:id', verifyAccessToken, getUser);
router.put('/update/:id', verifyAccessToken, upload.single('avatar'), updateUser);
router.delete('/delete/:id', verifyAccessToken, deleteUser);
router.patch('/toggle-active/:id', verifyAccessToken, toggleActive);
// Grant email access (set isEmailAccess = true)
router.patch('/grant-email-access/:id', verifyAccessToken, grantEmailAccess);
// Revoke email access (set isEmailAccess = false)
router.patch('/revoke-email-access/:id', verifyAccessToken, revokeEmailAccess);
// Grant follow-up person (set isFollowUpPerson = true)
router.patch('/grant-followup/:id', verifyAccessToken, grantFollowUpPerson);
// Revoke follow-up person (set isFollowUpPerson = false)
router.patch('/revoke-followup/:id', verifyAccessToken, revokeFollowUpPerson);

module.exports = router;
