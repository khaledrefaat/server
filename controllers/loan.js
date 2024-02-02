const { Loan } = require('../models/newNotes');
const DailySales = require('../models/dailySales');
const mongoose = require('mongoose');
const { serverErrorMessage, sendResponse } = require('../lib/lib');
const {
  calcDailySalesBalance,
  calcDailySalesBalanceIncome,
} = require('./newNoteBooks/lib');

exports.getLoans = async (req, res) => {
  try {
    const loan = await Loan.find({});
    res.status(200).json(loan);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postLoan = async (req, res) => {
  // This code gets the expense and income from the request body.
  const expense = parseFloat(req.body.expense);
  const income = parseFloat(req.body.income);

  if (!expense && !income)
    return sendResponse(res, 'من فضلك ادخل الوارد او الصادر');
  if (!req.body.statement) return sendResponse(res, 'من فضلك ادخل البيان');
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
    let dailySale;
    if (expense) {
      dailySale = new DailySales({
        money: {
          balance: calcDailySalesBalance(dailySales, expense),
          expense,
        },
        date,
        noteBook: {
          name: 'Loan',
        },
        statement,
      });
    } else {
      dailySale = new DailySales({
        money: {
          balance: calcDailySalesBalanceIncome(dailySales, income),
          income,
        },
        date,
        noteBook: {
          name: 'Loan',
        },
        statement,
      });
    }

    // This code gets all of the Loan documents from the database.
    const loanOldData = await Loan.find({});

    let lastItemBalance;
    if (loanOldData.length === 0) lastItemBalance = 0;
    else lastItemBalance = loanOldData[loanOldData.length - 1].balance;

    // This code creates a new Loan document.
    let loan;

    if (expense) {
      loan = new Loan({
        balance: lastItemBalance - expense,
        expense,
        dailySaleId: dailySale._id,
        date,
        statement,
        date,
      });
    } else {
      loan = new Loan({
        balance: lastItemBalance + income,
        income,
        dailySaleId: dailySale._id,
        date,
        statement,
        date,
      });
    }

    // This code sets the `noteBook` property of the DailySales document to the `_id` of the Loan document.
    dailySale.noteBook._id = loan._id;

    // This code saves the Loan document.
    await loan.save();

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

exports.deleteLoan = async (req, res) => {
  const { _id } = req.params;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const loan = await Loan.findById(_id);
    const dailySale = await DailySales.findById(loan.dailySaleId);

    if (loan.expense) {
      await Loan.updateMany(
        { _id: { $gt: loan._id } },
        { $inc: { balance: -loan.expense } }
      );
      // subtract each daily sale balance that come after the targeted deleted one
      await DailySales.find({}).updateMany(
        { _id: { $gt: dailySale._id }, money: { $exists: true } },
        {
          $inc: { 'money.balance': dailySale.money.expense },
        }
      );
    } else if (loan.income) {
      await Loan.updateMany(
        { _id: { $gt: loan._id } },
        { $inc: { balance: loan.income } }
      );
      // subtract each daily sale balance that come after the targeted deleted one
      await DailySales.find({}).updateMany(
        { _id: { $gt: dailySale._id }, money: { $exists: true } },
        {
          $inc: { 'money.balance': -dailySale.money.income },
        }
      );
    }

    await loan.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    session.abortTransaction();
    console.log(err);
  }
};
