// Import necessary dependencies and models
const Fertilizer = require('../models/fertilizer'); // Import the Fertilizer model
const { serverErrorMessage, reverseArr, sendResponse } = require('../lib/lib'); // Import utility functions
const { retrieveFertilizerById } = require('../lib/retrieveModelData'); // Import a utility function

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
  console.log(req.body);
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
