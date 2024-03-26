const { createCustomer } = require('./createCustomer');
const { getCustomers } = require('./getCustomers');

const {
  deleteTransactionFromCustomer,
  deleteItemTransaction,
  deleteDailySaleAndUpdateBalances,
  deleteTray,
  deleteTransaction,
} = require('./deleteTransaction');

const { newTransaction } = require('./createItemTransaction');
const {
  newMoneyTransaction,
  deleteMoneyTransaction,
} = require('./justMoneyTransaction');
const {
  createItemDailySales,
  createTray,
  generateDailySaleStatementFertilizer,
  generateItemDailySaleStatement,
  calcBalance,
  validateFertilizerInput,
  validateItemInput,
  calcTotal,
} = require('./helperFunctions');
const { newFertilizerTransaction } = require('./createFertilizerTransaction');

const {
  deleteFertilizerTransaction,
} = require('./deleteFertilizerTransaction');

module.exports = {
  deleteTransaction,
  deleteTray,
  deleteDailySaleAndUpdateBalances,
  deleteItemTransaction,
  deleteTransactionFromCustomer,
  newTransaction,
  newTransaction,
  validateItemInput,
  validateFertilizerInput,
  createCustomer,
  getCustomers,
  createTray,
  calcBalance,
  calcTotal,
  generateItemDailySaleStatement,
  createItemDailySales,
  newFertilizerTransaction,
  generateDailySaleStatementFertilizer,
  deleteFertilizerTransaction,
  newMoneyTransaction,
  deleteMoneyTransaction,
};
