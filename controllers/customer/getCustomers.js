const Customer = require('../../models/customer');
const { sendResponse, serverErrorMessage, sortArr } = require('../../lib/lib');

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
