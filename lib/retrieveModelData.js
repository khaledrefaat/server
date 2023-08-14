const DailySales = require('../models/dailySales');
const Customer = require('../models/customer');
const Item = require('../models/item');
const Tray = require('../models/trays');
const Fertilizer = require('../models/fertilizer');

exports.retrieveDailySales = async () => {
  try {
    const dailySales = await DailySales.find({});
    return dailySales;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveTrays = async () => {
  try {
    const trays = await Tray.find({});
    return trays;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveCustomers = async () => {
  try {
    const customers = await Customer.find({});
    return customers;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveDailySalesById = async _id => {
  try {
    const dailySales = await DailySales.findById({ _id });
    return dailySales;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveCustomerById = async id => {
  try {
    const customer = await Customer.findById(id);
    return customer;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveItemById = async id => {
  try {
    const item = await Item.findById(id);
    return item;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveFertilizerById = async id => {
  try {
    const fertilizer = await Fertilizer.findById(id);
    return fertilizer;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveDailySaleById = async id => {
  try {
    return await DailySales.findById(id);
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.retrieveTrayById = async _id => {
  try {
    const tray = await Tray.findById(_id);
    return tray;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.getIndexById = (data, _id) => data.findIndex(data => data._id === _id);

exports.calcLeftTrays = async (trays, customerName) => {
  const parseTrays = parseInt(trays);
  try {
    const traysData = await Tray.find({ name: customerName });
    return traysData.length > 0
      ? parseTrays + traysData[traysData.length - 1].left
      : parseTrays;
  } catch (err) {
    console.log(err);
    return null;
  }
};
