// XXX: These are temporary
const db = {};
let objId = 0;

module.exports = {
  add: (path, next) => {
    db[objId] = path;
    objId += 1;
    return next(null, objId);
  }
};
