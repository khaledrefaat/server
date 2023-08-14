const { getTraysData } = require('./getTrays');
const {
  postTraysData,
  checkForErrors,
  savePostToDb,
} = require('./postTrayData');
const { deleteTraysData, saveDeleteToDb } = require('./deleteTrayData');

module.exports = {
  getTraysData,
  postTraysData,
  checkForErrors,
  savePostToDb,
  deleteTraysData,
  saveDeleteToDb,
};
