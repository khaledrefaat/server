const {
  sendResponse,
  dailySalesBalance,
  serverErrorMessage,
  sortArr,
} = require('../../lib/lib');
const DailySales = require('../../models/dailySales');
const {
  retrieveCustomerById,
  retrieveDailySales,
  getIndexById,
} = require('../../lib/retrieveModelData');
const {
  calcBalance,
  deleteDailySaleAndUpdateBalances,
} = require('./helperFunctions');
const { mongoose } = require('mongoose');
const { nanoid } = require('nanoid');
const { getDailySales } = require('../dailySales-controllers');

newMoneyTransaction = async (req, res) => {
  const data = req.body;
  const { paid, statement, discount } = req.body;
  const id = req.params.id;

  const date = new Date();

  if (!paid && !discount)
    return sendResponse(res, 'من فضلك ادخل المدفوع او الخصم');
  if (paid && discount)
    return sendResponse(res, 'من فضلك ادخل المدفوع او الخصم وليس الاثنين');
  if (!statement) return sendResponse(res, 'من فضلك ادخل البيان');

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
  try {
    session.startTransaction();

    const customer = await retrieveCustomerById(id);

    if (customer === null) return serverErrorMessage(res);

    const transactionId = nanoid();

    const dailySales = await retrieveDailySales(res);
    if (dailySales === null) return serverErrorMessage(res);

    const dailySaleBalance = dailySalesBalance(dailySales, paid);

    let dailySale, balance;

    dailySale = new DailySales({
      name: customer.name,
      statement: statement,
      date,
      noteBook: {
        name: 'Customer',
        _id: customer._id,
        transactionId,
      },
    });

    if (paid && paid > 0)
      dailySale.money = { balance: dailySaleBalance, income: paid };

    balance = calcBalance(paid || discount, 0, customer.balance);

    const newTransaction = {
      _id: transactionId,
      balance,
      statement: data.statement,
      date,
      dailySaleId: dailySale._id,
    };

    if (discount) newTransaction.discount = discount;
    else if (paid) newTransaction.paid = paid;

    customer.balance = newTransaction.balance;
    customer.data.push(newTransaction);

    await customer.save();
    await dailySale.save();

    await session.commitTransaction();
    return getDailySales(req, res);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};

const deleteTransactionFromCustomer = async (customer, transactionIndex) => {
  try {
    // Calculate The new Transactions money
    // subtract paid from every transaction that came after the target deleted one
    const tmpData = customer.data;
    const customerTransaction = tmpData[transactionIndex];
    for (let i = transactionIndex + 1; i < tmpData.length; i++) {
      const total = parseFloat(customerTransaction.total);
      const paid = parseFloat(customerTransaction.paid);
      const discount = parseFloat(customerTransaction.discount);

      tmpData[i].balance += (total || 0) - (paid || discount);
    }

    customer.balance +=
      (customerTransaction.total || 0) -
      (Math.abs(customerTransaction.paid) ||
        Math.abs(customerTransaction.discount));
    tmpData.splice(transactionIndex, 1);
    customer.data = tmpData;
    await customer.save();
  } catch (err) {
    console.log(err);
  }
};

deleteMoneyTransaction = async (req, res) => {
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

    // //////////////////////////////////////////////////
    // deleting dailySale
    await deleteDailySaleAndUpdateBalances(transaction.dailySaleId);

    // editing and deleting the customer transaction and saving it
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

module.exports = {
  newMoneyTransaction,
  deleteMoneyTransaction,
  deleteTransactionFromCustomer,
};
