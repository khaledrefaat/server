const Customer = require('../../models/customer');
const { sendResponse, serverErrorMessage } = require('../../lib/lib');
const { default: mongoose } = require('mongoose');

exports.createCustomer = async (req, res) => {
  const { name, phone } = req.body;

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  session.startTransaction();

  // adding 0 to the phoneNumber because it removes the 0 from the client
  if (phone.length !== 11)
    return sendResponse(res, 'رقم الهاتف يجب ان يكون 11 رقم');

  if (name.length < 3)
    return sendResponse(res, 'اسم العميل يجب ان يكون اكثر من حرفين');

  let existingCustomer;
  try {
    existingCustomer = await Customer.findOne({ name });
  } catch (err) {
    return serverErrorMessage(res);
  }

  if (existingCustomer)
    return sendResponse(res, 'يوجد عميل بهذا الاسم بالفعل، إستخدم اسم اخر');

  const newCustomer = new Customer({
    name,
    phone,
    balance: 0,
    trays: 0,
    data: [],
  });

  try {
    await newCustomer.save();
    return sendResponse(res, newCustomer, 201);
  } catch (err) {
    console.log(err);
    session.abortTransaction();
    return serverErrorMessage(res);
  }
};
