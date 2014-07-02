module.exports = UniqueFilterStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(UniqueFilterStream, Transform);

function UniqueFilterStream (by) {
  Transform.call(this, {objectMode: true});
  this.set = {};
  this.by = by || '_id';
}

UniqueFilterStream.prototype._transform = function (obj, _, callback) {
  if (!this.set[obj[this.by]]) {
    this.push(obj);
    if (obj[this.by]) {
      this.set[obj[this.by]] = true;
    }
  }
  callback();
};
