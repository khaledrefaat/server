const Customer = require('../../models/customer');
const Tray = require('../../models/trays');
const { sendResponse, serverErrorMessage, sortArr } = require('../../lib/lib');
const customer = require('../../models/customer');

exports.getCustomers = async (req, res) => {
  try {
    const Customers = await Customer.find({});

    Customers.forEach(customer => (customer.data = sortArr(customer.data)));

    return sendResponse(res, Customers, 200);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.fixCustomer = async (req, res) => {
  const customers = await Customer.find({});
  customers.forEach(async customer => {
    customer.trays = 0;
    customer.data.forEach(data => {
      if (data.trays) customer.trays += data.trays;
    });
    const Trays = await Tray.find({ customerId: customer._id });
    Trays.forEach(tray => {
      if (tray.income) customer.trays -= tray.income;
    });
    await customer.save();
  });
  res.json(customers);
};
