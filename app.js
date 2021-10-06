require('dotenv/config');
const express = require('express');
const middlewares = require('./src/middleware');
const app = express();
const glob = require('glob');
const cron = require('./src/utils/cron');

// running the beat plan publish cron
cron();
// custom logger 
const appLogger = require('./src/utils/logger');
const cronLogger = require('./src/utils/cronLogger');

global.__basedir = __dirname;
app.use(appLogger.requestDetails(appLogger));
app.use(cronLogger.requestDetails(cronLogger));
app.use(express.static(__dirname + '/public/privacy_policy'));

// const authenticate = require('./utils/authenticate');
app.enable('trust proxy');
middlewares(app);
require('./src/config/db');

/* Router setup */

// onboard picker boy
const onBoardPickerOpenRouter = express.Router(); // Open routes 
const onBoardPickerApiRouter = express.Router(); // Protected routes

// internal sti orderpicker boy
const internalPOPickerOpenRouter = express.Router(); // Open routes 
const internalPOPickerApiRouter = express.Router(); // Protected routes
// external sti order picker boy
const externalPOPickerOpenRouter = express.Router(); // Open routes 
const externalPOPickerApiRouter = express.Router(); // Protected routes

const deliveryExecutiveOpenRouter = express.Router(); // Open routes 
const deliveryExecutiveApiRouter = express.Router(); // protected routes 

const onBoardSecurityOpenRouter = express.Router(); // Open routes 
const onBoardSecurityApiRouter = express.Router(); // Protected routes

// onboard Delivery Executive
const onBoardDeliveryOpenRouter = express.Router(); // Open routes 
const onBoardDeliveryApiRouter = express.Router(); // Protected routes

// employee
const employeeOpenRouter = express.Router(); // Open routes
const employeeApiRouter = express.Router(); // Protected routes

// agency 
const agencyOpenRouter = express.Router(); // Open routes
const agencyApiRouter = express.Router(); // Protected routes

// sales order
const salesOrderOpenRouter = express.Router(); // Open routes
const salesOrderApiRouter = express.Router(); // Protected routes

// app picker boy details 
const appPickerBoyOpenRouter = express.Router(); // Open routes
const appPickerBoyApiRouter = express.Router(); // Protected routes

// app Security Guard details 
const appSecurityOpenRouter = express.Router(); // Open routes
const appSecurityApiRouter = express.Router(); // Protected routes

// app delivery details 
const appDeliveryOpenRouter = express.Router(); // Open routes
const appDeliveryApiRouter = express.Router(); // Protected routes

//Transporter
const transporterMasterRouter = express.Router(); // Open routes
const transporterMasterAPIRouter = express.Router(); // Protected routes

//Rate Category
const rateCategoryRouter = express.Router(); // Open routes
const rateCategoryAPIRouter = express.Router(); // Protected routes

//Vehicle
const vehicleRouter = express.Router(); // Open routes
const vehicleAPIRouter = express.Router(); // Protected routes

//MyTrips
const tripRouter = express.Router(); // Open routes
const tripAPIRouter = express.Router(); // Protected routes

// file handler 
const fileOpenRouter = express.Router(); // Open routes
const fileApiRouter = express.Router(); // Protected routes
const fileAppApiRouter = express.Router(); // Protected routes
const fileAppOpenRouter = express.Router(); // Open routes

// assests
const assestsOpenRouter = express.Router(); // Open routes
const assestsApiRouter = express.Router(); // Protected routes

/* Fetch router files and apply them to our routers */
glob('./src/components/picker_app/onBoard/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      onBoardPickerOpenRouter,
      onBoardPickerApiRouter,
    );
  });
});
/* Fetch router files and apply them to our routers */
glob('./src/components/picker_app/external_purchase_order/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      externalPOPickerOpenRouter,
      externalPOPickerApiRouter,
    );
  });
});
/* Fetch router files and apply them to our routers */
glob('./src/components/picker_app/internal_stock_transfer/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      internalPOPickerOpenRouter,
      internalPOPickerApiRouter,
    );
  });
});
/* Fetch router files and apply them to our routers */
glob('./src/components/security_guard_app/onBoard/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      onBoardSecurityOpenRouter,
      onBoardSecurityApiRouter,
    );
  });
}); 

/* Fetch router files and apply them to our routers */
glob('./src/components/delivery_app/onBoard/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      onBoardDeliveryOpenRouter,
      onBoardDeliveryApiRouter,
    );
  });
});


/* Fetch router files and apply them to our routers */
glob('./src/components/delivery_app/*', null, (err, items) => {
  items.forEach(component => {
    if (component != './src/components/delivery_app/onBoard')
    if (require(component).routes) require(component).routes(
      deliveryExecutiveOpenRouter,
      deliveryExecutiveApiRouter,
    );
  });
});


/* Fetch router files and apply them to our routers */
glob('./src/components/picker_app/*', null, (err, items) => {
  items.forEach(component => {
    if (!(component == './src/components/picker_app/onBoard' || component == './src/components/picker_app/external_purchase_order'|| component == './src/components/picker_app/internal_stock_transfer'))
if (require(component).routes) require(component).routes(
        appPickerBoyOpenRouter,
        appPickerBoyApiRouter,
      );
  });
});





/* Fetch router files and apply them to our routers */
glob('./src/components/security_guard_app/*', null, (err, items) => {
  items.forEach(component => {
    if (component != './src/components/security_guard_app/onBoard')
      if (require(component).routes) require(component).routes(
        appSecurityOpenRouter,
        appSecurityApiRouter,
      );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/delivery_app/*', null, (err, items) => {
  items.forEach(component => {
    if (component != './src/components/delivery_app/onBoard')
      if (require(component).routes) require(component).routes(
        appDeliveryOpenRouter,
        appDeliveryApiRouter,
      );
  });
});


/* Fetch router files and apply them to our routers */
glob('./src/components/employee/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      employeeOpenRouter,
      employeeApiRouter,
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/agency/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      agencyOpenRouter,
      agencyApiRouter,
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/sales_order/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      salesOrderOpenRouter,
      salesOrderApiRouter,
    );
  });
});


/* Fetch router files and apply them to our routers */
glob('./src/components/transporter/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      transporterMasterRouter,
      transporterMasterAPIRouter,
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/rate_category/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      rateCategoryRouter,
      rateCategoryAPIRouter,
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/vehicle/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      vehicleRouter,
      vehicleAPIRouter,
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/MyTrip/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      tripRouter,
      tripAPIRouter
    );
  });
});
/* Fetch router files and apply them to our routers */
glob('./src/components/file_handler/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      fileOpenRouter,
      fileApiRouter,
      fileAppOpenRouter,
      fileAppApiRouter
    );
  });
});
/* Fetch router files and apply them to our routers */
glob('./src/components/file_handler/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      fileOpenRouter,
      fileApiRouter,
      fileAppOpenRouter,
      fileAppApiRouter
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/assests/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      assestsOpenRouter,
      assestsApiRouter,
    );
  });
});

// Picker Boy Routes
app.use('/v1/picker', onBoardPickerOpenRouter);
app.use('/api/v1/picker', onBoardPickerApiRouter);
// Picker Boy external_purchase_order Routes
app.use('/v1/picker-app/purchaseOrder', externalPOPickerOpenRouter);
app.use('/app/api/v1/picker-app/purchaseOrder', externalPOPickerApiRouter);
// Picker Boy internal_purchase_order Routes
app.use('/v1/picker-app/stock-transfer-in', internalPOPickerOpenRouter);
app.use('/app/api/v1/picker-app/stock-transfer-in', internalPOPickerApiRouter);
// Security Guard Routes
app.use('/v1/security', onBoardSecurityOpenRouter);
app.use('/api/v1/security', onBoardSecurityApiRouter);

// Delivery Executive Routes
app.use('/v1/delivery', onBoardDeliveryOpenRouter);
app.use('/api/v1/delivery', onBoardDeliveryApiRouter);

// Employee Routes
app.use('/v1/employee', employeeOpenRouter);
app.use('/api/v1/employee', employeeApiRouter);

// agency Routes
app.use('/v1/agency', agencyOpenRouter);
app.use('/api/v1/agency', agencyApiRouter);

// SalesOrder Routes
app.use('/v1/salesorder', salesOrderOpenRouter);
app.use('/api/v1/salesorder', salesOrderApiRouter);

// app 
app.use('/app/v1/picker-app', appPickerBoyOpenRouter);
app.use('/app/api/v1/picker-app', appPickerBoyApiRouter);

// app 
app.use('/app/v1/security-app', appSecurityOpenRouter);
app.use('/app/api/v1/security-app', appSecurityApiRouter);

// app 
app.use('/app/v1/delivery-app', appDeliveryOpenRouter);
app.use('/app/api/v1/delivery-app', appDeliveryApiRouter);

//Transporter
app.use('/v1/transporter', transporterMasterRouter);
app.use('/api/v1/transporter', transporterMasterAPIRouter);

//Ratecategory
app.use('/v1/rate-category', rateCategoryRouter);
app.use('/api/v1/rate-category', rateCategoryAPIRouter);

//Vehicle
app.use('/v1/vehicle', vehicleRouter);
app.use('/api/v1/vehicle', vehicleAPIRouter);

// Delivery executive

app.use('/v1/delivery-executive', deliveryExecutiveOpenRouter);
app.use('/api/v1/delivery-executive', deliveryExecutiveApiRouter);

//My Trip 
app.use('/v1/trip', tripRouter)
app.use('/api/v1/trip', tripAPIRouter);

// file handler 
app.use('/v1/file', fileOpenRouter);
app.use('/api/v1/file', fileApiRouter);
app.use('/app/api/v1/file', fileAppApiRouter);
app.use('/app/v1/file', fileAppOpenRouter);

// Assests Routes
app.use('/v1/assests', assestsOpenRouter);
app.use('/api/v1/assests', assestsApiRouter);


// handle 404
app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  return res.status(404).json({
    status: 404,
    message: 'API NOT FOUND! Please check the endpoint and the HTTP request type! or contact at prasun.jaiswal@waycool.in',
    data: {
      url: req.url
    }
  });
});

// exporting the app
module.exports = app;
