// المستلفين

const { Schema, model, Types } = require('mongoose');

const loanerSchema = new Schema({
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
      expense: Number,
      income: Number,
      statement: String,
      date: Date,
      dailySaleId: { type: Types.ObjectId, ref: 'DailySales' },
    },
  ],
});

module.exports = model('Loaner', loanerSchema);
