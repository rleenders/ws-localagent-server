const IO = require('socket.io');
const uuid = require('uuid/v4');

/**
  the server that sends commands to the local agent
*/
class server {
  /**
    creates te server instance
    @param {object} server - an express server instance to connect socket.io to
    @param {function} connectCallback  an optional function to provide extra validation during the connect handshake
      (this should return either true or false depending on whether the connection is valid)
  */
  constructor(server, connectCallback = () => true) {
    const io  = IO();
    io.attach(server);
    io.on('connection', (socket) => {
      socket.emit('CLIENT_CONNECTED', {type: 'SERVER_SET_SOCKET_ID', payload: socket.id},
      (response) => {
        if(connectCallback(response)){
          this.handleWSConnect(response, socket.id)
        }else{
          socket.disconnect(true);
        }
      });
      socket.on('CLIENT_RESPONSE', this.handleWSResponse);
      socket.on('disconnect', () => {
        //@TODO add disconnect handler
      });
    });

    this.io = io;
    this.connections = {};
    this.callbacks = {};

    this.handleWSResponse = this.handleWSResponse.bind(this);
    this.sendWSRequestMiddleware = this.sendWSRequestMiddleware.bind(this);
  }

  /**
    Gets the websocket id based on the agent name
    @param {string} agent name
    @return {object} the relevant socket
  */
  getSocket(name) {
    if(this.connections[name] && this.io.sockets.sockets[this.connections[name]]){
      return this.io.sockets.to(this.connections[name]);
    }else{
      throw(Error('socket not found'));
    }
  }

  /**
    creates the agent name to socket id mapping
    @param {object} payload - the response from the agent on connection confirm
    @param {string} id - the socket id
  */
  handleWSConnect(payload, id) {
    let name;
    if(payload.name){
      name = payload.name;
    }else{
      name = uuid()
    }
    console.log(`assigning ${name} to ${id}`);
    this.connections[name] = id
  }

  /**
    triggers the callback storred in the callbaccks object for the initializing transaction then removes the callback
    @param {object} response - the body of the response
  */
  handleWSResponse (response) {
    if(response){
      this.callbacks[response.transaction_id](response.payload)
      delete this.callbacks[response.transaction];
    }
  }

  /**
    returns a middleware function builds the websocket request to the local agent based off of an api request
    @param {string} event -  the name of the event websockets will be emitting
    @return {function} a middleware function that maps the request payload to the websockt payload, and sets a transaction id
  */
  buildWSRequestMiddleware (event = 'ACTION'){
    return (req, res, next) => {
      req.ws = {
        id: req.params.id,
        event,
        payload: {
          transaction_id: uuid(),
          body: req.body
        }
      }
      next();
    }
  }
  /**
    a middleware function that sends the websocket request to the local agent, and adds a callback funtion to the callbacks messageObject
    @param {object} req - the express request object
    @param {object} res - the exress reponse object
    @param {function} next - calls the next middleware function in the chain
  */
  sendWSRequestMiddleware (req, res, next) {
    try{
      const {id,  event, payload} = req.ws;
      const socket = this.getSocket(id);

      this.callbacks[payload.transaction_id] = (data) => {
        res.ws = data;
        next();
      };

      socket.emit(event, payload);
    }catch(e){
      next(e);
    }
  }

}

module.exports = server;
