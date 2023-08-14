const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}).select('username');
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل الدخول، من فضلك حاول في وقت لاحق' });
  }

  if (!users) return res.json({ message: 'No users found' });

  res.json(users);
};

exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  let exsistingUser;
  try {
    exsistingUser = await User.findOne({ username });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل الدخول، من فضلك حاول في وقت لاحق' });
  }

  if (!exsistingUser) {
    return res.status(401).json({ msg: 'اسم المستخدم غير صحيح' });
  }

  if (exsistingUser.password !== password) {
    return res.status(401).json({ msg: 'كلمة السر غير صحيحة' });
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: exsistingUser._id,
        username: exsistingUser.username,
      },
      'Super_Secret_Dont_Share',
      { expiresIn: '3h' }
    );
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل الدخول، من فضلك حاول في وقت لاحق' });
  }
  res.json({
    userId: exsistingUser._id,
    username: exsistingUser.username,
    admin: exsistingUser.admin,
    token,
  });
};

exports.signUp = async (req, res, next) => {
  const validationErrorResult = validationResult(req);
  if (!validationErrorResult.isEmpty()) {
    return res.status(422).json({ msg: 'Invalid Inputs!' });
  }

  const { username, password, admin } = req.body;

  let exsistingUser;
  try {
    exsistingUser = await User.findOne({ username });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل حسابك، من فضلك حاول في وقت لاحق' });
  }

  if (exsistingUser) {
    return res.status(422).json({ msg: 'اسم المستخدم موجود بالفعل' });
  }

  const createdUser = new User({
    username,
    password,
    admin: admin ? true : false,
  });
  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل حسابك، من فضلك حاول في وقت لاحق' });
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser._id,
      },
      'Super_Secret_Dont_Share',
      { expiresIn: '3h' }
    );
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل حسابك، من فضلك حاول في وقت لاحق' });
  }

  res.json({
    userId: createdUser._id,
    username: createdUser.username,
    admin: createdUser.admin,
    token,
  });
};
