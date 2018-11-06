const errors = require('restify-errors');

exports.checkForJSON = (req,res,next) => {
    if (!req.is('application/json')) {
        return next(
          new errors.InvalidContentError("Expects 'application/json'")
        );
    }
}

//exports. = (req,res,next) => {
//    
//}