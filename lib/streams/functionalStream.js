module.exports = FunctionalStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(FunctionalStream, Transform);

function FunctionalStream (_transform, _flush) {
  Transform.call(this, {objectMode: true});
  this._transform = _transform;
  this._flush = _flush;
}
