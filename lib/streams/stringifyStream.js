module.exports = StringifyStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(StringifyStream, Transform);

function StringifyStream (options, replacer, space) {
  Transform.call(this, options);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;
  this.replacer = replacer || null;
  this.space = space || ' ';
}

StringifyStream.prototype._transform = function (obj, _, cb) {
  this.push(JSON.stringify(obj, this.replacer, this.space));
  cb();
};
