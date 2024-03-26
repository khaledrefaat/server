const Customer = require('../../models/customer');
const Trays = require('../../models/trays');
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

exports.fixCustomers = async (req, res) => {
  try {
    const customer = await Customer.find({});

    customer.forEach(async customer => {
      if (customer.data.length > 0)
        customer.balance = customer.data[customer.data.length - 1].balance;

      // customer.data
      //   .sort((a, b) => new Date(a.date) - new Date(b.date))
      //   .reduce((acc, curr) => {
      //     let paid = curr.paid || 0;
      //     let total = curr.total || 0;
      //     if (paid < 0) {
      //       if (
      //         (curr.statement.includes('مين') &&
      //           !curr.statement.includes('منصرف تأمين')) ||
      //         curr.statement.includes('خصم') ||
      //         curr.statement.includes('فرق')
      //       ) {
      //         curr.balance += parseFloat(Math.abs(paid));
      //       } else curr.balance += parseFloat(paid);
      //     } else {
      //       curr.balance = parseFloat(paid) - parseFloat(total);
      //     }
      //     curr.balance += acc;
      //     return curr.balance;
      //   }, 0);

      // customer.data.forEach(data => (data.balance = 0));
      // customer.trays = 0;

      // customer.data.forEach(data => {
      //   if (data.trays) {
      //     customer.trays += data.trays;
      //   }
      // });

      const trays = await Trays.find({ customerId: customer._id });

      trays.forEach(tray => {
        if (tray.income) {
          customer.trays -= tray.income;
        }
      });

      await customer.save();
    });
    res.json(customer);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
