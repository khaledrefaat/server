const express = require('express');
const {
  getSeedings,
  postSeeding,
  deleteSeeding,
  fixTotal,
} = require('../controllers/seeding-controllers');
const router = express.Router();

router.get('/', getSeedings);

router.post('/', postSeeding);

router.delete('/:id', deleteSeeding);

router.get('/fix', fixTotal);

module.exports = router;
