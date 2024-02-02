// Import necessary dependencies and models
const Fertilizer = require('../models/fertilizer'); // Import the Fertilizer model
const { serverErrorMessage, reverseArr, sendResponse } = require('../lib/lib'); // Import utility functions
const {
  retrieveFertilizerById,
  getIndexById,
} = require('../lib/retrieveModelData'); // Import a utility function
const dailySales = require('../models/dailySales');
const { nanoid } = require('nanoid');
const mongoose = require('mongoose');

const deleteTransactionFromFertilizer = async (fertilizerId, transactionId) => {
  try {
    const fertilizer = await retrieveFertilizerById(fertilizerId);

    const dataTmp = fertilizer.data;
    const transactionIndex = getIndexById(dataTmp, transactionId);

    const fertilizerTransaction = dataTmp[transactionIndex];
    const dailySalesId = fertilizerTransaction.dailySaleId;

    for (let i = transactionIndex + 1; i < dataTmp.length; i++)
      dataTmp[i].balance -= parseFloat(fertilizerTransaction.income) || 0;

    fertilizer.balance -= parseFloat(fertilizerTransaction.income) || 0;

    dataTmp.splice(transactionIndex, 1);
    fertilizer.data = dataTmp;
    await dailySales.findByIdAndDelete(dailySalesId);
    await fertilizer.save();
  } catch (err) {
    console.log(err);
  }
};

// Function to get a list of fertilizers
exports.getFertilizers = async (req, res) => {
  try {
    // Fetch all fertilizers from the database
    const fertilizers = await Fertilizer.find({});
    // Reverse the order of data for each fertilizer
    fertilizers.forEach(fertilizer => {
      fertilizer.data = reverseArr(fertilizer.data);
    });

    // Respond with the fetched fertilizers
    return res.status(200).json(fertilizers);
  } catch (err) {
    console.log(err);
    // Handle any errors with a server error message
    return serverErrorMessage(res);
  }
};

// Function to edit the price of a fertilizer
exports.editFertilizerPrice = async (req, res) => {
  const { _id, newPrice } = req.body;
  try {
    // Check if the new price is provided
    if (!newPrice) return sendResponse(res, 'لو سمحت ادخل السعر الجديد');

    // Parse the new price as a float
    const parsePrice = parseFloat(newPrice);
    // Check if the parsed price is a valid number
    if (isNaN(parsePrice)) return sendResponse(res, 'السعر يجب ان يكون رقم');

    // Retrieve the fertilizer by its ID
    const fertilizer = await retrieveFertilizerById(_id);
    // Handle the case where the fertilizer is not found
    if (fertilizer === null) return serverErrorMessage(res);
    // Update the fertilizer's unit price
    fertilizer.unitPrice = newPrice;
    // Save the changes to the database
    await fertilizer.save();

    // Respond with the updated fertilizer
    sendResponse(res, fertilizer, 201);
  } catch (err) {
    console.log(err);
    // Handle any errors with a server error message
    return serverErrorMessage(res);
  }
};

exports.addToFertilizer = async (req, res) => {
  const { _id } = req.params;
  const { amount, statement, date } = req.body;

  try {
    if (!amount) return sendResponse(res, 'لو سمحت ادخل الكمية');

    const parseAmount = parseFloat(amount);
    if (isNaN(parseAmount)) return sendResponse(res, 'الكمية يجب ان تكون رقم');

    const fertilizer = await retrieveFertilizerById(_id);
    if (fertilizer === null) return serverErrorMessage(res);

    const newBalance = fertilizer.balance + parseAmount;
    const currStatement = statement || 'باقي كمية قديمة';
    const transactionId = nanoid();

    const newTransaction = {
      balance: newBalance,
      income: parseAmount,
      statement: currStatement,
      date: date || new Date(),
      _id: transactionId,
    };

    const newDailySale = new dailySales({
      name: fertilizer.name,
      statement: currStatement,
      noteBook: {
        name: 'Fertilizer',
        _id: fertilizer._id,
        transactionId,
        subName: 'Data',
      },
      goods: {
        income: parseAmount,
      },
      date: date || new Date(),
    });

    newTransaction.dailySaleId = newDailySale._id;

    fertilizer.balance = newBalance;
    fertilizer.data = [...fertilizer.data, newTransaction];
    fertilizer.save();
    console.log(newTransaction);
    console.log(fertilizer.data);

    newDailySale.save();

    sendResponse(res, fertilizer, 201);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteFertilizerTransaction = async (req, res) => {
  const { fertilizerId, transactionId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    await deleteTransactionFromFertilizer(fertilizerId, transactionId);
    await session.commitTransaction();
    sendResponse(res, {}, 202);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};

// Function to create a new fertilizer
exports.createFertilizer = async (req, res) => {
  const { name, unitPrice } = req.body;

  // Check if the name is provided
  if (!name) return res.status(422).json({ msg: 'برجاء ادخال الاسم' });

  // Check if the unit price is provided and not zero
  if (!unitPrice || unitPrice === 0)
    return res.status(422).json({ msg: 'برجاء ادخال سعر الوحدة' });

  let existedFertilizer;
  try {
    // Check if a fertilizer with the same name already exists
    existedFertilizer = await Fertilizer.findOne({ name });
  } catch (err) {
    console.log(err);
    // Handle any errors with a server error message
    return serverErrorMessage(res);
  }

  // Handle the case where a fertilizer with the same name already exists
  if (existedFertilizer)
    return res
      .status(422)
      .json({ msg: 'يوجد  سماد او مبيد بهذا الاسم بالفعل' });

  try {
    // Create a new fertilizer instance with the provided data
    const newFertilizer = new Fertilizer({
      name,
      balance: 0,
      unitPrice,
      data: [],
    });
    // Save the new fertilizer to the database
    await newFertilizer.save();
    // Respond with the created fertilizer
    return res.status(201).json(newFertilizer);
  } catch (err) {
    console.log(err);
    // Handle any errors with a server error message
    return serverErrorMessage(res);
  }
};
