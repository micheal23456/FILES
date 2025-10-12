const mongoose = require('mongoose');

const IntakeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel', required: true },
  quantity: { type: Number, required: true },
  date: { type: String, required: true }, // Store as YYYY-MM-DD format
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Intake', IntakeSchema);
