const express = require('express');
const {
  getDailySales,
  postDailySales,
  deleteDailySales,
} = require('../controllers/dailySales-controllers');

const router = express.Router();

router.get('/', getDailySales);
router.post('/', postDailySales);
router.delete('/', deleteDailySales);

module.exports = router;
