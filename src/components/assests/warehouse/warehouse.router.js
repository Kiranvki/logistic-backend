// user controller 
const ctrl = require('./warehouse.controller');
// custom joi validation
const {
  joiUpdate, // joi warehouse update
  joiCreate, // joi token validation
  joiGetList, // joi get list
} = require('./warehouse.validators');

// // custom hooks 
// const {
//   isWareHouseExists, // is email exist 
//   isValidWarehouseId, // is valid warehouse
// } = require('../../../hooks')

// auth 
const {
  verifyUserToken
} = require('../../../hooks/Auth');

// exporting the user routes 
function userRoutes() {
  return (open, closed) => {

    // // create
    // closed.route('/').post(
    //   [joiCreate], // joi validation
    //   // verifyUserToken, // jwt authentication
    //   isWareHouseExists, // check whether the agency exist  
    //   ctrl.create // controller function
    // );

    // // get agencies list 
    // closed.route('/list').get(
    //   [joiGetList], // joi validation
    //   verifyUserToken, // jwt authentication
    //   ctrl.getList // controller function
    // );

    // // update
    // closed.route('/:warehouseId').patch(
    //   [joiUpdate], // joi validation
    //   verifyUserToken, // jwt authentication
    //   isValidWarehouseId, // check whether the agency exist  
    //   ctrl.patch // controller function
    // );

    // // internal update
    // open.route('/update-locationIds').patch(
    //   ctrl.updateLocationIds // controller function
    // );
  };
}

module.exports = userRoutes();
