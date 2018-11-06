const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');
const config = require('../config');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: Number,
    default: config.ORDER_STATUS_NEW
  },
  summary: {
    type: Number,
    default: 0
  },
  statusDescription: {
    type: String
  }
});

OrderSchema.plugin(timestamp);

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
