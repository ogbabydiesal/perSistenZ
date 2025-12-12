'use strict';

const socketIO = require('socket.io');
const express = require('express');
const path = require('path');
const app = module.exports.app = express();
const port = process.env.PORT || 3000;

let positionsJson = { 
  //starting positions
  'source1': { x: 50, y: 50, name: 'deep' },
  'source2': { x: 150, y: 150, name: 'dive' },
  'source3': { x: 250, y: 250, name: 'dawn' },
  'source4': { x: 350, y: 350, name: 'drift' },
  'source5': { x: 450, y: 450, name: 'dream' }
};

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log("Listening on port: " + port);
});

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  console.log(socket.id);
  //send existing positions to new user
  socket.emit('invokePersistence', positionsJson);
  //receives the sound position emitter from Client
  socket.on("setSoundPosition", (message) => {
    //update positionsJson
    positionsJson[message.source] = { x: message.x, y: message.y, name: positionsJson[message.source].name };
    //relay the position to all clients
    io.emit('relaySoundPosition', message);
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});
