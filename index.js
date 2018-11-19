const restify = require('restify');
const mongoose = require('mongoose');
const config = require('./config');
const rjwt = require('restify-jwt-community');
const tokenService = require('./services/tokenService');
const users = require('./routes/users');
const books = require('./routes/books');
const orders = require('./routes/orders');
const errors = require('restify-errors');
const User = require('./models/User');
const cors = require('cors');
const fs = require('fs');

const server = restify.createServer();

// Middleware
server.use(cors());
server.use(restify.plugins.bodyParser());
server.get('/manifest.json', restify.plugins.serveStatic({
  directory: './public',
  file: 'manifest.json'
}));
server.get('/static/js/*', restify.plugins.serveStatic({
  directory: './public'
}));
server.get('/static/css/*', restify.plugins.serveStatic({
  directory: './public'
}));
server.get('/static/media/*', restify.plugins.serveStatic({
  directory: './public'
}));

// Protect Routes
server.use(rjwt({ secret: config.JWT_SECRET }).unless({ 
  path: ['/auth','/register','/'] 
}));
server.use((req,res,next)=>{
  //console.log('__dirname:',__dirname);
  const token = tokenService.getToken(req);
  if(token){
    const jwtDecoded = tokenService.getDecoded(token);
    req.jwtDecoded = jwtDecoded;
  }
  next();
});
server.listen(config.PORT, () => {
  mongoose.set('useFindAndModify', false);
  mongoose.connect(
    config.MONGODB_URI,
    { useNewUrlParser: true }, 
    (err, info)=> { 
      if(err) throw new Error(err);
      console.log('db connected!');
    }
  );
});

const db = mongoose.connection;
//console.log('db',db);
db.on('error', err => console.log(err));

db.once('open', () => {
  
  //server.get('/', function(req, res, next) {
  //  fs.readFile(__dirname + '/public/index.html', function (err, data) {
  //      if (err) {
  //          next(err);
  //          return;
  //      }
  //      res.setHeader('Content-Type', 'text/html');
  //      res.writeHead(200);
  //      res.end(data);
  //      next();
  //  });
  //})
  server.get('/', restify.plugins.serveStatic({
    directory: './public',
    file: 'index.html'
  }));
  server.use( async (req,res,next)=>{
    try {
      if(req.jwtDecoded){
        const user = await User.findOne({
          _id: req.jwtDecoded._id
        });
        req.role =  user.role;
      }
      next();
    } catch (err) {
      return next(new errors.InternalError(err.message));
    }
  });
  orders(server);
  users(server);
  books(server);
  console.log(`Server started on port ${config.PORT}`);
});
