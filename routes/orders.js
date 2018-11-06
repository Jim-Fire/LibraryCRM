const errors = require('restify-errors');
const jwt = require('jsonwebtoken');
const Book = require('../models/Book');
const Order = require('../models/Order');
const OrderBooks = require('../models/OrderBooks');
const User = require('../models/User');
const config = require('../config');
const strings = require('../strings');
const rjwt = require('restify-jwt-community');
const tokenService = require('../services/tokenService');
const booksManagement = require('../services/booksManagment');
const middleware = require('../middleware');

module.exports = server => {
  //add new order 
  server.post('/create-order', async (req, res, next) => {
    const { orderNumber, description, orderedBooks } = req.body;

    middleware.checkForJSON(req, res, next);

    if(!(orderNumber && orderedBooks)){
        return next(new errors.MissingParameterError('orderNumber && orderedBooks fields is required'));
    }

    const order = new Order({
        orderNumber: orderNumber,
        userId: req.jwtDecoded._id,
        description: description,
        status: config.ORDER_STATUS_NEW
    });

    try {
        const newOrder = await order.save();
        const orderId = newOrder._id;
        let summary = 0;

        for(let i=0; i<orderedBooks.length; i++){
            const book = await Book.findById(orderedBooks[i].bookId);
            const summarySameBooks = orderedBooks[i].count * book.price;
            summary+=summarySameBooks;
            const orderedBook = new OrderBooks({
                orderId: orderId,
                bookId: orderedBooks[i].bookId,
                count: orderedBooks[i].count
            });
            const newOrderedBook = await orderedBook.save();
        }
        await Order.findOneAndUpdate({_id: orderId},{summary});
        res.send(200);
        next();
    } catch (err) {
        return next(new errors.InternalError(err.message));
    }
    
  });

  //get orders  
  server.get('/get-orders', async (req, res, next) => {

    const getOrders = async (userId) =>{
        try {
            let orders;
            if(userId){
                orders = await Order.find({
                    userId
                });  
            }else{
                orders = await Order.find();
            }
           
            const getReceivedBooks = async (id) => {
                const getOrderedBooksArr = async (orderId) => {
                    const books = [];
                    const orderedBooks = await OrderBooks.find({ orderId });
                    for(let i=0; i< orderedBooks.length;i++){
                        books.push(orderedBooks[i].toJSON());
                    }
                    //console.log('orderedBooks',books);
                    return books;
                };
                const getBookObj = async(_id) => {
                    const book = await Book.findById(_id);
                    const bookObj = book.toJSON();
                    return bookObj;
                };
                const orderedBooksArr = await getOrderedBooksArr(id);
                const orderedBooksPromises =  orderedBooksArr.map( async (orderedBook)=>{
                    let bookObj = await getBookObj(orderedBook.bookId);
                    const newBook = {};

                    newBook.orderedBook = orderedBook;
                    newBook.bookInfo = bookObj;

                    return newBook;
                });
                const books = await Promise.all(orderedBooksPromises);
                //console.log('books',books);
                return books;
            };
            const ordersPromises = orders.map( async (order)=>{
                const receivedBooks = await getReceivedBooks(order._id);
                const newOrder = {};
                newOrder.orderDetails = order;
                newOrder.receivedBooks = receivedBooks;
                console.log('order',newOrder);
                return newOrder;
            });
            orders = await Promise.all(ordersPromises);
            return orders;

        } catch (err) {
            return next(new errors.InternalError(err.message));
        }
    }

    let orders;
    if(req.role==config.ROLE_ADMIN){
        orders = await getOrders();
        res.send(orders);
        next();
    }else{
        orders = await getOrders(req.jwtDecoded._id);
        res.send(orders);
        next();
    }
    
  });

  //confirn/reject order 
  server.post('/confirm-reject-order', async (req, res, next) => {
    middleware.checkForJSON(req, res, next);

    let { confirm, id, statusDescription } = req.body;
    let NEW_STATUS = confirm? config.ORDER_STATUS_SUCCESS: config.ORDER_STATUS_REJECTED;

    if(!(confirm && id)){
        return next(new errors.MissingParameterError('confirm, id fields is required'));
    }

    const order = await Order.findById(id);
    if(order.status === config.ORDER_STATUS_SUCCESS){
        return next(new errors.ForbiddenError(strings.ORDER_ALREADY_COMPLETED));
    }

    try {
        if(req.role==config.ROLE_ADMIN){
            if(confirm){
                const { confirmed, erorrMessage, decremented } = await booksManagement.decrementBooksByOrderId(req, res, next, id);
                if(!confirmed){
                    NEW_STATUS = config.ORDER_STATUS_REJECTED;
                    statusDescription = erorrMessage;
                }
                console.log('confirmed',confirmed);
                console.log('erorrMessage',erorrMessage);
                console.log('decremented',decremented);
            }
            const updated = await Order.findOneAndUpdate( {_id:id}, {
                status: NEW_STATUS,
                statusDescription: statusDescription
            });
            console.log('Updated order',updated);
            res.send({statusDescription,status:NEW_STATUS});
            next();
        }else{
            return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
        }
        next();
    } catch (err) {
        return next(new errors.InternalError(err.message));
    }
    
  });

  //delete order
  server.del('/delete-order/:id', async (req, res, next) => {
    
    middleware.checkForJSON(req, res, next);

    let id; 
    if(req.body){
        id = req.body.id
    }
    if(req.params && !id){
        id = req.params.id;
    }  
    if(!(id)){
        return next(new errors.MissingParameterError('id field is required'));
    }

    if(req.role==config.ROLE_ADMIN){
        try {
            const order = await Order.findOneAndRemove({
              _id: id
            });
            const orderBooks = await OrderBooks.deleteMany({
                orderId: id
            });
            res.send(204);
            next();
        } catch (err) {
            return next(
              new errors.ResourceNotFoundError(
                `There is no order with the id of ${req.params.id}`
              )
            );
        }
    }else{
        return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
    }
    
  });

};