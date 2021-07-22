const Events = require('../events/types');
const Namespace = require('../namespace');
const Redis = require('../../redis/basicOperaion');
const UserEvents = require('../events/userEvents')
const {
  error,
  info
} = require('../../utils').logging;

// socket listeners 
class SocketListeners {

  // checking the socket connection
  socketConnection = async (socket) => {
    // user namespace
    console.log('User socket',socket)
    socket.of(Namespace.USER)
      .on(Events.CONNECTION, (sock) => {
        info("User Socket Connection Established");
        
        Redis.getAll('testID');
        // should be triggered internally 
        sock.on(Events.SUBSCRIBE, ({
          customerId,
      

        }) => {
         
          
          this.subscribe(sock, customerId)
          
        });
        // unsubscribed event 
        sock.on(Events.UN_SUBSCRIBE, ({
          customerId
        }) => this.unSubscribe(sock, customerId));

        sock.on(Events.GET_DIRECTION, ({
          customerId,data
        }) => this.getDirection(sock, customerId,data));

        sock.on(Events.GET_LOCATION, ({
          customerId
        }) => this.getLocation(sock, customerId));


        sock.on(Events.UPDATE, ({
          customerId,data
        }) => this.updateLocation(sock, customerId,data));


        sock.on(Events.DISCONNECT,data=>{
          console.log('disconnected.')
        })
      })
  }

  // subscribe 
  subscribe = async (socket, roomId) => {

    socket.join(roomId)
  }

  // start trip
  getDirection = async (socket,customerId,obj) =>{
    info('Getting Direction!!!')
    let dataObj = ['originLat',obj.originLat,'originLng',obj.originLng,'currentLat',obj.currentLat,'currentLng',obj.currentLng,'destinationLat',obj.destinationLat,'destinationLng',obj.destinationLng]
    info('inserting Co-Ordinate to Redis!!!');
    console.log(customerId,dataObj)
    Redis.init(customerId,dataObj);
    UserEvents.emitLiveLocation({'roomId':customerId})
  }


   // update trip Co-ordinate
   updateLocation = async (socket,customerId,obj) =>{
    info('Updateing Co-ordinates!!!')
    
    let dataObj = ['currentLat',obj.currentLat,'currentLng',obj.currentLng,]
    info('Updating Co-Ordinate to Redis!!!');
    
    Redis.update(customerId,dataObj);
    UserEvents.emitLiveLocation({'roomId':customerId})
  }

  getLocation = async (socket,customerId) =>{
    UserEvents.emitLiveLocation({'roomId':customerId})

  }

  // un-subscribe 
  unSubscribe = async (socket, roomId) => {
    socket.leave(roomId)
  }
}

// socket listeners 
module.exports = new SocketListeners();
