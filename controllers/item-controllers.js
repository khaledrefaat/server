const Item = require('../models/item');
const DailySales = require('../models/dailySales');
const { serverErrorMessage, reverseArr, sendResponse } = require('../lib/lib');
const { nanoid } = require('nanoid');
const { default: mongoose } = require('mongoose');
const { retrieveItemById } = require('../lib/retrieveModelData');

exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({});
    items.forEach(item => {
      item.data = reverseArr(item.data);
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
    item.unitPrice = newPrice;
    item.save();

    sendResponse(res, item, 201);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.createItem = async (req, res) => {
  const { name, unitPrice } = req.body;

  if (!name) return res.status(422).json({ msg: 'برجاء ادخال اسم الصنف' });

  if (!unitPrice || unitPrice === 0)
    return res.status(422).json({ msg: 'برجاء ادخال سعر الوحدة' });

  let existedItem;
  try {
    existedItem = await Item.findOne({ name });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  if (existedItem)
    return res.status(422).json({ msg: 'يوجد صنف بهذا الاسم بالفعل' });

  try {
    const newItem = new Item({
      name,
      balance: 0,
      unitPrice,
      data: [],
      orders: [],
    });
    await newItem.save();
    return res.status(201).json(newItem);
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
      date: date,
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
    res.status(201).json(item);
  } catch (err) {
    console.log(err);
    serverErrorMessage(res);
  }
};

exports.deleteItem = async (req, res) => {
  const id = req.params.id;
  try {
    await Item.findByIdAndDelete(id);
    return res.status(202).json({ msg: 'تم حذف الصنف بنجاح' });
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
    session.abortTransaction();
    return serverErrorMessage(res);
  }

  try {
    console.log(req.params);

    const item = await Item.findById(itemId);
    const tmpOrders = item.orders;
    const orderIndex = tmpOrders.findIndex(order => order._id === orderId);

    for (let i = orderIndex + 1; i < tmpOrders.length; i++) {
      console.log(orderIndex);
      if (tmpOrders[i].name === tmpOrders[orderIndex].name) {
        tmpOrders[i].total -= tmpOrders[orderIndex].trays;
      }
    }

    tmpOrders.splice(orderIndex, 1);
    item.orders = tmpOrders;

    await item.save();

    await session.commitTransaction();
    res.status(202).json({});
  } catch (err) {
    console.log(err);
    session.abortTransaction();

    serverErrorMessage(res);
  }
};
