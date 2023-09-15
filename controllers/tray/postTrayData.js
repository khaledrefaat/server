const { mongoose } = require('mongoose');
const { retrieveCustomerById } = require('../../lib/retrieveModelData');
const Tray = require('../../models/trays');
const DailySales = require('../../models/dailySales');
const { sendResponse, serverErrorMessage } = require('../../lib/lib');

const checkForErrors = (trays, income) => {
  if (!trays || trays.length === 0 || trays[trays.length - 1].left < income)
    return 'لا يمكن تنفيذ هذه العملية، هذا العميل ليس لديه هذا القدر من الصواني';

  return null;
};

const savePostToDb = async (customer, dailySale, tray) => {
  try {
    await customer.save();
    await dailySale.save();
    await tray.save();
  } catch (err) {
    console.log(err);
    return null;
  }
};

const postTraysData = async (req, res) => {
  const { customerId, income, notes } = req.body;

  const date = new Date();

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const customer = await retrieveCustomerById(customerId);

    const trays = await Tray.find({ name: customer.name });
    console.log(trays);

    const isError = checkForErrors(trays, income);
    if (isError) return sendResponse(res, isError);

    customer.trays -= income;

    const tray = new Tray({
      name: customer.name,
      income,
      date: date,
      notes,
      customerId,
      left: trays[trays.length - 1].left - income,
    });

    const dailySale = new DailySales({
      name: customer.name,
      statement: `اعاد ${customer.name} عدد ${income} من الصواني`,
      date,
      notes,
      noteBook: {
        name: 'Tray',
        _id: tray._id,
      },
    });

    tray.dailySaleId = dailySale._id;

    const result = await savePostToDb(customer, dailySale, tray);

    if (result === null) return serverErrorMessage(res);

    await session.commitTransaction();
    res.status(201).json({});
  } catch (err) {
    serverErrorMessage(res);
  }
};

module.exports = {
  postTraysData,
  checkForErrors,
  saveToDb: savePostToDb,
};
