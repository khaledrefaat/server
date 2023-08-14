// دفتر الزراعة
const { Schema, model, Types } = require('mongoose');

const seedingSchema = new Schema({
  itemId: { type: Types.ObjectId, ref: 'Item' },
  itemTransactionId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: String,
  unit: String,
  plantDate: { type: Date, required: true },
  lotNumber: String,
  trays: { type: Number, required: true },
  total: Number,
  dailySaleId: { type: Types.ObjectId, required: true, ref: 'DailySales' },
  trayId: { type: Types.ObjectId, ref: 'Trays', required: true },
});

module.exports = model('Seeding', seedingSchema);
