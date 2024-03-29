const { mongoose } = require('mongoose');
const { retrieveCustomerById } = require('../../lib/retrieveModelData');
const Tray = require('../../models/trays');
const DailySales = require('../../models/dailySales');
const { sendResponse, serverErrorMessage, sortArr } = require('../../lib/lib');
const { nanoid } = require('nanoid');

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
  const { customerId, income, notes, insurance } = req.body;

  const parseIncome = Number(income);

  const date = new Date();

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const customer = await retrieveCustomerById(customerId);

    const trays = await Tray.find({ name: customer.name });
    sortArr(trays);

    const isError = checkForErrors(trays, parseIncome);
    if (isError) return sendResponse(res, isError);

    const tray = new Tray({
      name: customer.name,
      income: parseIncome,
      date: date,
      notes,
      customerId,
      left: trays[0].left - parseIncome,
    });

    const dailySale = new DailySales({
      name: customer.name,
      statement: `اعاد ${customer.name} عدد ${parseIncome} من الصواني`,
      date,
      notes,
      noteBook: {
        name: 'Tray',
        _id: tray._id,
      },
    });

    if (insurance) {
      const transactionId = nanoid();
      const parseInsurance = parseFloat(insurance);
      const newCustomerTransaction = {
        _id: transactionId,
        balance: customer.balance - parseInsurance,
        paid: -parseInsurance,
        statement: `منصرف تأمين ${parseIncome} من صواني`,
        date,
        dailySaleId: dailySale._id,
        trayId: tray._id,
      };

      const dailySales = await DailySales.find({});
      dailySale.statement = ` اعاد ${customer.name} ${parseIncome} صواني و تم اعادة التأمين`;

      if (dailySales.length === 0) dailySale.money.balance = -parseInsurance;
      else {
        for (let i = dailySales.length - 1; i >= 0; i--) {
          if (dailySales[i].money.balance) {
            dailySale.money.balance =
              dailySales[i].money.balance - parseInsurance;
            break;
          }
        }
      }
      dailySale.money.expense = parseInsurance;
      customer.balance = newCustomerTransaction.balance;
      customer.data.push(newCustomerTransaction);
      customer.trays -= parseIncome;
      tray.transactionId = transactionId;
    } else {
      customer.trays += parseIncome;
    }

    tray.dailySaleId = dailySale._id;

    const result = await savePostToDb(customer, dailySale, tray);

    if (result === null) return serverErrorMessage(res);

    const newDailySales = await DailySales.find({});
    sortArr(newDailySales);

    await session.commitTransaction();
    res.status(201).json({ dailySales: newDailySales });
  } catch (err) {
    console.log(err);
    serverErrorMessage(res);
  }
};

module.exports = {
  postTraysData,
  checkForErrors,
  saveToDb: savePostToDb,
};
