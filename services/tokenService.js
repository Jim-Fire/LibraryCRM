const jwt = require('jsonwebtoken');

exports.getToken = (req) => {
  if(req.headers.authorization){
    return req.headers.authorization.substring(4);
  }
};

exports.getDecoded = (token) => {
  const jwtDecoded = jwt.decode(token);
  return jwtDecoded;
};