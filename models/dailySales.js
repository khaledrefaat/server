const { Schema, model, Types } = require('mongoose');

const dailySalesSchema = new Schema({
  money: {
    balance: Number,
    income: Number,
    expense: Number,
  },
  name: String,
  goods: {
    income: Number,
    expense: Number,
  },
  statement: { type: String, required: true },
  date: { type: Date, required: true },
  notes: String,
  noteBook: {
    name: { type: String, required: true },
    _id: { type: Types.ObjectId, required: true },
    subName: String,
    transactionId: String,
  },
});

module.exports = model('DailySales', dailySalesSchema);
