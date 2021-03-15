const BaseController = require('../../baseController');
const Model = require('./models/vehicle_model_master.model');
const rateCategoryModel = require('../../rate_category/rate_category/models/rate_category.model');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const transporterModel = require('../../transporter/transporter/models/transporter.model')
const vehicleModelTransporterRCMappingModel = require('../../transporter/transporter-model-rate-mapping/models/transporter-model-rate-mapping')
const vehicleTransporterModelMappingModel = require('../../vehicle/vehicle_transporter_rc_mapping/models/vehicle_transporter_rc_mapping.model')
const {
    error,
    info
  } = require('../../../utils').logging;

const mongoose = require('mongoose');

// import  * as VehicleModelMasterService from './vehicle_model_master.service'

class VehicleModel extends BaseController{
     constructor() {
      super();
      this.messageTypes = this.messageTypes.vehicleModel;

       }
    // create a new entry
  createVehicleModel = async (req, res) => {
    try {
      const data = req.body;
      const savedVehicleModel =  await Model.create(data);
       if(savedVehicleModel){
        return this.success(req, res, this.status.HTTP_OK, savedVehicleModel, this.messageTypes.vehicleModelCreated);
       }
      return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.vehicleNotCreated);

      } catch (err) {
        error(err);
       return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
      }
  }

  getVehicleModel = async (req, res) => {
    let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; });
      let skip = parseInt(page - 1) * pageSize;

    try {
      let totalVehicleModel = await Model.countDocuments();
       const vehicleModel =   await Model.find().limit(pageSize).skip(skip);
     const   pageMeta={
        skip: parseInt(skip),
        pageSize: pageSize,
        total: totalVehicleModel
      }
       if(vehicleModel){
        return this.success(req, res, this.status.HTTP_OK,{vehicleModel,pageMeta}, this.messageTypes.vehicleModelFound);
       }
      return this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.vehicleModelNotFound);
      } catch (err) {
        error(err);
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
      }
  }

  getMinifiedVehicleModelAndRC = async (req, res) => {
    try {
        const {minifiedVehicleModel,menifiedRateCategory} =   await this.fetchModelDetails();
        return this.success(req, res, this.status.HTTP_OK, {minifiedVehicleModel,menifiedRateCategory}, this.messageTypes.vehicleModelFound);
      } catch (err) {
        error(err);
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
      }
  }
  

  fetchModelDetails = async ()=>{
     const modelData = await Promise.all(
       [
          rateCategoryModel.find(),
          Model.find()
       ]
     )
     const rateCategory = modelData[0];
     const vehicleModelData = modelData[1];
     const menifiedRateCategory = rateCategory.map(data=>{ return {
      name: data.rateCategoryDetails.rateCategoryName,
      id: data._id,
    }})
     const minifiedVehicleModel = vehicleModelData.map(data=>{ return {
       name: data.name,
       id: data._id,
     }})
    return {minifiedVehicleModel,menifiedRateCategory}
  }


  getVehicleModelByTransportId = async (req, res) => {
    try {
      const vehicleModelData = await transporterModel.aggregate([
         {
        $match: {
        _id: mongoose.Types.ObjectId(req.params.transporterId),     
       },
      },
      {
        $lookup: {
          from: 'transportervehiclemodelrcmappings',
          let: {
            'id': '$_id'
          },
          pipeline: [
            {
              $match: {
                // 'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$transporterId', '$$id']
                }
              }
            }, {
              $project: {
                '_id': 1,
                'status': 1,
                'isDeleted': 1,
                'vehicleModelId': 1,
                'transporterId': 1,
                'rateCategoryId': 1
              }
            },
            {
              $lookup: {
                from: 'vehiclemodelmasters',
                localField: "vehicleModelId",
                foreignField: "_id",
                as: 'vehicleModel'
              }
            },
            {
              $unwind: {
                path: '$vehicleModel',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'ratecategorymodels',
                localField: "rateCategoryId",
                foreignField: "_id",
                as: 'rateCategory'
              }
            },
            {
              $unwind: {
                path: '$rateCategory',
                preserveNullAndEmptyArrays: true
              }
            },
          ],
          as: 'vehicleRateCategoryDetails'
        }
      },
      {
        $project: {
          '_id': 1,
          'vehicleModelAndRcDetails':{
              $filter: {
              input: "$vehicleRateCategoryDetails",
              as: "vehicleRateCategory",
              cond: {
                $and: [{
                  $eq: ["$$vehicleRateCategory.vehicleModel.isDeleted", 0]

                },
                {
                  $eq: ["$$vehicleRateCategory.rateCategory.isDeleted", 0]

                }
              ]
              }
            }
          }
        }
      },
      {
        $project:{
        'vehicleModelAndRcDetails.vehicleModel': 1,
        'vehicleModelAndRcDetails.rateCategory': 1
      }}
      
      ]).allowDiskUse(true);
       if(vehicleModelData[0]){
        return this.success(req, res, this.status.HTTP_OK, vehicleModelData[0], this.messageTypes.vehicleModelFound);
       }
      return this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.vehicleModelNotFound);

      } catch (err) {
        error(err);
        this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
      }
  }
}


  // exporting the modules 
  module.exports = new VehicleModel();