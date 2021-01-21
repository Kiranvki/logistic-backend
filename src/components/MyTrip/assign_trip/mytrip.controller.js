const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const { error, info } = require('../../../utils').logging;
const SalesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const tripModel = require('./model/trip.model');

class MyTrip extends BaseController {

    // constructor 
  constructor() {
    super();
    this.messageTypes = this.messageTypes.vehicle;
  }

    getSalesOrders = async (req, res) => {
        try {

            let cityId = req.query.cityId || 'chennai', endDate, startDate, limit = 10, page = 1, skipRec = 0;

            limit = !req.query.limit ? limit = limit : limit = parseInt(req.query.limit);
            page = !req.query.page ? page = page - 1 : page = parseInt(req.query.page) - 1; 
        
            skipRec = page * limit;

            startDate = !req.query.startDate ? startDate = new Date() : startDate = new Date(req.query.startDate)
            endDate = !req.query.endDate ? endDate = startDate : endDate = new Date(req.query.endDate);

            startDate = startDate.setHours(0,0,0,0);
            endDate = endDate.setHours(23,59,59,999);

            let projection = { 
                'cityId': cityId,
                'deliveryDate':  { '$gte': startDate, '$lte': endDate }
            };

            if (req.query.searchText && !req.query.searchText == '') {
                projection =  { ... projection, ...   {
                    '$or':  [ { 'invoiceNo': { $regex:  req.query.searchText, $options: 'i' } },
                                { 'customerName': { $regex:  req.query.searchText, $options: 'i' } } ]
                } }
            }

            console.log(projection)

            let getSalesOrder = await SalesOrderModel.find(projection)
            .limit(limit)
            .skip(skipRec)
            .select('invoiceNo deliveryDate customerName cityId orderItems orderItems orderPK')
            .lean();

            let totalRec = await SalesOrderModel.countDocuments(projection);
            let items = 0, quantity = 0;
            
            getSalesOrder = getSalesOrder.map( ( v ) => {
                items = v.orderItems.length;
                v.items = items;
                v.orderItems.map( ( item ) => { quantity += item.quantity; } );
                v.quantity = quantity;
                quantity = 0;
                return v;
            }); 

            return this.success(req, res, this.status.HTTP_OK, {
                results: getSalesOrder,
                pageMeta: {
                  skip: parseInt(skipRec),
                  pageSize: limit,
                  total: totalRec
                }
              });
            
        } catch (err) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

    vehicleCountAndDetails = async (req, res) => {
        try {



        } catch (error) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

    createTrip = async (req, res) => {
        try {
                req.body.tripId = await tripModel.countDocuments() + 1;
                
                let trip = await tripModel.create(req.body);
                
                return this.success(req, res, this.status.HTTP_OK, trip, 'Trip Created !');    
            } catch (error) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

};

module.exports = new MyTrip();
