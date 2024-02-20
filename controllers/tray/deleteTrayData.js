const {
  retrieveCustomerById,
  retrieveTrayById,
  retrieveDailySaleById,
  getIndexById,
} = require('../../lib/retrieveModelData');
const Tray = require('../../models/trays');

const { serverErrorMessage, reverseArr } = require('../../lib/lib');
const mongoose = require('mongoose');
const DailySales = require('../../models/dailySales');
const {} = require('../customer/justMoneyTransaction');

const saveDeleteToDb = async (dailySale, tray, customer) => {
  try {
    await dailySale.deleteOne();
    await tray.deleteOne();
    await customer.save();
  } catch (err) {
    console.log(err);
    return null;
  }
};

const deleteTraysData = async (req, res) => {
  // do this
  const id = req.params.id;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.log(err);
  }

  try {
    const tray = await retrieveTrayById(id);
    const customer = await retrieveCustomerById(tray.customerId);
    const dailySale = await retrieveDailySaleById(tray.dailySaleId);

    let insurance;
    if (dailySale.money.expense) {
      insurance = dailySale.money.expense;
      await DailySales.find({}).updateMany(
        { _id: { $gt: dailySale._id }, money: { $exists: true } },
        {
          $inc: { 'money.balance': dailySale.money.expense || 0 },
        }
      );
      const transactionIndex = getIndexById(customer.data, tray.transactionId);

      const tmpData = customer.data;
      const customerTransaction = tmpData[transactionIndex];
      for (let i = transactionIndex + 1; i < tmpData.length; i++) {
        const total = parseFloat(customerTransaction.total);
        const paid = parseFloat(customerTransaction.paid);

        tmpData[i].balance -= (total || 0) - paid;
      }

      customer.balance -=
        (customerTransaction.total || 0) - customerTransaction.paid;
      tmpData.splice(transactionIndex, 1);
      customer.data = tmpData;
    }

    if (tray === null || customer === null || dailySale === null)
      return serverErrorMessage(res);

    customer.trays -= tray.income;

    await Tray.find({ name: customer.name }).updateMany(
      { _id: { $gt: tray._id } },
      { $inc: { left: tray.income } }
    );

    const result = saveDeleteToDb(dailySale, tray, customer);
    if (result === null) return serverErrorMessage(res);

    reverseArr(customer.data);

    await session.commitTransaction();
    res.status(202).json({ customer });
  } catch (err) {
    await session.abortTransaction();
    return serverErrorMessage(res);
  }
};

module.exports = {
  deleteTraysData,
  saveToDb: saveDeleteToDb,
};
