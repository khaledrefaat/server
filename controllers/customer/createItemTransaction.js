const { mongoose } = require('mongoose');
const { nanoid } = require('nanoid');

const {
  serverErrorMessage,
  dailySalesBalance,
  sendResponse,
} = require('../../lib/lib');
const {
  retrieveCustomerById,
  retrieveDailySales,
  retrieveItemById,
  calcLeftTrays,
} = require('../../lib/retrieveModelData');

const {
  calcBalance,
  calcTotal,
  createTray,
  createItemDailySales,
} = require('./helperFunctions');

exports.newTransaction = async (req, res) => {
  const id = req.params.id;
  const { paid, statement, trays, itemId } = req.body;

  if (!trays) return sendResponse(res, 'من فضلك ادخل عدد الصواني');

  const date = new Date();

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

    const leftTrays = await calcLeftTrays(trays, customer.name);

    const tray = createTray(
      customer.name,
      trays,
      date,
      statement || customer.name,
      customer._id,
      leftTrays,
      transactionId
    );

    item = await retrieveItemById(itemId);

    if (item === null || tray === null) return serverErrorMessage(res);

    const itemBalance = item.balance - trays;

    item.balance = itemBalance;

    itemTransaction = {
      _id: nanoid(),
      balance: itemBalance,
      expense: trays,
      date,
      statement: statement || customer.name,
      customerTransactionId: transactionId,
      customerId: customer._id,
    };

    item.data.push(itemTransaction);

    const dailySales = await retrieveDailySales(res);
    if (dailySales === null) return serverErrorMessage(res);

    let dailySalesStatement = `منصرف عدد ${trays} صواني ${item.name}`;

    let dailySaleBalance;
    if (paid) {
      dailySaleBalance = dailySalesBalance(dailySales, paid);
    }

    const dailySalesNoteBook = {
      name: 'Customer',
      _id: customer._id,
      transactionId,
      subName: 'Item',
    };

    const newDailySales = createItemDailySales(
      customer.name,
      dailySaleBalance,
      paid,
      trays,
      dailySalesStatement,
      date,
      dailySalesNoteBook
    );

    const total = calcTotal(item.unitPrice, trays);
    const balance = calcBalance(paid || 0, total, customer.balance);

    const newTransaction = {
      _id: transactionId,
      balance,
      total,
      trays,
      paid,
      unitPrice: item ? item.unitPrice : 0,
      statement: statement || item.name,
      date,
      dailySaleId: newDailySales._id,
      trayId: tray._id,
      itemId: item._id,
      itemTransactionId: itemTransaction._id,
    };

    customer.balance = newTransaction.balance;
    customer.trays += Number(trays);
    customer.data.push(newTransaction);

    await item.save();
    await tray.save();
    await customer.save();
    await newDailySales.save();

    await session.commitTransaction();
    return sendResponse(res, customer, 201);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};
