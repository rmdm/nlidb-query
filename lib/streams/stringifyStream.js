module.exports = StringifyStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(StringifyStream, Transform);

function StringifyStream (options, replacer, space) {
  Transform.call(this, options);
  this._writableState.objectMode = true;
  this._readableState.objectMode = false;
  this.replacer = arguments.length === 2? replacer : null;
  this.space = arguments.length === 3 ? space : ' ';
  this.constructArray = options.constructArray || false;
}

function _transformSimple(obj, _, cb) {
  this.push(JSON.stringify(obj, this.replacer, this.space));
  cb();
}

function _transformToBuildArray(obj, _, cb) {
  this.push(',');
  this.push(JSON.stringify(obj, this.replacer, this.space));
  cb();
}

StringifyStream.prototype._transform = function (obj, _, cb) {
  if (this.constructArray) {
    this._transform = _transformToBuildArray;
    this.push('[');
  } else {
    this._transform = _transformSimple;
  }
  this.push(JSON.stringify(obj, this.replacer, this.space));
  cb();
};

StringifyStream.prototype._flush = function (cb) {
  this.constructArray && this.push(']');
  cb();
}
