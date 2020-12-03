const Model = require('./models/basic_config.model');
const {
  error,
  info
} = require('../../utils').logging;
const _ = require('lodash');
// getting the model 
class basicConfigController {

  // get the min salt round for hashing
  GET_MIN_SALT_ROUND_FOR_HASHING = () => {
    try {
      info('GET_MIN_SALT_ROUND_FOR_HASHING');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'MIN_SALT_ROUND_FOR_HASHING'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 10 : parseInt(res[0].configValue)
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get the token expiry time 
  GET_TOKEN_EXPIRY_TIME_IN_MIN = () => {
    try {
      info('GET_TOKEN_EXPIRY_TIME_IN_MIN');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'TOKEN_EXPIRY_TIME_IN_MIN'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 40 : parseInt(res[0].configValue)
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // cryptr secret key
  GET_CRYPT_SECRET_KEY = () => {
    try {
      info('GET_CRYPT_SECRET_KEY');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'CRYPT_SECRET_KEY'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: res[0].configValue ? '95445fg415df4222dfd22' : res[0].configValue
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // forget password expiry 
  GET_FORGET_PASSWORD_EXPIRY_IN_MIN = () => {
    try {
      info('GET_FORGET_PASSWORD_EXPIRY_IN_MIN');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'FORGET_PASSWORD_EXPIRY_IN_MIN'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 60 : parseInt(res[0].configValue)
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // pagination 
  GET_PAGINATION_LIMIT = () => {
    try {
      info('GET_PAGINATION_LIMIT');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'PAGINATION_LIMIT'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 60 : parseInt(res[0].configValue)
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get max customer list sync waiting time 
  GET_MAX_CUSTOMER_LIST_SYNC_WAITING_TIME_IN_MINS = () => {
    try {
      info('GET_MAX_CUSTOMER_LIST_SYNC_WAITING_TIME_IN_MINS');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'MAX_CUSTOMER_LIST_SYNC_WAITING_TIME_IN_MINS'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 20 : parseInt(res[0].configValue)
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get the max image file size to upload
  GET_MAX_STOP_IMAGE_FILE_SIZE_IN_MB = () => {
    try {
      info('GET_MAX_STOP_IMAGE_FILE_SIZE_IN_MB');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'MAX_STOP_IMAGE_FILE_SIZE_IN_MB'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 1 : parseInt(res[0].configValue)
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get otp expiry time in min
  GET_OTP_EXPIRY_TIME_IN_MIN = async () => {
    try {
      info('GET_OTP_EXPIRY_TIME_IN_MIN');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'OTP_EXPIRY_TIME_IN_MIN'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: isNaN(res[0].configValue) ? 40 : parseInt(res[0].configValue)
            };
          else return {
            success: true,
            data: 40
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get the otp template id 
  GET_OTP_TEMPLATE_ID = () => {
    try {
      info('GET_OTP_TEMPLATE_ID');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'OTP_TEMPLATE_ID'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: res[0].configValue ? res[0].configValue : '5f2417bed6fc05491a428f68'
            };
          else return {
            success: true,
            data: '5f2417bed6fc05491a428f68'
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get the freeze time to stop publish of beat plan for a day
  GET_FREEZE_TIME_TO_STOP_PLAN_PUBLISH_FOR_TODAY = () => {
    try {
      info('GET_FREEZE_TIME_TO_STOP_PLAN_PUBLISH_FOR_TODAY');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'FREEZE_TIME_TO_STOP_PLAN_PUBLISH_FOR_TODAY'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: res[0].configValue ? res[0].configValue : '10:20'
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }

  // get the last permitted checked in time 
  GET_LAST_PERMITTED_CHECK_IN_TIME = () => {
    try {
      info('GET_LAST_PERMITTED_CHECK_IN_TIME');

      // creating the data inside the database 
      return Model.aggregate([{
        $match: {
          'configName': 'LAST_PERMITTED_CHECK_IN_TIME'
        }
      }]).allowDiskUse(true)
        .then((res) => {
          if (res && res.length)
            return {
              success: true,
              data: res[0].configValue ? res[0].configValue : '10:20'
            };
          else return {
            success: false
          }
        });

      // catch any runtime error 
    } catch (e) {
      error(e);
      return {
        success: false,
        error: e
      }
    }
  }
}

// exporting the modules 
module.exports = new basicConfigController();
