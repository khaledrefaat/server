const { FixedSalary } = require('../../models/newNotes');
const DailySales = require('../../models/dailySales');
const mongoose = require('mongoose');
const {
  calcDailySalesBalance,
  calcBalance,
  updateModelBalance,
} = require('./lib');

exports.getFixedSalary = async (req, res) => {
  try {
    const fixedSalary = await FixedSalary.find({});
    res.status(200).json(fixedSalary);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.postFixedSalary = async (req, res) => {
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
        name: 'FixedSalary',
      },
    });

    const fixedSalaryOldData = await FixedSalary.find({});

    const fixedSalary = new FixedSalary({
      balance: calcBalance(fixedSalaryOldData, expense),
      expense,
      statement,
      dailySaleId: dailySale._id,
      date,
    });

    dailySale.noteBook._id = fixedSalary._id;

    await fixedSalary.save();
    await dailySale.save();

    session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'حدث خطأ ما برجاء المحاولة في وقت لاحق' });
  }
};

exports.deleteFixedSalary = async (req, res) => {
  const _id = req.params._id;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const fixedSalary = await FixedSalary.findById(_id);

    await FixedSalary.updateMany(
      { _id: { $gt: fixedSalary._id } },
      { $inc: { balance: -fixedSalary.expense } }
    );

    const dailySale = await DailySales.findById(fixedSalary.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id } },
      {
        $inc: { 'money.balance': dailySale.money.expense },
      }
    );

    await fixedSalary.deleteOne();
    await dailySale.deleteOne();

    session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
  }
};

[
  ['fixedSalary', 'FixedSalary'],
  ['forks', 'Forks'],
  ['gas', 'Gas'],
  ['hospitality', 'Hospitality'],
  ['requirements', 'Requirements'],
];

exports.fixFixedSalaryBalance = async (req, res) => {
  try {
    const result = await updateModelBalance(FixedSalary);
    if (result === null) return serverErrorMessage(res);

    return res.status(200).json({ msg: 'Done ^_^' });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
