const errors = require('restify-errors');
const jwt = require('jsonwebtoken');
const Book = require('../models/Book');
const Order = require('../models/Order');
const User = require('../models/User');
const config = require('../config');
const strings = require('../strings');
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
        status: config.ORDER_STATUS_NEW,
        orderedBooks: orderedBooks
    });

    try {
        let summary = 0;
        for(let i=0; i<orderedBooks.length; i++){
            const book = await Book.findById(orderedBooks[i].bookId);
            const summarySameBooks = orderedBooks[i].count * book.price;
            summary+=summarySameBooks;
        }
        order.summary = summary;
        const newOrder = await order.save();
        res.send({
            order: newOrder.toJSON(),
            message: strings.ORDER_CREATE_SUCCESS
        });
        next();
    } catch (err) {
        return next(new errors.InternalError(err.message));
    }
    
  });

  //get orders  
  server.get('/get-orders', async (req, res, next) => {

    const getOrders = async (userId) => {
        try {
            const appendBooks = async (orders)=>{
                const newOrdersPromises = orders.map( async (order)=>{
                    order = order.toObject();
                    let newOrderedBooksPromises = order.orderedBooks.map( async (book)=>{
                        let bookDetails = await Book.findById(book.bookId);
                        return {
                            ...book, 
                            bookDetails: bookDetails.toObject() 
                        }
                    });
                    const newOrderedBooks  = await Promise.all(newOrderedBooksPromises);
                    //console.log('newOrderedBooks',newOrderedBooks)
                    return {
                        ...order,
                        orderedBooks: newOrderedBooks
                    }
                });
                const  newOrders  = await Promise.all(newOrdersPromises);
                return newOrders;
            };
            let orders;
            if(userId){
                orders = await Order.find({
                    userId
                });  
            }else{
                orders = await Order.find({});
            }
            orders = await appendBooks(orders);
            return orders;
        } catch (err) {
            return next(new errors.InternalError(err.message));
        }
    }

    let orders;
    if(req.role==config.ROLE_ADMIN){
        orders = await getOrders();
    }else{
        orders = await getOrders(req.jwtDecoded._id);
    }
    //console.log('Resp orders',orders)
    res.send({
        orders
    });
    next();
  });

  //confirn/reject order 
  server.post('/confirm-reject-order', async (req, res, next) => {
    middleware.checkForJSON(req, res, next);

    let { confirm, id, statusDescription, summary } = req.body;
    let NEW_STATUS = confirm? config.ORDER_STATUS_SUCCESS: config.ORDER_STATUS_REJECTED;

    if(!(typeof confirm !==undefined && typeof id !==undefined)){
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
                let message = strings.ORDER_CONFIRM_SUCCESS;
                if(!confirmed){
                    NEW_STATUS = config.ORDER_STATUS_REJECTED;
                    statusDescription = erorrMessage;
                    message = strings.ORDER_REJECTED;
                }
                console.log('confirmed',confirmed);
                console.log('erorrMessage',erorrMessage);
                console.log('decremented',decremented);
                await Order.updateOne( {_id:id}, {
                    status: NEW_STATUS,
                    statusDescription
                },{new:true});
                const updated = await Order.findById(id);
                console.log('Confirmed/rejected order',updated);
                res.send({
                    order: updated,
                    message,
                });
                next();
            }else{
                NEW_STATUS = config.ORDER_STATUS_REJECTED;
                await Order.updateOne( {_id:id}, {
                    status: NEW_STATUS,
                    statusDescription
                },{new:true});
                const updated = await Order.findById(id);
                console.log('Confirmed/rejected order',updated);
                res.send({
                    order: updated,
                    message: strings.ORDER_REJECTED
                });
                next();
            }
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
    
    //middleware.checkForJSON(req, res, next);

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
            res.send({
                order,
                message: strings.ORDER_DELETE_SUCCESS
            });
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