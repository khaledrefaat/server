const {
  serverErrorMessage,
  sortArr,
  calcTraysCount,
} = require('../../lib/lib');
const { retrieveTrays } = require('../../lib/retrieveModelData');

exports.getTraysData = async (req, res) => {
  try {
    const traysData = await retrieveTrays();

    const count = calcTraysCount(traysData);

    if (traysData === null) return serverErrorMessage(res);
    const reverseTrays = sortArr(traysData);
    res.status(200).json({ trays: reverseTrays, count });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }
};
