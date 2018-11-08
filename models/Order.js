const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');
const config = require('../config');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: true,
    min: 0
  },
  userId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: Number,
    default: config.ORDER_STATUS_NEW
  },
  summary: {
    type: Number,
    default: 0,
    min: 0
  },
  statusDescription: {
    type: String,
    maxlength: 500
  },
  orderedBooks: [{
    bookId: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  }]
});

OrderSchema.plugin(timestamp);

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
