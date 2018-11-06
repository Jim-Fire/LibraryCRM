const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');

const OrderBooksSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  bookId: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 1
  }
});

OrderBooksSchema.plugin(timestamp);

const OrderBooks = mongoose.model('OrderBooks', OrderBooksSchema);
module.exports = OrderBooks;
