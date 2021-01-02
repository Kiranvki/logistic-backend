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
if (NODE_ENV == 'staging') {

  const sslServer = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/dev.dms.waycool.in/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/dev.dms.waycool.in/fullchain.pem')
  }, app);


  console.log('securePort', securePort);
  sslServer.listen(securePort, () => {
    console.log(chalk.blue(` Secure Server [ ✓ ] Running on port : ' + ${securePort}`))
  });
}

// checking the environment of the node 
server = app.listen(port, () => {
  info(chalk.blue(' [ ✓ ] ') + `Application - Process ${process.pid} is listening to all incoming requests at: ${port} `);
});
server.setTimeout(1200000);

socket.init(server);
