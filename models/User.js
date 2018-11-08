const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  password: {
    type: String,
    required: true,
    maxlength: 100
  },
  fullname: {
    type: String,
    required: true,
    maxlength: 100
  },
  role: {
    type: Number, // 1 - user, 2 - admin
    default: 1,
    min: 0
  },
  phone: {
    type: String,
    maxlength: 50
  }
});

UserSchema.plugin(timestamp);

const User = mongoose.model('User', UserSchema);
module.exports = User;
