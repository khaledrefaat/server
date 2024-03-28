const Item = require('../models/item');
const DailySales = require('../models/dailySales');
const {
  serverErrorMessage,
  sortArr,
  reverseArr,
  sendResponse,
} = require('../lib/lib');
const { nanoid } = require('nanoid');
const { retrieveItemById, getIndexById } = require('../lib/retrieveModelData');
const mongoose = require('mongoose');

const deleteItemTransaction = async (itemId, transactionId) => {
  try {
    const item = await retrieveItemById(itemId);

    if (item === null) return serverErrorMessage(res);

    const dataTmp = item.data;
    const transactionIndex = getIndexById(dataTmp, transactionId);

    const itemTransaction = dataTmp[transactionIndex];
    const dailySaleId = itemTransaction.dailySaleId;

    await DailySales.findByIdAndDelete(dailySaleId);

    for (let i = transactionIndex + 1; i < dataTmp.length; i++)
      dataTmp[i].balance -= itemTransaction.income;

    item.balance -= itemTransaction.income;

    dataTmp.splice(transactionIndex, 1);
    item.data = dataTmp;
    await item.save();
  } catch (err) {
    console.log(err);
  }
};

const deleteOrderFromItem = async (itemId, orderId, confirmOrder = false) => {
  try {
    const item = await Item.findById(itemId);
    const tmpOrders = item.orders;
    const orderIndex = tmpOrders.findIndex(order => order._id === orderId);

    if (confirmOrder) {
      const dailySaleId = tmpOrders[orderIndex].dailySaleId;

      const dailySale = await DailySales.findById(dailySaleId);

      dailySale.isConfirmed = true;
      await dailySale.save();
    }

    for (let i = orderIndex + 1; i < tmpOrders.length; i++) {
      if (tmpOrders[i].name === tmpOrders[orderIndex].name) {
        tmpOrders[i].total -= tmpOrders[orderIndex].trays;
      }
    }

    tmpOrders.splice(orderIndex, 1);
    item.orders = tmpOrders;

    await item.save();
  } catch (err) {
    console.log(err);
    throw new Error('Error in deleteOrderFromItem');
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({});
    items.forEach(item => {
      item.data = sortArr(item.data);
      item.orders = reverseArr(item.orders);
    });

    return res.status(200).json(items);
  } catch (err) {
    console.log(err);
    serverErrorMessage(res);
  }
};

exports.editItemPrice = async (req, res) => {
  const { _id, newPrice } = req.body;
  try {
    if (!newPrice) return sendResponse(res, 'لو سمحت ادخل السعر الجديد');

    const parsePrice = parseFloat(newPrice);
    if (isNaN(parsePrice)) return sendResponse(res, 'السعر يجب ان يكون رقم');

    const item = await retrieveItemById(_id);
    if (item === null) return serverErrorMessage(res);
    item.unitPrice = parsePrice;
    item.save();

    sendResponse(res, item, 201);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.addToItem = async (req, res) => {
  const { _id } = req.params;
  const { amount, statement, date } = req.body;

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    session.startTransaction();

    if (!amount) return sendResponse(res, 'لو سمحت ادخل الكمية');

    const parseAmount = parseFloat(amount);
    if (isNaN(parseAmount)) return sendResponse(res, 'الكمية يجب ان تكون رقم');

    const item = await retrieveItemById(_id);
    console.log(_id);
    if (item === null) return serverErrorMessage(res);

    const newItemBalance = item.balance + parseAmount;
    const currStatement = statement || 'باقي كمية قديمة';
    const transactionId = nanoid();

    const newTransaction = {
      balance: newItemBalance,
      income: parseAmount,
      statement: currStatement,
      date: date || new Date(),
      _id: transactionId,
    };

    const newDailySale = new DailySales({
      name: item.name,
      statement: currStatement,
      noteBook: {
        name: 'Item',
        _id: item._id,
        transactionId,
        subName: 'Data',
      },
      goods: {
        income: parseAmount,
      },
      date: date || new Date(),
    });

    newTransaction.dailySaleId = newDailySale._id;

    item.balance = newItemBalance;
    item.data = [...item.data, newTransaction];
    item.save();

    newDailySale.save();
    await session.commitTransaction();
    sendResponse(res, item, 201);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};

exports.deleteItemTransaction = async (req, res) => {
  const { itemId, transactionId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    await deleteItemTransaction(itemId, transactionId);
    await session.commitTransaction();
    sendResponse(res, {}, 202);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};

exports.createItem = async (req, res) => {
  const { name, unitPrice } = req.body;

  if (!name) return sendResponse(res, 'برجاء ادخال الاسم');

  if (!unitPrice || unitPrice === 0)
    return sendResponse(res, 'برجاء ادخال السعر');

  let existedItem;
  try {
    existedItem = await Item.findOne({ name });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  if (existedItem)
    return sendResponse(res, 'هذا الاسم موجود بالفعل، إستخدم اسم اخر');

  try {
    const newItem = new Item({
      name,
      balance: 0,
      unitPrice,
      data: [],
      orders: [],
    });
    await newItem.save();
    return sendResponse(res, newItem, 201);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.createItemOrder = async (req, res) => {
  const id = req.params.id;
  const { name, trays, seedDate, landDate, notes } = req.body;

  try {
    const item = await Item.findById(id);
    const transactionId = nanoid();
    const date = new Date();

    const calcTotal = () => {
      for (let i = item.orders.length - 1; i >= 0; i--) {
        const currentOrder = item.orders[i];
        if (currentOrder.name === name) return item.orders[i].total + trays;
      }

      return trays;
    };

    const newDailySale = new DailySales({
      name,
      statement: `حجز ${name} عدد ${trays} صواني من ${item.name}`,
      noteBook: {
        name: 'Item',
        _id: item._id,
        transactionId,
        subName: 'Order',
      },
      date: date || new Date(),
      notes,
    });

    item.orders = [
      ...item.orders,
      {
        _id: transactionId,
        name,
        trays: trays,
        total: calcTotal(),
        seedDate: seedDate || date,
        landDate: landDate || date,
        notes,
        dailySaleId: newDailySale._id,
      },
    ];

    await item.save();
    await newDailySale.save();
    return sendResponse(res, item, 201);
  } catch (err) {
    console.log(err);
    serverErrorMessage(res);
  }
};

exports.deleteItem = async (req, res) => {
  const id = req.params.id;
  try {
    await Item.findByIdAndDelete(id);
    return sendResponse(res, {}, 202);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.confirmItemOrder = async (req, res) => {
  const { itemId, orderId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    await deleteOrderFromItem(itemId, orderId, true);
    session.commitTransaction();
    return sendResponse(res, {}, 202);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteItemOrder = async (req, res) => {
  const { itemId, orderId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    const item = await Item.findById(itemId);
    const tmpOrders = item.orders;
    const orderIndex = tmpOrders.findIndex(order => order._id === orderId);

    for (let i = orderIndex + 1; i < tmpOrders.length; i++) {
      if (tmpOrders[i].name === tmpOrders[orderIndex].name) {
        tmpOrders[i].total -= tmpOrders[orderIndex].trays;
      }
    }
    await DailySales.findByIdAndDelete(tmpOrders[orderIndex].dailySaleId);

    tmpOrders.splice(orderIndex, 1);
    item.orders = tmpOrders;

    await item.save();

    await session.commitTransaction();
    return sendResponse(res, {}, 202);
  } catch (err) {
    console.log(err);
    session.abortTransaction();

    serverErrorMessage(res);
  }
};
