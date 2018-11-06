const Book = require('../models/Book');
const Order = require('../models/Order');
const OrderBooks = require('../models/OrderBooks');
const errors = require('restify-errors');
const strings = require('../strings');

exports.decrementBooksByOrderId = async (req,res,next,id) => {
  let confirmed = false, error = false, erorrMessage = strings.NO_COUNT_OF_BOOKS, decremented = false;
  const orderBooks = await OrderBooks.find({
    orderId: id
  });
  if(orderBooks.length){
    for (let i = 0; i < orderBooks.length; i++) {
      const book = await Book.findById(orderBooks[i].bookId);
      const countInLibrary = book.count;
      const countInOrder = orderBooks[i].count;

      if(countInOrder>countInLibrary){
        error= true;
        erorrMessage+=` [Name]: ${book.name} [Author]: ${book.author} [Count in library] ${book.count} ,`;
      }
    }
    if(!error){
      confirmed = true;
      for (let i = 0; i < orderBooks.length; i++) {
        const book = await Book.findById(orderBooks[i].bookId);
        const countInLibrary = book.count;
        const countInOrder = orderBooks[i].count;
        const updated = await Book.findOneAndUpdate({_id:book._id},{
          count: countInLibrary - countInOrder
        });
        decremented = true;
      }
    }
  }
  return { confirmed, erorrMessage, decremented };
};