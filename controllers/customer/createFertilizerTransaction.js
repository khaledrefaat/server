const { mongoose } = require('mongoose');
const { nanoid } = require('nanoid');
const DailySales = require('../../models/dailySales');

const {
  validateFertilizerInput,
  calcTotal,
  calcBalance,
  generateDailySaleStatementFertilizer,
} = require('./helperFunctions');
const {
  retrieveCustomerById,
  retrieveDailySales,
  retrieveFertilizerById,
} = require('../../lib/retrieveModelData');
const { dailySalesBalance, sendResponse } = require('../../lib/lib');

exports.newFertilizerTransaction = async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  const paid = data.paid || 0;

  const date = new Date();

  const errorMsg = validateFertilizerInput(data); // Make sure to have a validateInput function for fertilizer data

  if (errorMsg) return sendResponse(res, errorMsg);

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
    const fertilizer = await retrieveFertilizerById(data.fertilizerId);

    const transactionId = nanoid();

    const dailySales = await retrieveDailySales();

    const dailySaleBalance = dailySalesBalance(dailySales, paid);

    console.log(dailySaleBalance);

    // ... Similar logic for creating newDailySales

    const dailySale = new DailySales({
      name: customer.name,
      money: {
        balance: dailySaleBalance,
        income: data.paid,
      },
      goods: {
        expense: data.units,
      },
      statement: generateDailySaleStatementFertilizer(fertilizer, data),
      date,
      noteBook: {
        name: 'Customer',
        _id: customer._id,
        transactionId,
        subName: 'Fertilizer',
      },
    });

    const total = calcTotal(fertilizer.unitPrice || 0, data.units);
    const balance = calcBalance(paid, total, customer.balance);
    const fertilizerBalance =
      parseFloat(fertilizer.balance) - parseFloat(data.units);

    const fertilizerTransaction = {
      _id: nanoid(),
      balance: fertilizerBalance,
      expense: data.units,
      date,
      statement: data.statement,
      customerTransactionId: transactionId,
      customerId: customer._id,
    };

    const newFertilizerTransaction = {
      _id: transactionId,
      balance,
      total,
      units: data.units,
      paid: data.paid,
      unitPrice: fertilizer.unitPrice || 0,
      statement: data.statement || customer.name,
      date,
      dailySaleId: dailySale._id,
      fertilizerId: fertilizer._id,
      fertilizerTransactionId: fertilizerTransaction._id,
    };

    customer.balance = balance;
    customer.data.push(newFertilizerTransaction);

    fertilizer.balance = fertilizerBalance;
    fertilizer.data.push(fertilizerTransaction);

    await customer.save();
    await dailySale.save();
    await fertilizer.save();

    await session.commitTransaction();
    return sendResponse(res, fertilizer, 201);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};
