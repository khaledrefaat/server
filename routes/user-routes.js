const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const { signUp, login, getUsers } = require('../controllers/user-controllers');

router.post('/login', login);

router.post('/signup', [check('password').isLength({ min: 6 })], signUp);

module.exports = router;
