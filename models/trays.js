// الصواني
const { Schema, model, Types } = require('mongoose');

const TraysSchema = new Schema({
  name: { type: String, required: true },
  expense: Number,
  income: Number,
  left: Number,
  date: Date,
  notes: String,
  customerId: { type: Types.ObjectId },
  transactionId: String,
  seedingId: { type: Types.ObjectId, ref: 'Seeding' },
  dailySaleId: { type: Types.ObjectId },
});

module.exports = model('Trays', TraysSchema);
