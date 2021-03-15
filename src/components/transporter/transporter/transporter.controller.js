const moment = require('moment');
const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const Model = require('./models/transporter.model');
const modelAndRcMappingModel  = require('../transporter-model-rate-mapping/models/transporter-model-rate-mapping')
const vehicleTransporterModelMapping = require('../../vehicle/vehicle_transporter_rc_mapping/models/vehicle_transporter_rc_mapping.model')
const mongoose = require('mongoose');
const _ = require('lodash');
const {
  error,
  info
} = require('../../../utils').logging;

class transporterController extends BaseController {
  // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.transporterMaster;
  }


  // Internal Function get rateCategory  details
  getDetails = (transporterId) => {
    try {
      info('Get Transporer details !');

      // get details 
      return Model.findOne({
        _id: mongoose.Types.ObjectId(transporterId),
        isDeleted: 0
      }).lean().then((res) => {
        if (res && !_.isEmpty(res)) {
          return {
            success: true,
            data: res
          }
        } else {
          error('Error Searching Data in Transporter DB!');
          return {
            success: false
          }
        }
      }).catch(err => {
        error(err);
        return {
          success: false,
          error: err
        }
      });

      // catch any runtime error 
    } catch (err) {
      error(err);
    }
  }
  // create a new entry
  post = async (req, res) => {
    try {
      //Initializing the field
      info('Creating Transporter !');

        const { mappedModelAndRc ,...transporterData  } = req.body
        let isInserted = await Model.create({
          ...transporterData
        });
      
      // check if inserted 
      if (isInserted && !_.isEmpty(isInserted)) {
        const mappedRows = this.mapTransporterWithModelAndRC(mappedModelAndRc,isInserted._id)
        let savedMapping = await modelAndRcMappingModel.insertMany(mappedRows);
        if(savedMapping && savedMapping.length){
          return this.success(req, res, this.status.HTTP_OK, isInserted, this.messageTypes.transporterCreated);
        }else{
          return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotCreated);
        }
      } else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotCreated);
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

   mapTransporterWithModelAndRC = (mappedRows,transporterId)=>{
      return mappedRows.map(data=>{
         return { 
           ...data,
        transporterId: transporterId}})

   }

   /****************** Delete below function *****************/
  // get transporter list 
  getList = async (req, res) => {
    try {
      info('Get the Transporter List !');

      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,

      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'vehicleDetails.name': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'locationDetails.address': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total rate category
      let totalTransporter = await Model.countDocuments({
        ...searchObject
      });


      // get the Transporter list 
      let transporterList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
      },
      {
        $lookup: {
          from: 'ratecategorytransportervehiclemappings',
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
                'vehicleId': 1,
                'transporterId': 1,
                'rateCategoryId': 1
              }
            },
            {
              $lookup: {
                from: 'vehiclemasters',
                localField: "vehicleId",
                foreignField: "_id",
                as: 'vehicle'
              }
            },
            {
              $unwind: {
                path: '$vehicle',
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
          'status': 1,
          'vehicleDetails': 1,
          'locationDetails': 1,
          'contactPersonalDetails': 1,
          'vehicleRateCategoryDetails': {
            $filter: {
              input: "$vehicleRateCategoryDetails",
              as: "vehicleRateCategory",
              cond: {
                $and: [{
                  $eq: ["$$vehicleRateCategory.vehicle.isDeleted", 0]

                },
                {
                  $eq: ["$$vehicleRateCategory.rateCategory.isDeleted", 0]

                }]
              }
            }
          },
        }
      },
      ]).allowDiskUse(true);

      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: transporterList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalTransporter
        }
      }, this.messageTypes.transporterFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  getListNew = async (req, res) => {
    try {
      info('Get the Transporter List !');

      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,

      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'transporterDetails.name': {
              $regex: searchKey,
              $options: 'is'
            }
          }, {
            'locationDetails.address': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total rate category
      let totalTransporter = await Model.countDocuments({
        ...searchObject
      });


      // get the Transporter list 
      let transporterList = await Model.aggregate([{
        $match: {
          ...searchObject
        }
      }, {
        $sort: sortingArray
      }, {
        $skip: skip
      }, {
        $limit: pageSize
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
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$transporterId', '$$id']
                }
              },
              
            },
            {
              $project: {
                'transporterId': 1,
                'rateCategoryId': 1
              }
            },
            {
              $lookup: {
                from: 'ratecategorymodels',
                localField: "rateCategoryId",
                foreignField: "_id",
                as: 'rateCategory'
              },
            },
            {
              $unwind:{
                path: '$rateCategory',
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          as: 'vehicleRateCategoryDetails'
        }
      },
      {
        $project: {
          '_id': 1,
          'status': 1,
          'transporterDetails': 1,
          'locationDetails': 1,
          'contactPersonalDetails': 1,
          'vehicleRateCategoryDetails':  {
            $filter: {
              input: "$vehicleRateCategoryDetails",
              as: "vehicleRateCategory",
              cond: 
                {
                  $eq: ["$$vehicleRateCategory.rateCategory.isDeleted", 0]

                }
            }
          },
        }
      },
      ]).allowDiskUse(true);


      transporterList.map(data=>{
        data.rateCategoryCount = data.vehicleRateCategoryDetails.length;
      })
      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        transporterList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totalTransporter
        }
      }, this.messageTypes.transporterFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }
  
  getVehicleForModel = async (req,res)=>{
    try{
      const modelId = req.params.modelId;
      const transporterId = req.params.transporterId;
      console.log('ModelId: ',modelId)
      const vehicleData = await vehicleTransporterModelMapping.aggregate([
      {
         $match: { 
           $and: [ { 'vehicleModelId': mongoose.Types.ObjectId(modelId)} ,{'transporterId': mongoose.Types.ObjectId(transporterId)} ]
          }
      },
      {
        $project: {
          'vehicleId': 1
        }
      },
      {
        $lookup: {
          from : 'vehiclemasters',
          localField: "vehicleId",
          foreignField: "_id",
          as: 'vehicle'
        }
      },
      {
        $unwind:{
          path: '$vehicle',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          // '_id': 1,
          'status': 1,
          'vehicle': 1
        }
      },

      ]).allowDiskUse(true)
   const filteredResult  = vehicleData.filter(vehicleObj => vehicleObj.vehicle.isDeleted===0)
      if(filteredResult.length){
        return this.success(req, res, this.status.HTTP_OK, filteredResult, this.messageTypes.vehicleModelFound);
       }
      return this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.vehicleModelNotFound);


    }catch(err){
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));

    }
  }


  getRateCategoryList = async (req, res) => {
    try {
      info('Get Rate-Category List for Transporter!');

      // get the query params
     const  sortBy = req.query.sortBy || 'createdAt';
      let  sortingArray = {};

      sortingArray[sortBy] = -1;
      
      // get the Transporter list 
      let transporterId = req.params.transporterId;

      let transporterList = await Model.aggregate([{
        $match: {
          _id:  mongoose.Types.ObjectId(transporterId)
        }
      },
      {
        $sort: sortingArray
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
                'status': 1,
                'isDeleted': 0,
                '$expr': {
                  '$eq': ['$transporterId', '$$id']
                }
              },
              
            },
            {
              $project: {
                'transporterId': 1,
                'rateCategoryId': 1,
                'vehicleModelId': 1,
                'createdAt': 1
              }
            },
            {
              $lookup: {
                from: 'ratecategorymodels',
                localField: "rateCategoryId",
                foreignField: "_id",
                as: 'rateCategory'
              },
            },
            {
              $unwind:{
                path: '$rateCategory',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'vehiclemodelmasters',
                localField: "vehicleModelId",
                foreignField: "_id",
                as: 'vehicleModel'
              },
            },
            {
              $unwind:{
                path: '$vehicleModel',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'vehicletransporterrcmappings',
                // localField: "rateCategoryId",
                // foreignField: "rateCategoryId",
                pipeline: [
                  {
                    $match: {
                      'status': 1,
                      'isDeleted': 0,
                      '$expr': {
                        '$eq': ['$rateCategoryId', '$rateCategoryId']
                      }
                    },
                    
                  }],
                as: 'vehicle'
              },
            }
          ],
          as: 'vehicleRateCategoryDetails'
        }
      },
      {
        $project: {
          '_id': 1,
          'status': 1,
          'transporterDetails': 1,
          'locationDetails': 1,
          'contactPersonalDetails': 1,
          'vehicleRateCategoryDetails':  
          {
            $filter: {
              input: "$vehicleRateCategoryDetails",
              as: "vehicleRateCategory",
              cond: {
                $and: [
                {
                  $eq: ["$$vehicleRateCategory.vehicleModel.isDeleted", 0]
  
                },
                {
                  $eq: ["$$vehicleRateCategory.rateCategory.isDeleted", 0]
  
                }]
              }
            }
          },
        }
      },
      ]).allowDiskUse(true);

      transporterList[0].vehicleRateCategoryDetails.map(data=>{
        data.vehicleCount = data.vehicle.length
        data.rateCategoryExpiry = this.checkRateCategoryExpiry(data.rateCategory,data.createdAt)
      })
      // success 
      return this.success(req, res, this.status.HTTP_OK, 
        transporterList[0]
      , this.messageTypes.transporterFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

  checkRateCategoryExpiry=  (rateCategory,createdAt)=>{
    let expiresOn;
    console.log('Rate-Category: ',rateCategory,createdAt)
    if(rateCategory.rateCategoryDetails.rateCategoryType==='Daily'){
     const rateCatogaryDate = createdAt
     const rateCategoryExpiryDate = new Date(rateCatogaryDate.setDate(rateCatogaryDate.getDate() + 1));
      const currentDate = new Date();
      expiresOn = currentDate>rateCategoryExpiryDate?'expired':moment(rateCategoryExpiryDate).format("DD MMM YYYY")
    }
    if(rateCategory.rateCategoryDetails.rateCategoryType==='Monthly'){
      const rateCatogaryDate = rateCategory.createdAt
      const rateCategoryExpiryDate = rateCatogaryDate.setDate(rateCatogaryDate.getDate() + 30);
      const currentDate = new Date();
      expiresOn = currentDate>rateCategoryExpiryDate?'expired':moment(rateCategoryExpiryDate).format("DD MMM YYYY")

    }
    return expiresOn
  }
  // get transporter minified list 
  getMinifiedList = async (req, res) => {
    try {
      info('Get the transporter List  !');
      // get the query params
      let page = req.query.page || 1,
        pageSize = await BasicCtrl.GET_PAGINATION_LIMIT().then((res) => { if (res.success) return res.data; else return 60; }),
        searchKey = req.query.search || '',
        sortBy = req.query.sortBy || 'createdAt',
        sortingArray = {};

      sortingArray[sortBy] = -1;
      let skip = parseInt(page - 1) * pageSize;

      let fieldsToProject = {
        '_id': 1,
        'vehicleDetails': '$vehicleDetails.name',
      }


      // get the list of asm in the allocated city
      let searchObject = {
        'isDeleted': 0,
        'status': 1
      };

      // creating a match object
      if (searchKey !== '')
        searchObject = {
          ...searchObject,
          '$or': [{
            'vehicleDetails.name': {
              $regex: searchKey,
              $options: 'is'
            }
          }]
        };

      // get the total rate category
      let totaltransporter = await Model.countDocuments({
        ...searchObject
      });

      // get the distributor list
      let transporterList = await Model.aggregate([{
        '$match': {
          ...searchObject
        }
      },
      {
        '$sort': sortingArray
      }, {
        '$skip': skip
      }, {
        '$limit': pageSize
      }, {
        $project: fieldsToProject
      },
      ]).allowDiskUse(true);


      // success 
      return this.success(req, res, this.status.HTTP_OK, {
        results: transporterList,
        pageMeta: {
          skip: parseInt(skip),
          pageSize: pageSize,
          total: totaltransporter
        }
      }, this.messageTypes.transporterFetched);

      // catch any runtime error 
    } catch (err) {
      error(err);
      return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }

  }


  getTransporterById = async (req,res)=>{
    try{
   const transporterId = req.params.transporterId;
   console.log('TRansporter: ',transporterId);
   const transporterData = await Model.findOne({
     _id: mongoose.Types.ObjectId(transporterId),
    isDeleted: 0}).lean()
    console.log('transp', transporterData);
     if(transporterData){
     return this.success(req, res, this.status.HTTP_OK,transporterData , this.messageTypes.transporterFetched);
     }
     return this.errors(req, res, this.status.HTTP_NOT_FOUND, this.messageTypes.transporterNotFetched);
    }catch(err){
     error(err);
     return this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  // get details 
  // getTransporter = async (req, res) => {

  //   try {
  //     info('Transporter GET DETAILS !');
  //     // get the brand id 
  //     let transporterId = req.params.transporterId;
  //     // inserting data into the db 
  //     // let transporter = await Model.findOne({
  //     let transporter = await Model.findById({

  //       _id: mongoose.Types.ObjectId(transporterId)
  //     }).lean();

  //     // check if inserted 
  //     if (transporter && !_.isEmpty(transporter)) return this.success(req, res, this.status.HTTP_OK, transporter, this.messageTypes.transporterFetched);
  //     else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotFetched);

  //     // catch any runtime error 
  //   } catch (err) {
  //     error(err);
  //     this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  //   }
  // }


  // getTransporter = async (req, res) => {
  //   try {
  //     info('Transporter GET DETAILS !');

  //     // get the transporter id
  //     let transporterId = req.params.transporterId;

  //     let transporterData = await Model.aggregate([{
  //       '$match': {
  //         '_id': mongoose.Types.ObjectId(transporterId),
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: 'ratecategorytransportervehiclemappings',
  //         let: {
  //           'id': '$_id'
  //         },
  //         pipeline: [
  //           {
  //             $match: {
  //               // 'status': 1,
  //               'isDeleted': 0,
  //               '$expr': {
  //                 '$eq': ['$transporterId', '$$id']
  //               }
  //             }
  //           }, {
  //             $project: {
  //               '_id': 1,
  //               'status': 1,
  //               'isDeleted': 1,
  //               'vehicleId': 1,
  //               'transporterId': 1,
  //               'rateCategoryId': 1
  //             }
  //           },
  //           {
  //             $lookup: {
  //               from: 'vehiclemasters',
  //               localField: "vehicleId",
  //               foreignField: "_id",
  //               as: 'vehicle'
  //             }
  //           },
  //           {
  //             $unwind: {
  //               path: '$vehicle',
  //               preserveNullAndEmptyArrays: true
  //             }
  //           },
  //           {
  //             $lookup: {
  //               from: 'ratecategorymodels',
  //               localField: "rateCategoryId",
  //               foreignField: "_id",
  //               as: 'rateCategory'
  //             }
  //           },
  //           {
  //             $unwind: {
  //               path: '$rateCategory',
  //               preserveNullAndEmptyArrays: true
  //             }
  //           },
  //         ],
  //         as: 'vehicleRateCategoryDetails'
  //       }
  //     },
  //     {
  //       $project: {
  //         '_id': 1,
  //         'status': 1,
  //         'vehicleDetails': 1,
  //         'locationDetails': 1,
  //         'contactPersonalDetails': 1,
  //         'vehicleRateCategoryDetails': {
  //           $filter: {
  //             input: "$vehicleRateCategoryDetails",
  //             as: "vehicleRateCategory",
  //             cond: {
  //               $and: [{
  //                 $eq: ["$$vehicleRateCategory.vehicle.isDeleted", 0]

  //               },
  //               {
  //                 $eq: ["$$vehicleRateCategory.rateCategory.isDeleted", 0]

  //               }]
  //             }
  //           }
  //         },

  //       }
  //     },
  //     ]).allowDiskUse(true);

  //     // check if data is present
  //     if (transporterData && !_.isEmpty(transporterData)) return this.success(req, res, this.status.HTTP_OK, transporterData, this.messageTypes.transporterFetched);
  //     else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotFetched);

  //     // catch any runtime error 
  //   } catch (err) {
  //     error(err);
  //     this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
  //   }
  // }

  // // patch the request 
  patchTransporter = async (req, res) => {
    try {
      info('Transporter Patch Controller !');

      let vehicleDetails = {},
        locationDetails = {},
        contactPersonalDetails = {},
        toChangeObject = req.body.toChangeObject || '',
        vehicleDetailsFromDb = req.body.vehicleDetailsFromDb || '',
        locationDetailsFromDb = req.body.locationDetailsFromDb || '',
        contactPersonalDetailsFromDb = req.body.contactPersonalDetailsFromDb || '';

      // creating data to insert
      vehicleDetails = {
        'name': toChangeObject.name ? toChangeObject.name : vehicleDetailsFromDb.name,
        'contactNo': toChangeObject.contactNo ? toChangeObject.contactNo : vehicleDetailsFromDb.contactNo,
        'altContactNo': toChangeObject.altContactNo ? toChangeObject.altContactNo : vehicleDetailsFromDb.altContactNo,
        'email': toChangeObject.email ? toChangeObject.email : vehicleDetailsFromDb.email,
        'altEmail': toChangeObject.altEmail ? toChangeObject.altEmail : vehicleDetailsFromDb.altEmail,
      }

      locationDetails = {
        'streetNo': toChangeObject.streetNo ? toChangeObject.streetNo : locationDetailsFromDb.streetNo,
        'address': toChangeObject.address ? toChangeObject.address : locationDetailsFromDb.address,
        'city': toChangeObject.city ? toChangeObject.city : locationDetailsFromDb.city,
        'country': toChangeObject.country ? toChangeObject.country : locationDetailsFromDb.country,
        'postalCode': toChangeObject.postalCode ? toChangeObject.postalCode : locationDetailsFromDb.postalCode,
      }

      contactPersonalDetails = {
        'contactPersonName': toChangeObject.contactPersonName ? toChangeObject.contactPersonName : contactPersonalDetailsFromDb.contactPersonName,
        'contactNumber': toChangeObject.contactNumber ? toChangeObject.contactNumber : contactPersonalDetailsFromDb.contactNumber,
        'altContactNumber': toChangeObject.altContactNumber ? toChangeObject.altContactNumber : contactPersonalDetailsFromDb.altContactNumber,
        'emailID': toChangeObject.emailID ? toChangeObject.emailID : contactPersonalDetailsFromDb.emailID,
        'altEmailID': toChangeObject.altEmailID ? toChangeObject.altEmailID : contactPersonalDetailsFromDb.altEmailID,
      }

      let dataToUpdate = {
        $set: {
          'vehicleDetails': vehicleDetails,
          'locationDetails': locationDetails,
          'contactPersonalDetails': contactPersonalDetails,
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(req.params.transporterId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, this.messageTypes.transporterUpdated);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }


  //Delete Transporter

  deleteTransporter = async (req, res) => {
    try {
      info('New Vehicle Delete!');

      // inserting the new user into the db
      let isUpdated = await Model.findByIdAndDelete({
        _id: mongoose.Types.ObjectId(req.params.transporterId),
      }, {
        $set: {
          ...req.body
        }
      })

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)){
       const mappingDeleted = await modelAndRcMappingModel.findByIdAndDelete({
          _id: mongoose.Types.ObjectId(req.params.transporterId),
        },
        {
          $set: {
            ...req.body
          }
        })
        if(mappingDeleted && !_isEmpty(mappingDeleted)){
          return this.deleteTransporterVehicleMapping(req.params.transporterId,req.body)
          // return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.transporterDeleted);

        }else{
         return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotDeleted);

        }
        // return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.transporterDeleted);
      } 
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotDeleted);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

   deleteTransporterVehicleMapping=async (transporterId,body)=>{
    const mappingDeleted = await vehicleTransporterModelMapping.findByIdAndDelete({
      _id: mongoose.Types.ObjectId(transporterId),
    },
    {
      $set: {
        ...body
      }
    })
    if(mappingDeleted && !_isEmpty(mappingDeleted)){
      return this.success(req, res, this.status.HTTP_OK, {}, this.messageTypes.transporterDeleted);

    }else{
     return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotDeleted);

    }
   }
  // patch Transporter status
  patchTransporterStatus = async (req, res) => {
    try {
      info('Transporter STATUS CHANGE !');

      // type id 
      let type = req.params.type,
        transporterId = req.params.transporterId;
      // creating data to insert
      let dataToUpdate = {
        $set: {
          status: type == 'activate' ? 1 : 0
        }
      };

      // inserting data into the db 
      let isUpdated = await Model.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(transporterId)
      }, dataToUpdate, {
        new: true,
        upsert: false,
        lean: true
      });

      // check if inserted 
      if (isUpdated && !_.isEmpty(isUpdated)) return this.success(req, res, this.status.HTTP_OK, isUpdated, type == 'activate' ? this.messageTypes.transporterActivatedSuccessfully : this.messageTypes.transporterDeactivatedSuccessfully);
      else return this.errors(req, res, this.status.HTTP_CONFLICT, this.messageTypes.transporterNotUpdated);

      // catch any runtime error 
    } catch (err) {
      error(err);
      this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
    }
  }

}
// exporting the modules 
module.exports = new transporterController();