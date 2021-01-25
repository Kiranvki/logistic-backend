// user controller 
const ctrl = require('./sales_order_sync.controller');
const multer = require('multer');
const multipartMiddleware = multer();
// custom joi validation
const {
} = require('./sales_order_sync.validators');

// hooks 
const {
} = require('../../../hooks');

// auth 
const {
} = require('../../../hooks/Auth');

// exporting the user routes 
function userRoutes() {
  //open, closed
  return (open, closed) => {
  };
}

module.exports = userRoutes();
