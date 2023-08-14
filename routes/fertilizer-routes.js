const express = require('express');

const {
  getFertilizers,
  createFertilizer,
  editFertilizerPrice,
} = require('../controllers/fertilizer-controllers');

const router = express.Router();

router.get('/', getFertilizers);

router.post('/', createFertilizer);
router.patch('/', editFertilizerPrice);

module.exports = router;
