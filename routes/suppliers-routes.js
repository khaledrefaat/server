const express = require('express');
const router = express.Router();

const {
  addSupplier,
  addTransaction,
  deleteTransaction,
  getSuppliers,
  addFertilizerTransaction,
} = require('../controllers/supplier-controllers');

router.get('/', getSuppliers);

router.post('/', addSupplier);
router.post('/:id', addTransaction);
router.post('/fertilizer/:id', addFertilizerTransaction);

router.delete('/:supplierId/:transactionId', deleteTransaction);

module.exports = router;
