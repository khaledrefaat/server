const express = require('express');

const {
  getItems,
  createItem,
  deleteItem,
  deleteItemOrder,
  createItemOrder,
  editItemPrice,
  addToItem,
  deleteItemTransaction,
  confirmItemOrder,
} = require('../controllers/item-controllers');

const router = express.Router();

router.get('/', getItems);

router.post('/', createItem);
// router.post('/transaction/:id', createItemTransaction);
router.post('/order/:id', createItemOrder);

router.post('/:_id', addToItem);

router.patch('/', editItemPrice);

router.put('/order/:itemId/:orderId', confirmItemOrder);

router.delete('/:id', deleteItem);
// router.delete('/transaction/:itemId/:transactionId', deleteItemTransaction);
router.delete('/:itemId/:transactionId', deleteItemTransaction);

router.delete('/order/:itemId/:orderId', deleteItemOrder);

module.exports = router;
