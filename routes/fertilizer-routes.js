const express = require('express');

const {
  getFertilizers,
  createFertilizer,
  editFertilizerPrice,
  addToFertilizer,
  deleteFertilizerTransaction,
} = require('../controllers/fertilizer-controllers');

const router = express.Router();

router.get('/', getFertilizers);

router.post('/', createFertilizer);
router.post('/:_id', addToFertilizer);

router.delete('/:fertilizerId/:transactionId', deleteFertilizerTransaction);

router.patch('/', editFertilizerPrice);

module.exports = router;
