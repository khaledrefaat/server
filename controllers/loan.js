const { Loan } = require('../models/newNotes');
const DailySales = require('../models/dailySales');
const mongoose = require('mongoose');
const { serverErrorMessage, sendResponse, reverseArr } = require('../lib/lib');
const {
  calcDailySalesBalance,
  calcDailySalesBalanceIncome,
} = require('./newNoteBooks/lib');
const Loaner = require('../models/loaner');
const { nanoid } = require('nanoid');

exports.getOldLoans = async (req, res) => {
  try {
    const loans = await Loan.find({});
    res.status(200).json(reverseArr(loans));
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.getLoans = async (req, res) => {
  const { _id } = req.params;
  try {
    const loan = await Loaner.findById(_id);
    res.status(200).json(reverseArr(loan));
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.getLoaners = async (req, res) => {
  try {
    const loaners = await Loaner.find({});
    loaners.forEach(customer => (customer.data = reverseArr(customer.data)));

    return sendResponse(res, loaners, 200);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postLoaner = async (req, res) => {
  const { name } = req.body;
  if (!name) return sendResponse(res, 'من فضلك ادخل الاسم');

  try {
    const loaner = await Loaner.findOne({ name });
    if (loaner) return sendResponse(res, 'هذا الاسم موجود بالفعل');
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    const loaner = new Loaner({
      name,
      balance: 0,
    });
    await loaner.save();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postLoan = async (req, res) => {
  // This code gets the expense and income from the request body.
  const expense = parseFloat(req.body.expense);
  const income = parseFloat(req.body.income);
  const _id = req.params.id;
  const statement = req.body.statement;

  if (isNaN(income) && isNaN(expense))
    return sendResponse(res, 'من فضلك ادخل الوارد او الصادر');

  if (!isNaN(income) && !isNaN(expense))
    return sendResponse(
      res,
      'من فضلك ادخل الوارد او الصادر لا تدخل الاثنين معا'
    );

  if (!req.body.statement) return sendResponse(res, 'من فضلك ادخل البيان');

  // This code creates a new Date object to represent the current date.
  const date = new Date();

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  let loaner;
  try {
    session.startTransaction();
    loaner = await Loaner.findById(_id);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }

  try {
    // This code gets all of the DailySales documents from the database.
    const transactionId = nanoid();

    const dailySales = await DailySales.find({
      money: {
        $exists: true,
      },
    });
    // This code creates a new DailySales document.
    let dailySale;
    if (expense) {
      dailySale = new DailySales({
        name: loaner.name,
        money: {
          balance: calcDailySalesBalance(dailySales, expense),
          expense,
        },
        date,
        noteBook: {
          name: 'Loan',
          _id: loaner._id,
          transactionId,
        },
        statement,
      });
    } else {
      dailySale = new DailySales({
        name: loaner.name,
        money: {
          balance: calcDailySalesBalanceIncome(dailySales, income),
          income,
        },
        date,
        noteBook: {
          name: 'Loan',
          _id: loaner._id,
          transactionId,
        },
        statement,
      });
    }

    // This code gets all of the Loan documents from the database.
    const loanOldData = loaner.data;

    let lastItemBalance;
    if (loanOldData.length === 0) lastItemBalance = 0;
    else lastItemBalance = loanOldData[loanOldData.length - 1].balance;

    // This code creates a new Loan document.
    let loan;
    if (expense) {
      loan = {
        balance: lastItemBalance - expense,
        expense,
        dailySaleId: dailySale._id,
        date,
        statement,
        date,
        _id: transactionId,
      };
    } else {
      loan = {
        balance: lastItemBalance + income,
        income,
        dailySaleId: dailySale._id,
        date,
        statement,
        date,
        _id: transactionId,
      };
    }

    loaner.data.push(loan);
    loaner.balance = loan.balance;

    // This code saves the Loan document.
    await loaner.save();

    // This code saves the DailySales document.
    await dailySale.save();

    // This code commits the transaction.
    session.commitTransaction();

    // This code returns a success response.
    sendResponse(res, {}, 201);

    // This code logs any errors that occur.
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};

exports.deleteLoan = async (req, res) => {
  const { id, transactionId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    const loaner = await Loaner.findById(id);
    const loanIndex = loaner.data.findIndex(loan => loan._id === transactionId);
    const loan = loaner.data[loanIndex];
    const dataTmp = loaner.data;
    const dailySale = await DailySales.findById(loan.dailySaleId);

    if (loan.expense) {
      for (let i = loanIndex + 1; i < dataTmp.length; i++)
        dataTmp[i].balance += loan.expense;

      loaner.balance += loan.expense;

      dataTmp.splice(loanIndex, 1);
      loaner.data = dataTmp;

      // subtract each daily sale balance that come after the targeted deleted one
      await DailySales.find({}).updateMany(
        { _id: { $gt: dailySale._id }, money: { $exists: true } },
        {
          $inc: { 'money.balance': dailySale.money.expense },
        }
      );
    } else if (loan.income) {
      for (let i = loanIndex + 1; i < dataTmp.length; i++)
        dataTmp[i].balance -= loan.income;

      loaner.balance -= loan.income;

      dataTmp.splice(loanIndex, 1);
      loaner.data = dataTmp;

      // subtract each daily sale balance that come after the targeted deleted one
      await DailySales.find({}).updateMany(
        { _id: { $gt: dailySale._id }, money: { $exists: true } },
        {
          $inc: { 'money.balance': -dailySale.money.income },
        }
      );
    }

    await loaner.save();
    await dailySale.deleteOne();

    session.commitTransaction();
    sendResponse(res, loaner, 202);
  } catch (err) {
    session.abortTransaction();
    console.log(err);
  }
};
