const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/rate_category.model');
const mongoose = require('mongoose');
const _ = require('lodash');
const {
    error,
    info
} = require('../../../utils').logging;

//getting the model 
class rateCategoryController extends BaseController {
    //constructor
    constructor() {
        super();
        this.messageTypes = this.messageTypes.ratectegory;
    }

     //create a new entry
    post = async (req, res) => {

        try {
            //Initializing the field
            info('Rate category Controller !');

            //inserting data into the db
            let isInserted = await Model.create({
                ...req.body
            });
            // check if inserted 
            if (isInserted && !_.isEmpty(isInserted)) {
                return this.success(req, res, this.status.HTTP_OK, isInserted);
            } else return this.errors(req, res, this.status.HTTP_CONFLICT);

            // catch any runtime error 
        } catch (err) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }

    }


//       // internal function to create invoice and  picker_salesorder mapping
//   post = async (createObj) => {
//     try {
//       info('Create Invoice and picker_salesorder Mapping !');

//       // create a mapping for invoice and  picker_salesorder
//       return Model.create(createObj)
//         .then((res) => {
//           if (res && !_.isEmpty(res))
//             return {
//               success: true,
//               data: res
//             };
//           else return {
//             success: false
//           }
//         }).catch((err) => {
//           console.error(err);
//           return {
//             success: false,
//             error: err
//           }
//         });

//       // catch any runtime error 
//     } catch (err) {
//       error(err);
//       return {
//         success: false,
//         error: err
//       }
//     }
//   }

      // get details 
  getRateCategory = async (req, res) => {
    try {
      info('RateCategory GET DETAILS !');

      // inserting data into the db 
      // let transporter = await Model.findOne({
      let rateCategory = await Model.findById({

        _id: mongoose.Types.ObjectId(req.params.ratecategoryId)
      }).lean();

      // check if inserted 
      if (rateCategory && !_.isEmpty(rateCategory)) return this.success(req, res, this.status.HTTP_OK, rateCategory);
      else return this.errors(req, res, this.status.HTTP_CONFLICT);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
}


// exporting the modules 
module.exports = new rateCategoryController();
