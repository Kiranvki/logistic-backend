require('dotenv/config');
const express = require('express');
const middlewares = require('./src/middleware');
const app = express();
const glob = require('glob');

// custom logger 
const appLogger = require('./src/utils/logger');
const cronLogger = require('./src/utils/cronLogger');

global.__basedir = __dirname;
app.use(appLogger.requestDetails(appLogger));
app.use(cronLogger.requestDetails(cronLogger));

// const authenticate = require('./utils/authenticate');
app.enable('trust proxy');
middlewares(app);
require('./src/config/db');

/* Router setup */

// onboard
const onBoardOpenRouter = express.Router(); // Open routes
const onBoardApiRouter = express.Router(); // Protected routes

// employee
const employeeOpenRouter = express.Router(); // Open routes
const employeeApiRouter = express.Router(); // Protected routes

// sales order
const salesOrderOpenRouter = express.Router(); // Open routes
const salesOrderApiRouter = express.Router(); // Protected routes

// app picker boy details 
const appPickerBoyOpenRouter = express.Router(); // Open routes
const appPickerBoyApiRouter = express.Router(); // Protected routes

//Transporter
const transporterMasterRouter = express.Router(); // Open routes
const transporterMasterAPIRouter = express.Router(); // Protected routes

//Rate Category
const rateCategoryRouter = express.Router(); // Open routes
const rateCategoryAPIRouter = express.Router(); // Protected routes


//Vehicle
const vehicleRouter = express.Router(); // Open routes
const vehicleAPIRouter = express.Router(); // Protected routes

/* Fetch router files and apply them to our routers */
glob('./src/components/picker_app/onBoard/*', null, (err, items) => {
  items.forEach(component => {
    if (require(component).routes) require(component).routes(
      onBoardOpenRouter,
      onBoardApiRouter,
    );
  });
});

/* Fetch router files and apply them to our routers */
glob('./src/components/picker_app/*', null, (err, items) => {
  items.forEach(component => {
    if (component != './src/components/picker_app/onBoard')
      if (require(component).routes) require(component).routes(
        appPickerBoyOpenRouter,
        appPickerBoyApiRouter,
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




// Admin Panel Routes
app.use('/v1/picker', onBoardOpenRouter);
app.use('/api/v1/picker', onBoardApiRouter);

// Employee Routes
app.use('/v1/employee', employeeOpenRouter);
app.use('/api/v1/employee', employeeApiRouter);

// SalesOrder Routes
app.use('/v1/salesorder', salesOrderOpenRouter);
app.use('/api/v1/salesorder', salesOrderApiRouter);

// app 
app.use('/app/v1/picker-app', appPickerBoyOpenRouter);
app.use('/app/api/v1/picker-app', appPickerBoyApiRouter);

//Transporter
app.use('/v1/transporter', transporterMasterRouter);
app.use('/api/v1/transporter', transporterMasterAPIRouter);

//Ratecategory
app.use('/v1/ratecategory', rateCategoryRouter);
app.use('/api/v1/ratecategory', rateCategoryAPIRouter);

//Vehicle
app.use('/v1/vehicle', vehicleRouter);
app.use('/api/v1/vehicle', vehicleAPIRouter);

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
