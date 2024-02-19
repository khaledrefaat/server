const express = require('express');
const router = express.Router();

const {
  getLoaners,
  postLoaner,
  postLoan,
  deleteLoan,
  getLoans,
} = require('../controllers/loan');

router.get('/', getLoaners);
router.get('/:id', getLoans);

router.post('/', postLoaner);
router.post('/:id', postLoan);

router.delete('/:id/:transactionId', deleteLoan);

module.exports = router;
