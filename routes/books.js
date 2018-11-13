const errors = require('restify-errors');
const jwt = require('jsonwebtoken');
const Book = require('../models/Book');
const User = require('../models/User');
const config = require('../config');
const strings = require('../strings');
const rjwt = require('restify-jwt-community');
const middleware = require('../middleware');

module.exports = server => {
  //add new book  
  server.post('/add-book', async (req, res, next) => {
    const { name, author, pagesNumber, category, description, price, count } = req.body;

    middleware.checkForJSON(req, res, next);

    if(!(name && author && pagesNumber && category)){
        return next(new errors.MissingParameterError('name, author, pagesNumber, category, price fields is required'));
    }

    if(req.role==config.ROLE_ADMIN){
        const book = new Book({
           name,
           author,
           pagesNumber,
           category,
           description,
           price,
           count 
        });

        try {
            const newBook = await book.save();
            res.send({
                book: newBook.toJSON(),
                message: strings.BOOK_ADD_SUCCESS
            });
            next();
        } catch (err) {
            return next(new errors.InternalError(err.message));
        }
    }else{
        return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
    }
  });

  //delete book  
  server.del('/delete-book/:id', async (req, res, next) => {

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
            const book = await Book.findOneAndRemove({
              _id: id
            });
            res.send({
                book,
                message: strings.BOOK_DELETE_SUCCESS
            });
            next();
        } catch (err) {
            return next(
              new errors.ResourceNotFoundError(
                `There is no book with the id of ${req.params.id}`
              )
            );
        }
    }else{
        return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
    }
  });

  //get books
  server.get('/get-books', async (req, res, next) => {
   
    try {
        const books = await Book.find();
        res.send({
            books
        });
        next();
    } catch (err) {
        return next(
          new errors.InternalError(err.message)
        );
    }
    
  });

  //get book
  server.get('/get-book/:id', async (req, res, next) => {

    middleware.checkForJSON(req, res, next);

    let id; 
    if(req.body){
        id = req.body.id
    }
    if(req.params && !id){
        id = req.params.id;
    }  
    if(!id){
        return next(new errors.MissingParameterError('id field is required'));
    }

    try {
        const book = await Book.findOne({
          _id: id
        });
        res.send(book);
        next();
    } catch (err) {
        return next(
          new errors.ResourceNotFoundError(
            `There is no book with the id of ${req.params.id}`
          )
        );
    }
    
  });

  //update book
  server.put('/update-book/:id', async (req, res, next) => {

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
    const { name, author, pagesNumber, category, description, price, count } = req.body;

    if(req.role==config.ROLE_ADMIN){
        try {
            const book = await Book.findOneAndUpdate(
                { _id: id },
                {
                    name,
                    author,
                    pagesNumber,
                    category,
                    description,
                    price, 
                    count
                },
                { new: true }
            );
            res.send({
                book,
                message: strings.BOOK_UPDATE_SUCCESS
            });
            next();
        } catch (err) {
            return next(
              new errors.ResourceNotFoundError(
                `There is no book with the id of ${req.params.id}`
              )
            );
        }
    }else{
        return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
    }
    
  });

  //search book

};