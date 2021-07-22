const BaseController = require('../../baseController');
const Model = require('./models/transporter-model-rate-mapping');
// const vehicleModelTransporterRCMappingModel = require('../../transporter/transporter_vehicle_model_rate_cetagory_mapping/models/transporter_vehicle_model_rate_cetagory_mapping.model')
const {
    error,
    info
  } = require('../../../utils').logging;

const mongoose = require('mongoose');

// import  * as VehicleModelMasterService from './vehicle_model_master.service'

class TransporterVehicleModelRcController extends BaseController{
     constructor() {
      super();
      this.messageTypes = this.messageTypes.vehicleModel;
       }

       getModelByTransporterId= async (req,res)=>{
           try{
             const {transporterId} = req.params;
             const modelAndRcDetails = Model.aggregate([
                 {
                     $match: {
                         isDeleted: 0,
                         transporterId: req.params.transporterId,
                     }
                 },  
                 {
                    $lookup: {
                        from: 'vehiclemodels',
                        localField: "vehicleModelId",
                        foreignField: "_id",
                        pipeline: [
                            {
                              $match: {
                                // 'status': 1,
                                'isDeleted': 0
                              }
                            }, {
                              $project: {
                                '_id': 1,
                                'status': 1,
                                'isDeleted': 1,
                                'name': 1,
                                'brand': 1,
                                'tonnage': 1
                              }
                            },
                            {
                              $unwind: {
                                path: '$vehiclemodel',
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
                          as: 'vehicleModelRCDetails'
                    }
                 },
                 {
                    $project: {
                    //   '_id': 1,
                    //   'status': 1,
                    //   'vehicleDetails': 1,
                    //   'locationDetails': 1,
                    //   'contactPersonalDetails': 1,
                      'vehicleModelRCDetails': {
                        $filter: {
                          input: "$vehicleModelRCDetails",
                          as: "vehicleModelAndRateCategory",
                          cond: {
                            $and: [{
                              $eq: ["$$vehicleModelAndRateCategory.vehiclemodel.isDeleted", 0]
            
                            },
                            {
                              $eq: ["$$vehicleModelAndRateCategory.rateCategory.isDeleted", 0]
            
                            }]
                          }
                        }
                      },
                    }
                  }  
             ])
             if(modelAndRcDetails){
                return this.success(req, res, this.status.HTTP_OK, modelAndRcDetails, this.messageTypes.vehicleModelFound);
               }
              return this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.vehicleModelNotFound);
        
              } catch (err) {
                error(err);
               return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
              }
       }
    
    }


    module.exports = new TransporterVehicleModelRcController()