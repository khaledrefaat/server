const { sendResponse, serverErrorMessage } = require('../lib/lib');

const DailySales = require('../models/dailySales');

exports.getDailySales = async (req, res) => {
  const page = req.params.page;
  try {
    const dailySales = await DailySales.find()
      .sort({ date: -1 })
      .limit(50)
      .skip((page - 1) * 50)
      .exec();
    const count = await DailySales.count();
    const pages = Math.ceil(count / 50);

    sendResponse(res, { dailySales, pages }, 200);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};

exports.getDailySalesSearch = async (req, res) => {
  const term = req.params.term;
  try {
    const dailySales = await DailySales.find({
      name: { $regex: `${term}.*` },
    })
      .sort({ date: -1 })
      .exec();

    return sendResponse(res, { dailySales, pages }, 200);
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
