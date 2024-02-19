const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  const { password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({
      password,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ msg: 'حدث خطأ اثناء تسجيل الدخول، من فضلك حاول في وقت لاحق' });
  }

  if (existingUser.password !== password) {
    return res.status(401).json({ msg: 'كلمة السر غير صحيحة' });
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser._id,
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
    userId: existingUser._id,
    admin: existingUser.admin,
    token,
  });
};

exports.signUp = async (req, res, next) => {
  const validationErrorResult = validationResult(req);
  if (!validationErrorResult.isEmpty()) {
    return res.status(422).json({ msg: 'Invalid Inputs!' });
  }

  const { password, admin } = req.body;

  let exsistingUser;
  try {
    exsistingUser = await User.findOne({ password });
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
    password,
    admin: !!admin,
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
    admin: createdUser.admin,
    token,
  });
};
