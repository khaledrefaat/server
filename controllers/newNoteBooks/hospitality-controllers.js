const { Hospitality } = require('../../models/newNotes');
const mongoose = require('mongoose');
const DailySales = require('../../models/dailySales');
const { calcDailySalesBalance, calcBalance } = require('./lib');
const { sortArr, serverErrorMessage } = require('../../lib/lib');

exports.getHospitality = async (req, res) => {
  try {
    let hospitality = await Hospitality.find({});
    hospitality = sortArr(hospitality);
    res.status(200).json(hospitality);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postHospitality = async (req, res) => {
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
        name: 'Hospitality',
      },
    });

    const hospitalityOldData = await Hospitality.find({});

    const hospitality = new Hospitality({
      balance: calcBalance(hospitalityOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = hospitality._id;

    await hospitality.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteHospitality = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const hospitality = await Hospitality.findById(_id);

    await Hospitality.updateMany(
      { _id: { $gt: hospitality._id } },
      { $inc: { balance: -hospitality.expense } }
    );

    const dailySale = await DailySales.findById(hospitality.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await hospitality.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
  }
};
