// الاصناف
const { Schema, model, Types } = require('mongoose');

const itemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  unitPrice: { type: Number, required: true },
  data: [
    {
      _id: { type: String, required: true },
      balance: {
        type: Number,
        required: true,
      },
      income: Number,
      expense: Number,
      statement: String,
      date: Date,
      notes: String,
      seedingId: { type: Types.ObjectId, ref: 'Seeding' },
      customerTransactionId: String,
      customerId: String,
    },
  ],
  orders: [
    {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      trays: { type: Number, required: true },
      seedDate: Date,
      landDate: Date,
      notes: String,
      dailySaleId: { type: Types.ObjectId },
      total: { type: Number, required: true },
    },
  ],
});

module.exports = model('Item', itemSchema);
