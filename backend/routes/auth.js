const express = require('express');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const validEmail = 'syedshahbaz2004@gmail.com';
  const validPassword = 'retailer123';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email aur password dono required hain.',
    });
  }

  // Case-insensitive email comparison & exact password match
  if (email.trim().toLowerCase() === validEmail.toLowerCase() && password === validPassword) {
    return res.json({
      success: true,
      message: 'Login kamyab raha!',
      user: {
        email: validEmail,
        name: 'Shahbaz Qalander',
        role: 'Store Admin & Owner',
        terminal: 'Cashier Terminal #1',
      },
      token: 'apex_erp_session_auth_token_' + Date.now(),
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Ghalat email ya password! Barah-e-karam durust credentials enter karein.',
  });
});

module.exports = router;
