const grid = require('gridfs-stream');

module.exports = {
  get(id, next) {
    next(null, id);
  }
};
