module.exports = {
  apps: [{
    name: 'API DMS-V2 USER PORT:3000',
    script: './server.js',
    watch: false,
    env: {
      'watch': false,
      'PORT': 3000,
      'NODE_ENV': 'development',
      'DB': 'mongodb://localhost:27017/dms-user',
      'secret': '975f056b4552226360a6f808c1a1ff57e4ee07d9347479e8afd1d9ed8147eebf6b9717c262727b286555e2a3b427d33bb88766d150956c7778e06f28a08f5e1c573e6d15831c6108c6567822ae353355ce7b00a8c5547d6d7340a8cf9643f20a3d3affa8f3100d1e9c600e1257a1f7ccd41d9e064efaca490c955e708fb901e3bff58839b251b6d684acd0d788419cc74cface45ba58cca6a360ed87ff447bd0c49204cfaad3f64e3b4845decd05cd51c5ef093498e8425bb978d6530e13067d43114b4d0561a9cd73c654f5123a35df747b19a64a5bc30efa59091cb94fbcd58d4dac4cec261763f2a3c59e71c72d9e74366b2ad0e52a97c56083aa0a41cbfe',
      'frontEndHost': 'http://uat.apps.waycool.in:',
      'frontEndPort': '3032/',
      'frontEndUrlForgetPassword': 'user/profile/password/reset',
      'smtp_email': 'info@waycool.in',
      'smtp_password': 'WayCoolSunnyBeeMarket',
      'adminBaseUrl': 'http://localhost:3001',
      'adminGetBrandDetails': '/internal/v1/brands/manager/',
      'brandFrontEndHost': 'http://uat.apps.waycool.in:',
      'brandFrontEndPort': '3033/'
    },
    env_staging: {
      'watch': false,
      'PORT': 3000,
      'NODE_ENV': 'development',
      'DB': 'mongodb://localhost:27017/dms-user',
      'secret': '975f056b4552226360a6f808c1a1ff57e4ee07d9347479e8afd1d9ed8147eebf6b9717c262727b286555e2a3b427d33bb88766d150956c7778e06f28a08f5e1c573e6d15831c6108c6567822ae353355ce7b00a8c5547d6d7340a8cf9643f20a3d3affa8f3100d1e9c600e1257a1f7ccd41d9e064efaca490c955e708fb901e3bff58839b251b6d684acd0d788419cc74cface45ba58cca6a360ed87ff447bd0c49204cfaad3f64e3b4845decd05cd51c5ef093498e8425bb978d6530e13067d43114b4d0561a9cd73c654f5123a35df747b19a64a5bc30efa59091cb94fbcd58d4dac4cec261763f2a3c59e71c72d9e74366b2ad0e52a97c56083aa0a41cbfe',
      'frontEndHost': 'http://uat.apps.waycool.in:',
      'frontEndPort': '3032/',
      'frontEndUrlForgetPassword': 'user/profile/password/reset',
      'smtp_email': 'info@waycool.in',
      'smtp_password': 'WayCoolSunnyBeeMarket',
      'adminBaseUrl': 'http://localhost:3001',
      'adminGetBrandDetails': '/internal/v1/brands/manager/',
      'brandFrontEndHost': 'http://uat.apps.waycool.in:',
      'brandFrontEndPort': '3033/'
    },
    env_production: {
      'watch': false,
      'PORT': 3000,
      'NODE_ENV': 'development',
      'DB': 'mongodb://localhost:27017/dms-user',
      'secret': '975f056b4552226360a6f808c1a1ff57e4ee07d9347479e8afd1d9ed8147eebf6b9717c262727b286555e2a3b427d33bb88766d150956c7778e06f28a08f5e1c573e6d15831c6108c6567822ae353355ce7b00a8c5547d6d7340a8cf9643f20a3d3affa8f3100d1e9c600e1257a1f7ccd41d9e064efaca490c955e708fb901e3bff58839b251b6d684acd0d788419cc74cface45ba58cca6a360ed87ff447bd0c49204cfaad3f64e3b4845decd05cd51c5ef093498e8425bb978d6530e13067d43114b4d0561a9cd73c654f5123a35df747b19a64a5bc30efa59091cb94fbcd58d4dac4cec261763f2a3c59e71c72d9e74366b2ad0e52a97c56083aa0a41cbfe',
      'frontEndHost': 'http://uat.apps.waycool.in:',
      'frontEndPort': '3032/',
      'frontEndUrlForgetPassword': 'user/profile/password/reset',
      'smtp_email': 'info@waycool.in',
      'smtp_password': 'WayCoolSunnyBeeMarket',
      'adminBaseUrl': 'http://localhost:3001',
      'adminGetBrandDetails': '/internal/v1/brands/manager/',
      'brandFrontEndHost': 'http://uat.apps.waycool.in:',
      'brandFrontEndPort': '3033/'
    }
  }]
};
