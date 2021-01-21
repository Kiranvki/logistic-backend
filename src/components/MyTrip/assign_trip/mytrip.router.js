const ctrl = require('./mytrip.controller');

// auth 
const { verifyAppToken  } = require('../../../hooks/app/Auth');

function tripsRoutes() {
    //open, closed
    return (open, closed) => {

      closed.route('/getSalesOrder').get(
        // verifyAppToken, 
        ctrl.getSalesOrders 
      );
    };    
};

module.exports = tripsRoutes();
