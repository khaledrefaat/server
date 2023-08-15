const Seeding = require('../models/seeding');
const DailySales = require('../models/dailySales');
const Item = require('../models/item');
const Trays = require('../models/trays');
const { serverErrorMessage, reverseArr } = require('../lib/lib');
const { nanoid } = require('nanoid');
const mongoose = require('mongoose');

exports.getSeedings = async (req, res) => {
  try {
    const SeedingData = reverseArr(await Seeding.find({}));
    res.status(200).json(SeedingData);
  } catch (err) {
    console.log(err);
    serverErrorMessage(res);
  }
};

exports.postSeeding = async (req, res) => {
  const { itemId, quantity, unit, plantDate, lotNumber, trays } = req.body;

  const parseTrays = parseInt(trays);

  if (!parseTrays || parseTrays <= 0)
    return res.status(422).json({ msg: 'من فضلك ادخل عدد الصواني المزروعة' });

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    const item = await Item.findById(itemId);

    item.balance += parseTrays;
    const transactionId = nanoid();

    const date = new Date();

    let total = 0;
    const seeds = await Seeding.find({});
    if (seeds[seeds.length - 1]) {
      total += parseInt(seeds[seeds.length - 1].total) + parseInt(parseTrays);
    } else {
      total = parseInt(parseTrays);
    }

    const newSeed = new Seeding({
      itemName: item.name,
      itemId,
      itemTransactionId: transactionId,
      quantity,
      unit,
      plantDate: plantDate || date,
      lotNumber,
      trays: parseTrays,
      total,
    });

    const newTray = new Trays({
      name: item.name,
      income: parseTrays,
      date,
      seedingId: newSeed._id,
    });

    newSeed.trayId = newTray._id;

    const newDailySale = new DailySales({
      name: item.name,
      statement: `زراعة ${quantity} ${item.name}`,
      goods: {
        income: parseTrays,
      },
      date,
      noteBook: {
        name: 'Seeding',
        _id: newSeed._id,
      },
    });

    item.data = [
      ...item.data,
      {
        _id: transactionId,
        balance: item.balance,
        income: parseTrays,
        date,
        seedingId: newSeed._id,
      },
    ];

    newSeed.dailySaleId = newDailySale._id;

    await newSeed.save();
    await newDailySale.save();
    await item.save();

    await session.commitTransaction();
    res.status(201).json(newSeed);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.deleteSeeding = async (req, res) => {
  const id = req.params.id;

  try {
    let seeding = await Seeding.findById(id);

    // //////////////////////////////////////////////
    // updating seeding
    await Seeding.updateMany(
      { _id: { $gt: id } },
      { $inc: { balance: -seeding.trays } }
    );

    // //////////////////////////////////////////////
    // updating item
    const item = await Item.findById(seeding.itemId);
    const itemDataIndex = item.data.findIndex(
      data => data._id === seeding.itemTransactionId
    );
    for (let i = itemDataIndex; i < item.data.length; i++) {
      item.data[i].balance -= parseInt(seeding.trays);
    }
    item.balance -= parseInt(seeding.trays);
    item.data = item.data.filter(
      data => data._id !== seeding.itemTransactionId
    );

    // //////////////////////////////////////////////
    // Updating dailySales
    await DailySales.findByIdAndDelete(seeding.dailySaleId);

    await seeding.deleteOne();
    await item.save();
    res.status(202).send({});
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.fixTotal = async (req, res) => {
  try {
    const seeding = Seeding.find({});

    let previousTotal = 0;

    (await seeding).forEach(async seed => {
      previousTotal += parseFloat(seed.trays);
      seed.total = previousTotal;
      await seed.save();
    });
    return res.status(200).json({ msg: 'Done ^_^' });
  } catch (err) {
    console.log(err);
  }
};
