const { Schema, model, Types } = require('mongoose');

const generalSchema = new Schema({
  balance: {
    type: Number,
    required: true,
  },
  expense: { type: Number, required: true },
  statement: { type: String, required: true },
  dailySaleId: { type: Types.ObjectId },
  date: Date,
});

exports.FixedSalary = model('FixedSalary', generalSchema);

exports.Employment = model('Employment', generalSchema);

exports.Hospitality = model('Hospitality', generalSchema);

exports.Gas = model('Gas', generalSchema);

exports.Electricity = model('Electricity', generalSchema);

exports.Requirements = model('Requirements', generalSchema);

exports.Forks = model('Forks', generalSchema);

exports.Water = model('Water', generalSchema);

const Loan = new Schema({
  balance: {
    type: Number,
    required: true,
  },
  expense: Number,
  income: Number,
  dailySaleId: { type: Types.ObjectId },
  statement: { type: String, required: true },
  date: Date,
});

exports.Loan = model('Loan', Loan);
