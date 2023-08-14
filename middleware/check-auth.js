const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') next();

  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return next(new httpError('Authorization failed!', 401));
    }

    const decodedToken = jwt.verify(token, 'Super_Secret_Dont_Share');
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    console.log(err);
    throw new Error('Authorization Failed!');
  }
};
