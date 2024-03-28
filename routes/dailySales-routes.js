const express = require('express');
const {
  getDailySales,
  getDailySalesSearch,
} = require('../controllers/dailySales-controllers');

const router = express.Router();

router.get('/:page', getDailySales);
router.get('/search/:term', getDailySalesSearch);

module.exports = router;
