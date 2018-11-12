const errors = require('restify-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../auth');
const config = require('../config');
const middleware = require('../middleware');
const strings = require('../strings');

module.exports = server => {
  // Register User
  server.post('/register', async (req, res, next) => {

    middleware.checkForJSON(req, res, next);

    const { email, password, fullname, phone } = req.body;

    const exist = await User.findOne({ email });

    if(exist){
      return next(new errors.InternalError('User already exsist!'))
    }
    
    const user = new User({
      email,
      password,
      fullname,
      phone
    });
    
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, async (err, hash) => {
        // Hash Password
        user.password = hash;
        // Save User
        try {
          const newUser = await user.save();
          res.send({
            message: strings.SIGN_UP_SUCCESS,
            user: newUser.toJSON()
          });
          next();
        } catch (err) {
          console.log('save error:',err)
          return next(new errors.InternalError(err.message));
        }
      });
    });
  });

  // Auth User
  server.post('/auth', async (req, res, next) => {

    middleware.checkForJSON(req, res, next);

    const { email, password } = req.body;

    try {
      // Authenticate User
      const user = await auth.authenticate(email, password);
      
      // Create JWT
      const token = jwt.sign({_id: user.toJSON()._id}, config.JWT_SECRET, {
        expiresIn: '1d'
      });

      //const { iat, exp } = jwt.decode(token);
      //console.log('decode token',jwt.decode(token));
      // Respond with token
      res.send({ 
        token,
        user,
        message: strings.SIGN_IN_SUCCESS
      });

      next();
    } catch (err) {
      // User unauthorized
      return next(new errors.UnauthorizedError(err));
    }
  });

  // Update User
  server.put('/update-user/:id', async (req, res, next) => {

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
    const { email, password, fullname, role, phone } = req.body;
    
    const update = async () => {
      try {
        let _password = password;
        const save = async (heshedPass) => {
          return  await User.findOneAndUpdate(
            { _id: id },
            {
              email,
              heshedPass,
              fullname,
              role,
              phone
            },
            { new: true } 
          );
        }
        
        if(_password){
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, async (err, hash) => {
              // Hash Password
              _password = hash;
              // Save Use
              const user = await save(_password);
              res.send(user);
              next();
            });
          });
        }else{
          const user = await save();
          res.send({
            user,
            message: strings.USER_UPDATE_SUCCESS
          });
          next();
        }
      } catch (err) {
        return next(
          new errors.ResourceNotFoundError(
            `There is no user with the id of ${id}`
          )
        );
      }
    }

    if(req.role==config.ROLE_ADMIN){
        if(typeof email === undefined && typeof password === undefined){
          await update();
        }else{
          return next(new errors.ForbiddenError(strings.NO_API_ACCESS + '. Email, password fields must be not written'));
        }  
    }else{
        await update();
    }
    next();
  });

  // Delete User
  server.del('/delete-user/:id', async (req, res, next) => {

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
        const user = await User.findOneAndRemove({ _id: id });
        res.send({
          user,
          message: strings.USER_DELETE_SUCCESS
        });
        next();
      } catch (err) {
        return next(
          new errors.ResourceNotFoundError(
            `There is no user with the id of ${id}`
          )
        );
      }
    }else{
      return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
    }

  });

  // Get User
  server.get('/get-user', async (req, res, next) => {
    const _id = req.jwtDecoded._id;

    try {
      const user = await User.findOne({ _id });
      res.send({ 
        user: user.toJSON() 
      });
      next();
    } catch (err) {
      return next(
        new errors.ResourceNotFoundError(err.message)
      );
    }

  });

  // Get users
  server.get('/get-users', async (req, res, next) => {

    if(req.role==config.ROLE_ADMIN){
      try {
        const users = await User.find();
        res.send({
          users: users.toJSON()
        });
        next();
      } catch (err) {
        return next(
          new errors.ResourceNotFoundError(err.message)
        );
      }
    }else{
      return next(new errors.ForbiddenError(strings.NO_API_ACCESS));
    }

  });

};
