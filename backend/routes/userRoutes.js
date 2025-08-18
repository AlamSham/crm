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
  grantLeadAccess,
  revokeLeadAccess,
  grantCatalogAccess,
  revokeCatalogAccess,
  grantTemplateAccess,
  revokeTemplateAccess,
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
// Removed email access routes

// New granular permission routes
router.patch('/grant-lead/:id', verifyAccessToken, grantLeadAccess);
router.patch('/revoke-lead/:id', verifyAccessToken, revokeLeadAccess);
router.patch('/grant-catalog/:id', verifyAccessToken, grantCatalogAccess);
router.patch('/revoke-catalog/:id', verifyAccessToken, revokeCatalogAccess);
router.patch('/grant-template/:id', verifyAccessToken, grantTemplateAccess);
router.patch('/revoke-template/:id', verifyAccessToken, revokeTemplateAccess);

module.exports = router;
