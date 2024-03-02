const { serverErrorMessage, sortArr } = require('../../lib/lib');
const { retrieveTrays } = require('../../lib/retrieveModelData');

exports.getTraysData = async (req, res) => {
  try {
    const traysData = await retrieveTrays();

    let traysCount = 0;

    for (tray of traysData) {
      if (tray.expense) traysCount -= tray.expense;
      else if (tray.income) traysCount += tray.income;
    }

    if (traysData === null) return serverErrorMessage(res);
    const reverseTrays = sortArr(traysData);
    res.status(200).json({ trays: reverseTrays, count: traysCount });
  } catch (err) {
    return serverErrorMessage(res);
  }
};
