// exporting the modules 
module.exports = {
  verifyAppToken: require('./verifyAppToken'), // verify mobile app token
  verifySecurityAppToken: require('./verifySecurityAppToken'), // verify the security app token
  verifyDeliveryAppToken: require('./verifyDeliveryAppToken')
};