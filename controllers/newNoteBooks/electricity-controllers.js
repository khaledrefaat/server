const DailySales = require('../../models/dailySales');
const { Electricity } = require('../../models/newNotes');
const mongoose = require('mongoose');
const { calcDailySalesBalance, calcBalance } = require('./lib');

exports.getElectricity = async (req, res) => {
  try {
    const electricity = await Electricity.find({});
    res.status(200).json(electricity);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.postElectricity = async (req, res) => {
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
        name: 'Electricity',
      },
    });

    const electricityOldData = await Electricity.find({});

    const electricity = new Electricity({
      balance: calcBalance(electricityOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = electricity._id;

    await electricity.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.deleteElectricity = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const electricity = await Electricity.findById(_id);

    await Electricity.updateMany(
      { _id: { $gt: electricity._id } },
      { $inc: { balance: -electricity.expense } }
    );

    const dailySale = await DailySales.findById(electricity.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await electricity.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
  }
};
