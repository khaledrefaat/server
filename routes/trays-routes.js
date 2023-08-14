const {
  postTraysData,
  getTraysData,
  deleteTraysData,
} = require('../controllers/tray');
const Express = require('express');
const router = Express.Router();

router.get('/', getTraysData);

router.post('/', postTraysData);

router.delete('/:id', deleteTraysData);

module.exports = router;
