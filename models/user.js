const mongoose = require('mongoose');

const Schema = mongoose.Schema;
// one way of solving global trays and global balance is to save them to the admin user as data
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  admin: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);
