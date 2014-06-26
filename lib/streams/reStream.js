module.exports = ReStream;

var Duplex = require('stream').Duplex;
var PassThrough = require('stream').PassThrough;
var util = require('util');

util.inherits(ReStream, Duplex);

function ReStream (createStream, when) {
  Duplex.call(this, {objectMode: true});
  this.createStream = createStream;
  this.when = typeof when === 'function' ? when : this.when;
  this.endPoint = new PassThrough({objectMode: true});
}

ReStream.prototype.when = function () {
  return true;
};

ReStream.prototype._write = function (obj, _, callback) {
  if (this.when(obj)) {
    this.createStream(obj).pipe(this.endPoint);
  }
  callback();
};

ReStream.prototype.pipe = function (dst, options) {
  return this.endPoint.pipe(dst, options);
};

ReStream.prototype.unpipe = function (dst) {
  return this.endPoint.unpipe(dst);
};
