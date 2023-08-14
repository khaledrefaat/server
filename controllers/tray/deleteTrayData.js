const {
  retrieveCustomerById,
  retrieveTrayById,
  retrieveDailySaleById,
} = require('../../lib/retrieveModelData');
const Tray = require('../../models/trays');

const { serverErrorMessage } = require('../../lib/lib');
const mongoose = require('mongoose');

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

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const tray = await retrieveTrayById(id);
    const customer = await retrieveCustomerById(tray.customerId);
    const dailySale = await retrieveDailySaleById(tray.dailySaleId);

    if (tray === null || customer === null || dailySale === null)
      return serverErrorMessage(res);

    customer.trays += tray.income;

    await Tray.find({ name: customer.name }).updateMany(
      { _id: { $gt: tray._id } },
      { $inc: { left: tray.income } }
    );

    const result = saveDeleteToDb(dailySale, tray, customer);
    if (result === null) return serverErrorMessage(res);

    await session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    return serverErrorMessage(res);
  }
};

module.exports = {
  deleteTraysData,
  saveToDb: saveDeleteToDb,
};
