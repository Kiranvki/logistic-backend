const BasicCtrl = require('../../basic_config/basic_config.controller');
const BaseController = require('../../baseController');
const { error, info } = require('../../../utils').logging;
const SalesOrderModel = require('../../sales_order/sales_order/models/sales_order.model')
const invoiceMasterModel = require('../../picker_app/invoice_master/models/invoice_master.model')
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
                'so_db_id': { $exists: true },
                'so_deliveryDate':  { '$gte': startDate, '$lte': endDate }
            };

            if (req.query.searchText && !req.query.searchText == '') {

                projection =  { ... projection, ...   {
                    '$or':  [ { 'invoiceNo': { $regex: req.query.searchText, $options: 'i' } },
                                { 'customerName': { $regex: req.query.searchText, $options: 'i' } }
                            ]
                } };

            };

            let getSalesOrder = await invoiceMasterModel.find(projection)
                                .populate({path: 'so_db_id', select: 'orderPK' })
                                .limit(limit)
                                .skip(skipRec)
                                .select('invoiceNo so_deliveryDate customerName cityId itemSupplied orderPK')
                                .lean();

            let totalRec = await SalesOrderModel.countDocuments(projection);
            let items = 0, quantity = 0;
            
            getSalesOrder = getSalesOrder.map( ( v ) => {
                items = v.itemSupplied.length;
                v.so_id =  v.so_db_id.orderPK;
                v.so_db_id = v.so_db_id._id;
                v.deliveryDate = v.so_deliveryDate
                v.items = items;
                v.itemSupplied.map( ( item ) => { quantity += item.quantity; } );
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

    getItemsByInvoiceId = async (req, res) => {
        try {

            let items = await invoiceMasterModel.findOne({ invoiceNo: req.params.invoiceNo }).select('invoiceNo soId itemSupplied').lean();
            return this.success(req, res, this.status.HTTP_OK, {
                results: items,
                success: true
              });

        } catch (error) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        };
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
                req.body.tripId = await tripModel.countDocuments() + 1; // Mandatory to create sequence incremental unique Id
                if (!req.body.tripId) return false;
                
                let trip = await tripModel.create(req.body);
                
                return this.success(req, res, this.status.HTTP_OK, trip, 'Trip Created !');    
            } catch (error) {
            error(err);
            this.errors(req, res, this.status.HTTP_INTERNAL_SERVER_ERROR, this.exceptions.internalServerErr(req, err));
        }
    };

};

module.exports = new MyTrip();
