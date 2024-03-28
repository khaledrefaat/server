const { mongoose } = require('mongoose');
const Tray = require('../../models/trays');
const {
  serverErrorMessage,
  sortArr,
  calcTraysCount,
} = require('../../lib/lib');
const {
  retrieveCustomerById,
  retrieveDailySales,
  retrieveItemById,
  retrieveDailySalesById,
  getIndexById,
  retrieveTrays,
} = require('../../lib/retrieveModelData');
const { deleteDailySaleAndUpdateBalances } = require('./helperFunctions');

const deleteTransactionFromCustomer = async (customer, transactionIndex) => {
  try {
    // Calculate The new Transactions money
    // subtract paid from every transaction that came after the target deleted one
    const tmpData = customer.data;
    const customerTransaction = tmpData[transactionIndex];
    for (let i = transactionIndex + 1; i < tmpData.length; i++) {
      tmpData[i].balance +=
        (customerTransaction.total || 0) - (customerTransaction.paid || 0);
    }

    customer.balance +=
      (customerTransaction.total || 0) - (customerTransaction.paid || 0);
    customer.trays -= customerTransaction.trays;
    tmpData.splice(transactionIndex, 1);
    customer.data = tmpData;
    await customer.save();
  } catch (err) {
    console.log(err);
  }
};

const deleteItemTransaction = async (itemId, transactionId) => {
  try {
    const item = await retrieveItemById(itemId);

    if (item === null) return serverErrorMessage(res);

    const dataTmp = item.data;
    const transactionIndex = getIndexById(dataTmp, transactionId);

    const itemTransaction = dataTmp[transactionIndex];

    for (let i = transactionIndex + 1; i < dataTmp.length; i++)
      dataTmp[i].balance += itemTransaction.expense;

    item.balance += itemTransaction.expense;

    dataTmp.splice(transactionIndex, 1);
    item.data = dataTmp;
    await item.save();
    return item;
  } catch (err) {
    console.log(err);
  }
};

const deleteTray = async (name, _id, trays) => {
  await Tray.find({ name }).updateMany(
    { _id: { $gt: _id } },
    { $inc: { left: -trays } }
  );

  await Tray.findByIdAndDelete(_id);
};

const deleteTransaction = async (req, res) => {
  const { customerId, transactionId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    session.startTransaction();

    const customer = await retrieveCustomerById(customerId);

    if (customer === null) return serverErrorMessage(res);

    const tmpData = customer.data;

    const transactionIndex = getIndexById(tmpData, transactionId);

    const transaction = tmpData[transactionIndex];

    // ////////////////////////////////////////////////
    // delete the item data
    if (transaction.itemId)
      deleteItemTransaction(transaction.itemId, transaction.itemTransactionId);

    // //////////////////////////////////////////////////
    // deleting dailySale
    const deleteDailySale = deleteDailySaleAndUpdateBalances(
      transaction.dailySaleId
    );
    if (deleteDailySale === null) return serverErrorMessage(res);

    // find that tray data and delete it
    if (transaction.trayId)
      deleteTray(customer.name, transaction.trayId, transaction.trays);

    // editing and deleting the customer transaction and saving it
    await deleteTransactionFromCustomer(customer, transactionIndex);

    await session.commitTransaction();
    const item = await retrieveItemById(transaction.itemId);
    const trays = await retrieveTrays();
    sortArr(trays);
    const traysCount = calcTraysCount(trays);
    sortArr(item.data);
    sortArr(customer.data);
    res.status(201).json({ customer, item, trays, traysCount });
  } catch (err) {
    session.abortTransaction();
    console.log(err);
    return serverErrorMessage(res);
  }
};

module.exports = {
  deleteTransaction,
  deleteTray,
  deleteDailySaleAndUpdateBalances,
  deleteItemTransaction,
};
