const redis = require("redis");
// const client = redis.createClient('redis://127.0.0.1:6379');

const {
    error,
    info
  } = require('../utils').logging;
  
  class RedisClass {
  // initialize the trip co-ordinates
    init = async (customerId,dataObj)=>{
        client.hmset(customerId,...dataObj, function(err, res) {
            if(err){
                return err
            }
            return res
          });
        

    }


// update key value entry
    update = async (customerId,dataObj)=>{
        client.hmset(customerId,...dataObj, function(err, res) {
            if(err){
                return err
            }
            return res
          });

    }
// get the data from the redis db 
    get = async (customerId,key)=>{
        client.hget(customerId,key, function(err, res) {
            if(err){
                return err;
            }
            
            return res[0];
          });



    }

    getAll = async (customerId,callback)=>{
        client.hgetall(customerId,callback );


  }
}


  module.exports = new RedisClass();



