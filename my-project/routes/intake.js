const express = require('express');
const router = express.Router();
const Intake = require('../models/intakeModel');
const { isAuthenticated } = require('../middleware/auth');

// Show add form - authenticated users only
router.get('/add', isAuthenticated, (req, res) => {
  res.render('dashboard', { error: null, message: null });
});

// Add daily intake (one per day) - authenticated users only
router.post('/add', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const quantity = Number(req.body.quantity);
  const date = new Date().toISOString().slice(0, 10);

  const exists = await Intake.findOne({ user: userId, date });
  if (exists) {
    return res.render('dashboard', { error: 'Entry for today already exists', message: null });
  }

  await new Intake({ user: userId, quantity, date }).save();
  res.redirect('/intake/list');
});

// Intake list with pagination - authenticated users only
router.get('/list', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const page = Number(req.query.page) || 1;
  const size = 5;

  const intakes = await Intake.find({ user: userId })
    .sort({ date: -1 })
    .skip((page - 1) * size)
    .limit(size);

  const count = await Intake.countDocuments({ user: userId });
  const totalPages = Math.ceil(count / size);

  res.render('intake_list', { intakes, page, totalPages });
});

// Show edit form - authenticated users only
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  const intake = await Intake.findOne({ _id: req.params.id, user: req.session.userId });
  if (!intake) return res.redirect('/intake/list');
  res.render('edit_intake', { intake });
});

// Handle intake edit - authenticated users only
router.post('/:id/edit', isAuthenticated, async (req, res) => {
  await Intake.updateOne(
    { _id: req.params.id, user: req.session.userId },
    { quantity: req.body.quantity }
  );
  res.redirect('/intake/list');
});

// Handle intake delete - authenticated users only
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  await Intake.deleteOne({ _id: req.params.id, user: req.session.userId });
  res.redirect('/intake/list');
});

// Intake difference calculation (from dashboard form) - authenticated users only
router.post('/difference', isAuthenticated, async (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) return res.render('dashboard', { error: 'Both dates required', message: null });

  const fromIntake = await Intake.findOne({
    user: req.session.userId,
    date: from
  });

  const toIntake = await Intake.findOne({
    user: req.session.userId,
    date: to
  });

  if (!fromIntake || !toIntake) {
    return res.render('dashboard', { error: 'No intake found for one or both selected dates.', message: null });
  }

  const difference = toIntake.quantity - fromIntake.quantity;
  res.render('dashboard', { error: null, message: `Difference between ${to} and ${from}: ${difference} liters` });
});

module.exports = router;
