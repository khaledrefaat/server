const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { serverErrorMessage, sendResponse } = require('../lib/lib');

exports.login = async (req, res, next) => {
  const { password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({
      password,
    });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  if (existingUser.password !== password) {
    return sendResponse(res, 'اسم المستخدم او كلمة المرور غير صحيحة', 401);
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
    return serverErrorMessage(res);
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
    return sendResponse(res, validationErrorResult.array()[0].msg);
  }

  const { password, admin } = req.body;

  let exsistingUser;
  try {
    exsistingUser = await User.findOne({ password });
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
  }

  if (exsistingUser) {
    return sendResponse(res, 'اسم المستخدم موجود بالفعل');
  }

  const createdUser = new User({
    password,
    admin: !!admin,
  });
  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    return serverErrorMessage(res);
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
    return serverErrorMessage(res);
  }

  res.json({
    userId: createdUser._id,
    admin: createdUser.admin,
    token,
  });
};
