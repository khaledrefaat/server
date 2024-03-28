const { Water } = require('../../models/newNotes');
const mongoose = require('mongoose');
const DailySales = require('../../models/dailySales');
const { serverErrorMessage, sortArr, sendResponse } = require('../../lib/lib');
const {
  updateModelBalance,
  calcDailySalesBalance,
  calcBalance,
} = require('./lib');

const { getIndexById } = require('../../lib/retrieveModelData');

exports.getWater = async (req, res) => {
  try {
    let water = await Water.find({});
    water = sortArr(water);
    res.status(200).json(water);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postWater = async (req, res) => {
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
        balance: calcDailySalesBalance(await dailySales, expense),
      },
      statement: statement || 'مياه',
      date,
      noteBook: {
        name: 'Water',
      },
    });

    const waterOldData = await Water.find({});

    const water = new Water({
      balance: calcBalance(waterOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = water._id;

    await water.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteWater = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const water = await Water.findById(_id);

    await Water.updateMany(
      { _id: { $gt: water._id } },
      { $inc: { balance: -water.expense } }
    );

    const dailySale = await DailySales.findById(water.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await water.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.fixWaterBalance = async (req, res) => {
  try {
    const result = await updateModelBalance(Water);
    if (result === null) return serverErrorMessage(res);

    return sendResponse(res, 'Done ^_^', 200);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
