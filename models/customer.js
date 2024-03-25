// العملاء

const { Schema, model, Types } = require('mongoose');

const customerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  balance: {
    type: Number,
    required: true,
  },
  trays: {
    type: Number,
    required: true,
  },
  data: [
    {
      _id: { type: String, required: true },
      balance: { type: Number, required: true },
      total: Number,
      trays: Number,
      units: Number,
      paid: Number,
      discount: Number,
      unitPrice: Number,
      statement: String,
      date: Date,
      dailySaleId: { type: Types.ObjectId, ref: 'DailySales' },
      trayId: { type: Types.ObjectId, ref: 'Trays' },
      itemId: { type: Types.ObjectId, ref: 'Item' },
      itemTransactionId: String,
      fertilizerId: { type: Types.ObjectId, ref: 'Fertilizer' },
      fertilizerTransactionId: String,
    },
  ],
});

module.exports = model('Customer', customerSchema);
