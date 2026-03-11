const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, inviteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const validateRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.post('/invite', protect, authorize('Super Admin'), inviteUser);

module.exports = router;