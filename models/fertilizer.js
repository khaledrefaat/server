// الاسمدة و المبيدات
const { Schema, model, Types } = require('mongoose');

const fertilizerSchema = new Schema({
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
      customerTransactionId: String,
      customerId: Types.ObjectId,
      supplierId: Types.ObjectId,
      supplierTransactionId: String,
      dailySaleId: Types.ObjectId,
    },
  ],
});

module.exports = model('Fertilizer', fertilizerSchema);
