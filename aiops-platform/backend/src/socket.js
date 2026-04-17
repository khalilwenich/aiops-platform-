// Socket.IO singleton — avoids circular imports between server.js and workers
let _io = null;

export function setIO(io) {
  _io = io;
}

export function getIO() {
  return _io;
}
