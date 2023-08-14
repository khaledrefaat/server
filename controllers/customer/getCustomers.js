const Customer = require('../../models/customer');
const {
  sendResponse,
  serverErrorMessage,
  reverseArr,
} = require('../../lib/lib');

exports.getCustomers = async (req, res) => {
  try {
    const Customers = await Customer.find({});

    Customers.forEach(customer => (customer.data = reverseArr(customer.data)));

    return sendResponse(res, Customers, 200);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
