const express = require('express');
const router = express.Router();

const {
  createCustomer,
  newTransaction,
  getCustomers,
  deleteTransaction,
  newFertilizerTransaction,
  deleteFertilizerTransaction,
  newMoneyTransaction,
  deleteMoneyTransaction,
} = require('../controllers/customer');

router.get('/', getCustomers);

router.post('/', createCustomer);
router.post('/item/:id', newTransaction);
router.post('/fertilizer/:id', newFertilizerTransaction);
router.post('/:id', newMoneyTransaction);

router.delete('/:customerId/:transactionId', deleteMoneyTransaction);
router.delete('/item/:customerId/:transactionId', deleteTransaction);
router.delete(
  '/fertilizer/:customerId/:transactionId',
  deleteFertilizerTransaction
);

module.exports = router;
