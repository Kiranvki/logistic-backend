require('babel-register');
require('babel-polyfill');

const socket = require('./src/middleware/socket');
const {
  join
} = require('path');

//require('dotenv').config({ path: join(__dirname, `${process.argv[2]}`) })
require('dotenv').config();

const cluster = require('cluster');
const numCPUs = require('os').cpus().length || 1;
const port = process.env.PORT || 3003;
const NODE_ENV = process.env.NODE_ENV || development;
const app = require('./app');
const chalk = require('chalk');
const securePort = process.env.securePort || 5003;
const https = require('https')
const fs = require('fs')
const {
  log,
  info,
  error
} = require('./src/utils').logging;
let workers = [];

// Graceful shutdown
process.on('SIGINT', () => {
  process.exit(1);
});

// uncaught promise rejection
process.on('unhandledRejection', (reason, p) => {

  console.log('reason', reason);
  error('Unhandled Rejection at: Promise ', p, reason)
}
);

// uncaught exception 
process.on('uncaughtException', (err, origin) => {
  console.error(err);
  error(
    process.stderr.fd,
    `Caught exception: ${err}\n` +
    `Exception origin: ${origin}`);
});


let server;

/**
 * Setup number of worker processes to share port which will be defined while setting up server
 */
const setupWorkerProcesses = () => {
  // to read number of cores on system
  let numCores = require('os').cpus().length;
  console.log('Master cluster setting up ' + numCores + ' workers');

  // iterate on number of cores need to be utilized by an application
  // current example will utilize all of them
  for (let i = 0; i < numCores; i++) {
    // creating workers and pushing reference in an array
    // these references can be used to receive messages from workers
    workers.push(cluster.fork());

    // to receive messages from worker process
    workers[i].on('message', function (message) {
     // console.log(message);
    });
  }

  // process is clustered on a core and process id is assigned
  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is listening');
  });

  // if any of the worker process dies then start a new one by simply forking another one
  cluster.on('exit', function (worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
    workers.push(cluster.fork());
    // to receive messages from worker process
    workers[workers.length - 1].on('message', function (message) {
    //  console.log(message);
    });
  });
};

// if cluster is required
if (parseInt(process.env.isClusterRequired) && cluster.isMaster) {
  setupWorkerProcesses();
  if (NODE_ENV == 'production') {
    const sslServer = https.createServer({
      key: fs.readFileSync('/etc/letsencrypt/live/api-dms.waycool.in/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/api-dms.waycool.in/fullchain.pem')
    }, app);
    sslServer.listen(securePort, () => { console.log(' Secure Server [ ✓ ] Running on port : ' + securePort) });
  } else if (NODE_ENV == 'staging') {
    const sslServer = https.createServer({
      key: fs.readFileSync('/etc/letsencrypt/live/dev.dms.waycool.in/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/dev.dms.waycool.in/fullchain.pem')
    }, app);
    
    sslServer.listen(securePort, () => {
      console.log(' Secure Server [ ✓ ] Running on port : ' + securePort) });
  }
} else {
  // checking the environment of the node 
  server = app.listen(port, () => {
    info(chalk.blue(' [ ✓ ] ') + `Application - Process ${process.pid} is listening to all incoming requests at: ${port} `);
  });
  server.setTimeout(1200000);
  socket.init(server);
}