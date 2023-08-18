const { Forks } = require('../../models/newNotes');
const DailySales = require('../../models/dailySales');
const mongoose = require('mongoose');
const { calcDailySalesBalance, calcBalance } = require('./lib');
const { dailySalesBalance } = require('../../lib/lib');

exports.getForks = async (req, res) => {
  try {
    const forks = await Forks.find({});
    res.status(200).json(forks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.postForks = async (req, res) => {
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
        balance: calcDailySalesBalance(dailySalesBalance, expense),
      },
      statement: statement,
      date,
      noteBook: {
        name: 'Forks',
      },
    });

    const forksOldData = await Forks.find({});

    const forks = new Forks({
      balance: calcBalance(forksOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = forks._id;

    await forks.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.deleteForks = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const forks = await Forks.findById(_id);

    await Forks.updateMany(
      { _id: { $gt: forks._id } },
      { $inc: { balance: -forks.expense } }
    );

    const dailySale = await DailySales.findById(forks.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await forks.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
  }
};
