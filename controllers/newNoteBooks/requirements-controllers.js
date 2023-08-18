const { Requirements } = require('../../models/newNotes');
const mongoose = require('mongoose');
const DailySales = require('../../models/dailySales');
const { serverErrorMessage } = require('../../lib/lib');
const {
  updateModelBalance,
  calcDailySalesBalance,
  calcBalance,
} = require('./lib');

exports.getRequirements = async (req, res) => {
  try {
    const requirements = await Requirements.find({});
    res.status(200).json(requirements);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.postRequirements = async (req, res) => {
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
      statement: statement,
      date,
      noteBook: {
        name: 'Requirements',
      },
    });

    const requirementsOldData = await Requirements.find({});

    const requirements = new Requirements({
      balance: calcBalance(requirementsOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = requirements._id;

    await requirements.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteRequirements = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const requirements = await Requirements.findById(_id);

    await Requirements.updateMany(
      { _id: { $gt: requirements._id } },
      { $inc: { balance: -requirements.expense } }
    );

    const dailySale = await DailySales.findById(requirements.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await requirements.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.fixRequirementsBalance = async (req, res) => {
  try {
    const result = await updateModelBalance(Requirements);
    if (result === null) return serverErrorMessage(res);

    return res.status(200).json({ msg: 'Done ^_^' });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
