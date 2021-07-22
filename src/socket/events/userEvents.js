const EventTypes = require('./types');
const BaseEvent = require('./baseEvent');
const Namespace = require('../namespace');
const Redis = require('../../redis/basicOperaion');
const {
  error,
  info
} = require('../../utils').logging;

// emitting events 
class UserEvents extends BaseEvent {
  emitSubscribedData = ({
    data,
    roomId
  }) => {
    info('Going to emit socket');
    // emitting event
    io.of(Namespace.USER)
      .to(roomId)
      .emit(EventTypes.SUCCESS, data);
  }

  emitLiveLocation = ({
    roomId   //roomId is same as DE mongoose _ID
    
  })=>{
    info(`Broadcating Co-Ordinate to ROOM ${roomId}`);
    info(`getting Redis Data for ${roomId}`);

    let liveLocationObj = Redis.getAll(roomId,function(err,data){
      if(err){
        info(`Redis ERROR for ${roomId}`);
        io.of(Namespace.USER).to(roomId).emit(EventTypes.LIVE_LOCATION,{'status':500,'message':'Something went wrong.','data':err})
      }else{
        info(`Emitting the result!!!`);
      io.of(Namespace.USER).to(roomId).emit(EventTypes.LIVE_LOCATION,{'status':200,'message':'Live location fetch Succesfully.','data':data})
      }

    })
    
    

    
  }
}

module.exports = new UserEvents();
