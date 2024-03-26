const { default: mongoose } = require('mongoose');
const { serverErrorMessage, sortArr } = require('../../lib/lib');
const {
  getIndexById,
  retrieveFertilizerById,
  retrieveCustomerById,
} = require('../../lib/retrieveModelData');
const { deleteDailySaleAndUpdateBalances } = require('./helperFunctions');

const deleteTransactionFromFertilizer = async (fertilizerId, transactionId) => {
  try {
    const fertilizer = await retrieveFertilizerById(fertilizerId);

    const dataTmp = fertilizer.data;
    const transactionIndex = getIndexById(dataTmp, transactionId);

    const fertilizerTransaction = dataTmp[transactionIndex];

    for (let i = transactionIndex + 1; i < dataTmp.length; i++)
      dataTmp[i].balance += parseFloat(fertilizerTransaction.expense) || 0;

    fertilizer.balance += parseFloat(fertilizerTransaction.expense) || 0;

    dataTmp.splice(transactionIndex, 1);
    fertilizer.data = dataTmp;
    await fertilizer.save();
  } catch (err) {
    console.log(err);
  }
};

const deleteTransactionFromCustomer = async (customer, transactionIndex) => {
  try {
    // Calculate The new Transactions money
    // subtract paid from every transaction that came after the target deleted one
    const tmpData = customer.data;
    const customerTransaction = tmpData[transactionIndex];

    for (let i = transactionIndex + 1; i < tmpData.length; i++) {
      tmpData[i].balance +=
        (customerTransaction.total || 0) - customerTransaction.paid;
    }

    customer.balance +=
      (customerTransaction.total || 0) - customerTransaction.paid;
    tmpData.splice(transactionIndex, 1);
    customer.data = tmpData;
    await customer.save();
  } catch (err) {
    console.log(err);
  }
};

exports.deleteFertilizerTransaction = async (req, res) => {
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
    // delete the fertilizer data
    deleteTransactionFromFertilizer(
      transaction.fertilizerId,
      transaction.fertilizerTransactionId
    );

    // //////////////////////////////////////////////////
    // deleting dailySale
    const deleteDailySale = deleteDailySaleAndUpdateBalances(
      transaction.dailySaleId
    );

    if (deleteDailySale === null) return serverErrorMessage(res);

    // editing and deleting the fertilizer transaction and saving it
    await deleteTransactionFromCustomer(customer, transactionIndex);

    await session.commitTransaction();
    sortArr(customer.data);
    res.status(201).json({ customer });
  } catch (err) {
    session.abortTransaction();
    console.log(err);
    return serverErrorMessage(res);
  }
};
