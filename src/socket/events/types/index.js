class Events {
  SUCCESS = 'success'
  ETA = 'eta'
  MESSAGE = 'message'
  FAILED = 'failed'
  CONNECTION = 'connection'
  SUBSCRIBE = 'subscribe'
  UN_SUBSCRIBE = 'unSubscribe'
  GET_DIRECTION = 'getDirection'
  UPDATE = 'updateLocation'
  DISCONNECT = 'disconnect'
  LISTEN = 'listening'
  LIVE_LOCATION = 'liveLocation'
  GET_LOCATION = 'getLocation'
}

module.exports = new Events()
