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
          res.send(201);
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
      res.send({ token });

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

    const update = async () => {
      try {
        const user = await User.findOneAndUpdate(
            { _id: id },
            req.body
        );
        res.send(200);
        next();
      } catch (err) {
        return next(
          new errors.ResourceNotFoundError(
            `There is no user with the id of ${id}`
          )
        );
      }
    }

    if(req.role==config.ROLE_ADMIN){
        if(typeof req.body.email != undefined || typeof req.body.password != undefined){
          await update();
        }else{
          return next(new errors.ForbiddenError(strings.NO_API_ACCESS + '. Email, password fields must be not written'));
        }  
    }else{
        await update();
    }


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
        res.send(200);
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
      res.send(user.toJSON());
      next();
    } catch (err) {
      return next(
        new errors.ResourceNotFoundError(err.message)
      );
    }
    

  });

};
