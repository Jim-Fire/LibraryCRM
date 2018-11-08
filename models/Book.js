const mongoose = require('mongoose');
const timestamp = require('mongoose-timestamp');

const BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  author: {
    type: String,
    required: true,
    maxlength: 100
  },
  pagesNumber: {
    type: Number,
    required: true,
    default: 0
  },
  category: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    maxlength: 1000
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  count:{
    type: Number,
    min: 0,
    default:1
  }
});

BookSchema.plugin(timestamp);

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;
