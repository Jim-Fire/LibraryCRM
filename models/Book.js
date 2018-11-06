const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');

const BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  pagesNumber: {
    type: Number,
    required: true
  },
  category: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    default: 0
  },
  count:{
    type: Number,
    default:1
  }
});

BookSchema.plugin(timestamp);

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;
