module.exports = UniqueFilterStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(UniqueFilterStream, Transform);

function UniqueFilterStream () {
  Transform.call(this, {objectMode: true});
  this.set = {};
}

UniqueFilterStream.prototype._transform = function (obj, _, callback) {
  if (!this.set[obj._id]) {
    this.push(obj);
    this.set[obj._id] = true;
  }
  callback();
};
