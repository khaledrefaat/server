const { Schema, model, Types } = require('mongoose');

const supplierSchema = new Schema({
  name: { type: String, required: true },
  balance: {
    type: Number,
    required: true,
  },
  data: [
    {
      _id: { type: String, required: true },
      balance: { type: Number, required: true },
      total: Number,
      paid: Number,
      unitPrice: Number,
      unit: Number,
      statement: String,
      date: Date,
      notes: String,
      dailySaleId: Types.ObjectId,
      fertilizerId: Types.ObjectId,
      fertilizerTransactionId: String,
    },
  ],
});

module.exports = model('Supplier', supplierSchema);
