const { nanoid } = require('nanoid');
const Supplier = require('../models/supplier');
const DailySales = require('../models/dailySales');
const { serverErrorMessage, sendResponse, reverseArr } = require('../lib/lib');
const mongoose = require('mongoose');
const {
  retrieveFertilizerById,
  getIndexById,
} = require('../lib/retrieveModelData');

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({});

    suppliers.forEach(supplier => (supplier.data = reverseArr(supplier.data)));

    res.status(200).json(suppliers);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.addSupplier = async (req, res) => {
  const { name } = req.body;

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
  session.startTransaction();

  let existedSupplier;
  try {
    existedSupplier = await Supplier.findOne({ name });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  if (existedSupplier)
    return res.status(422).json({ msg: 'يوجد بالفعل مورد بهذا الاسم' });

  try {
    const newSupplier = new Supplier({
      name,
      balance: 0,
      data: [],
    });
    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) {
    session.abortTransaction();
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.addTransaction = async (req, res) => {
  const { paid, unitPrice, unit, statement, notes } = req.body;
  const id = req.params.id;

  if (!paid && !unit)
    return sendResponse(res, 'من فضلك ادخل المبلغ او ادخل عدد الوحدات');

  if (!statement) return sendResponse(res, 'من فضلك ادخل البيان');

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    session.startTransaction();

    const existedSupplier = await Supplier.findById(id);

    const total = (unitPrice || 0) * (unit || 0);
    const newBalance = (paid || 0) - total + existedSupplier.balance;
    const transactionId = nanoid();
    const date = new Date();
    existedSupplier.balance = newBalance;

    const dailySales = await DailySales.find({
      money: {
        $exists: true,
      },
    });

    const calcDailySalesBalance = () => {
      if (dailySales.length === 0) return -paid;
      return dailySales[dailySales.length - 1].money.balance - paid;
    };

    const newDailySale = new DailySales({
      name: existedSupplier.name,
      money: {
        expense: paid,

        balance: calcDailySalesBalance() || 0,
      },
      goods: {
        income: unit,
      },
      statement: statement,
      date,
      noteBook: {
        name: 'Supplier',
        _id: existedSupplier._id,
        transactionId,
      },
    });

    existedSupplier.data = [
      ...existedSupplier.data,
      {
        _id: transactionId,
        balance: newBalance,
        total,
        paid,
        unitPrice,
        unit,
        statement,
        date,
        notes,
        dailySaleId: newDailySale._id,
      },
    ];

    await newDailySale.save();
    await existedSupplier.save();
    res.status(201).json(existedSupplier);
  } catch (err) {
    session.abortTransaction();

    console.log(err);
    return serverErrorMessage(res);
  }
};

const deleteTransactionFromFertilizer = async (fertilizerId, transactionId) => {
  try {
    const fertilizer = await retrieveFertilizerById(fertilizerId);

    const dataTmp = fertilizer.data;
    const transactionIndex = getIndexById(dataTmp, transactionId);

    const fertilizerTransaction = dataTmp[transactionIndex];

    for (let i = transactionIndex + 1; i < dataTmp.length; i++)
      dataTmp[i].balance += parseFloat(fertilizerTransaction.income);

    fertilizer.balance -= parseFloat(fertilizerTransaction.income);

    dataTmp.splice(transactionIndex, 1);
    fertilizer.data = dataTmp;
    await fertilizer.save();
  } catch (err) {
    console.log(err);
  }
};

exports.deleteTransaction = async (req, res) => {
  const { supplierId, transactionId } = req.params;

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
  try {
    session.startTransaction();

    const supplier = await Supplier.findById(supplierId);

    const transactionIndex = supplier.data.findIndex(
      supplier => supplier._id === transactionId
    );

    const dataTmp = supplier.data;
    const transaction = dataTmp[transactionIndex];

    for (let i = transactionIndex + 1; i < dataTmp.length; i++) {
      dataTmp[i].balance +=
        parseInt(transaction.total) - (parseInt(transaction.paid) || 0);
    }

    const dailySale = await DailySales.findById(transaction.dailySaleId);
    // subtract each daily sale balance that come after the targeted deleted one
    await DailySales.find({}).updateMany(
      { _id: { $gt: dailySale._id }, money: { $exists: true } },
      {
        $inc: { 'money.balance': dailySale.money.expense || 0 },
      }
    );

    await dailySale.deleteOne();

    supplier.balance +=
      parseInt(transaction.total) - (parseInt(transaction.paid) || 0);
    dataTmp.splice(transactionIndex, 1);
    supplier.data = dataTmp;

    let err;
    if (transaction.fertilizerId) {
      err = await deleteTransactionFromFertilizer(
        transaction.fertilizerId,
        transaction.fertilizerTransactionId
      );
    }

    if (err) {
      session.abortTransaction();
      return serverErrorMessage(res);
    }

    await supplier.save();

    await session.commitTransaction();
    return res.status(202).json({});
  } catch (err) {
    session.abortTransaction();
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.addFertilizerTransaction = async (req, res) => {
  const { paid, unitPrice, units, statement, notes, fertilizerId } = req.body;
  const id = req.params.id;

  if (!statement) return sendResponse(res, 'من فضلك ادخل البيان');

  if (!fertilizerId)
    return sendResponse(res, 'من فضلك اختر نوع المبيد او السماد');

  let session;
  try {
    session = await mongoose.startSession();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  try {
    const existedSupplier = await Supplier.findById(id);
    const existedFertilizer = await retrieveFertilizerById(fertilizerId);

    const total = (unitPrice || 0) * (units || 0);
    const newBalance = (paid || 0) - total + existedSupplier.balance;
    const transactionId = nanoid();
    const fertilizerTransactionId = nanoid();
    const date = new Date();
    existedSupplier.balance = newBalance;

    const dailySales = await DailySales.find({
      money: {
        $exists: true,
      },
    });

    const calcDailySalesBalance = () => {
      if (dailySales.length === 0) return -paid;
      return dailySales[dailySales.length - 1].money.balance - paid;
    };

    const newDailySale = new DailySales({
      name: existedSupplier.name,
      money: {
        expense: paid,

        balance: calcDailySalesBalance() || 0,
      },
      goods: {
        income: units,
      },
      statement: statement,
      date,
      noteBook: {
        name: 'Supplier',
        _id: existedSupplier._id,
        transactionId,
        subName: 'fertilizerTransaction',
      },
    });

    existedSupplier.data = [
      ...existedSupplier.data,
      {
        _id: transactionId,
        balance: newBalance,
        total,
        paid,
        unitPrice,
        unit: units,
        statement,
        date,
        notes: notes || existedFertilizer.name,
        dailySaleId: newDailySale._id,
        fertilizerId,
        fertilizerTransactionId,
      },
    ];

    existedFertilizer.data = [
      ...existedFertilizer.data,
      {
        _id: fertilizerTransactionId,
        balance: parseFloat(existedFertilizer.balance) + parseFloat(units),
        income: units,
        statement: existedSupplier.name,
        supplierId: existedSupplier._id,
        supplierTransactionId: transactionId,
      },
    ];

    existedFertilizer.balance += parseFloat(units);

    await existedFertilizer.save();
    await newDailySale.save();
    await existedSupplier.save();
    res.status(201).json(existedSupplier);
  } catch (err) {
    session.abortTransaction();
    console.log(err);
    return serverErrorMessage(res);
  }
};
