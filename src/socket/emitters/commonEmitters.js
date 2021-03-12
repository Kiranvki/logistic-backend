const BaseEvent = require('../events/baseEvent');
const EventTypes = require('../events/types');
// emitting events 
class CommonEvents extends BaseEvent {
  emitEtaData = ({
    data,
    roomId
  }) => {
    info('Going to emit socket');
    // emitting event
    io.of(Namespace.USER)
      .to(roomId)
      .emit(EventTypes.ETA, data);
  }
}

module.exports = new CommonEvent();

// module.exports = {
//   sendData = 'Send DATA'
// }
