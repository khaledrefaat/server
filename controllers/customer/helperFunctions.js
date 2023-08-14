const Tray = require('../../models/trays');
const DailySales = require('../../models/dailySales');
const { retrieveDailySaleById } = require('../../lib/retrieveModelData');

exports.calcTotal = (unitPrice, trays) =>
  parseFloat(unitPrice) * parseFloat(trays);

exports.calcBalance = (paid, total, customerBalance) =>
  parseFloat(paid) - parseFloat(total) + parseFloat(customerBalance);

exports.generateDailySaleStatementFertilizer = (fertilizer, data) =>
  fertilizer
    ? `منصرف عدد ${data.units} وحدات ${fertilizer.name}`
    : data.statement;

exports.createItemDailySales = (
  name,
  balance,
  income,
  expense,
  statement,
  date,
  noteBook
) => {
  return new DailySales({
    name,
    money: {
      balance,
      income,
    },
    goods: {
      expense,
    },
    statement,
    date,
    noteBook,
  });
};

exports.validateFertilizerInput = ({
  fertilizerId,
  statement,
  units,
  paid,
}) => {
  if (!fertilizerId || (fertilizerId && !paid))
    return 'حدث خطأ ما جرب غلق النافذة و فتحها مرة اخري او جرب الغاء المبيد';

  if (!fertilizerId && !statement)
    return 'من فضلك ادخل البيان او اختار نوع السماد';

  if (fertilizerId && !units)
    return 'من فضلك ادخل الوحدات او الغي الختيار المبيد';

  return null;
};

exports.createTray = (
  customerName,
  trays,
  date,
  statement,
  customerId,
  leftTrays,
  transactionId
) => {
  // creating trays transaction

  try {
    tray = new Tray({
      name: customerName,
      expense: trays,
      date: date,
      notes: statement,
      customerId: customerId,
      left: leftTrays,
      transactionId,
    });
    return tray;
  } catch (err) {
    console.log(err);
    return null;
  }
};

exports.deleteDailySaleAndUpdateBalances = async _id => {
  try {
    const dailySale = await retrieveDailySaleById(_id);
    if (dailySale === null) return null;
    // subtract each daily sale balance that come after the targeted deleted one

    DailySales.find({}).updateMany(
      {
        _id: { $gt: dailySale._id },
      },

      {
        $inc: { 'money.balance': -dailySale.money.income },
      }
    );

    await dailySale.deleteOne();
  } catch (err) {
    console.log(err);
    return null;
  }
};
