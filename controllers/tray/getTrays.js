const { serverErrorMessage, reverseArr } = require('../../lib/lib');
const { retrieveTrays } = require('../../lib/retrieveModelData');

exports.getTraysData = async (req, res) => {
  try {
    const traysData = await retrieveTrays();

    if (traysData === null) return serverErrorMessage(res);
    const reverseTrays = reverseArr(traysData);
    res.status(200).json(reverseTrays);
  } catch (err) {
    return serverErrorMessage(res);
  }
};
