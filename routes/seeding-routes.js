const express = require('express');
const {
  getSeedings,
  postSeeding,
  deleteSeeding,
} = require('../controllers/seeding-controllers');
const router = express.Router();

router.get('/', getSeedings);

router.post('/', postSeeding);

router.delete('/:id', deleteSeeding);

module.exports = router;
