const { Employment } = require('../../models/newNotes');
const mongoose = require('mongoose');
const DailySales = require('../../models/dailySales');
const {
  updateModelBalance,
  calcDailySalesBalance,
  calcBalance,
} = require('./lib');
const { serverErrorMessage, reverseArr } = require('../../lib/lib');

exports.getEmployment = async (req, res) => {
  try {
    let employment = await Employment.find({});
    employment = reverseArr(employment);
    res.status(200).json(employment);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postEmployment = async (req, res) => {
  // This code gets the expense and statement from the request body.
  const expense = parseFloat(req.body.expense);
  const statement = req.body.statement;

  // This code creates a new Date object to represent the current date.
  const date = new Date();

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    // This code starts a new transaction.
    session.startTransaction();

    // This code gets all of the DailySales documents from the database.
    const dailySales = await DailySales.find({
      money: {
        $exists: true,
      },
    });

    // This code creates a new DailySales document.
    const dailySale = new DailySales({
      money: {
        expense,
        balance: calcDailySalesBalance(dailySales, expense),
      },
      statement: statement,
      date,
      noteBook: {
        name: 'Employment',
      },
    });

    // This code gets all of the Employment documents from the database.
    const EmploymentOldData = await Employment.find({});

    // This code creates a new Employment document.
    const employment = new Employment({
      balance: calcBalance(EmploymentOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    // This code sets the `noteBook` property of the DailySales document to the `_id` of the Employment document.
    dailySale.noteBook._id = employment._id;

    // This code saves the Employment document.
    await employment.save();

    // This code saves the DailySales document.
    await dailySale.save();

    // This code commits the transaction.
    session.commitTransaction();

    // This code returns a success response.
    res.status(201).json({});

    // This code logs any errors that occur.
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};

exports.deleteEmployment = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const employment = await Employment.findById(_id);

    await Employment.updateMany(
      { _id: { $gt: employment._id } },
      { $inc: { balance: -employment.expense } }
    );

    const dailySale = await DailySales.findById(employment.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await employment.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.fixEmploymentBalance = async (req, res) => {
  try {
    const result = await updateModelBalance(Employment);
    if (result === null) return serverErrorMessage(res);

    return res.status(200).json({ msg: 'Done ^_^' });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
