const { Gas } = require('../../models/newNotes');
const mongoose = require('mongoose');
const DailySales = require('../../models/dailySales');
const { calcDailySalesBalance, calcBalance } = require('./lib');
const { sortArr, serverErrorMessage } = require('../../lib/lib');

exports.getGas = async (req, res) => {
  try {
    let gas = await Gas.find({});
    gas = sortArr(gas);
    res.status(200).json(gas);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postGas = async (req, res) => {
  const { expense, statement } = req.body;
  const date = new Date();

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const dailySales = await DailySales.find({
      money: {
        $exists: true,
      },
    });

    const dailySale = new DailySales({
      money: {
        expense,
        balance: calcDailySalesBalance(dailySales, expense),
      },
      statement: statement,
      date,
      noteBook: {
        name: 'Gas',
      },
    });

    const gasOldData = await Gas.find({});

    const gas = new Gas({
      balance: calcBalance(gasOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = gas._id;

    await gas.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteGas = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const gas = await Gas.findById(_id);

    await Gas.updateMany(
      { _id: { $gt: gas._id } },
      { $inc: { balance: -gas.expense } }
    );

    const dailySale = await DailySales.findById(gas.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await gas.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
  }
};
