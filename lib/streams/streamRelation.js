module.exports = StreamRelation;

var PassThrough = require('stream').PassThrough;
var util = require('util');
var rutil = require('../relUtil');
var FunctionalStream = require('./functionalStream');
var MatchStream = require('./matchStream');
var ProjectStream = require('./projectStream');
var ReStream = require('./reStream');
var UniqueFilterStream = require('./uniqueFilterStream');

util.inherits(StreamRelation, PassThrough);

function StreamRelation (rel, opt) {
  PassThrough.call(this, {objectMode: true});
  this.stream(rel, opt);
}

StreamRelation.prototype.stream = function (rel, opt) {
  var rel = rutil.copy(rel);
  var stream = this.initial(rel, opt);
  var next;
  while (next = this.nextFunctionalStream(rel)) {
    stream = stream.pipe(next);
  }
  if (opt.last) {
    stream = stream.pipe(new ProjectStream(rutil.project(rel)));
  }
  stream.pipe(this);
};

StreamRelation.prototype.initial = function (rel, opt) {
  var match = rutil.match(rel);
  if (opt.streamFrom) {
    var queryStream = new ReStream(function (m) {
      return opt.db.streamData(m, rel.rel);
    });
    var stream = opt.streamFrom
      .pipe(new MatchStream(match))
      .pipe(queryStream)
      .pipe(new UniqueFilterStream());    
  } else {
    var stream = opt.db.streamData(match, rel.rel);
  }
  return stream;
};

StreamRelation.prototype.nextFunctionalStream = function (rel, opt) {
  var nextF = rutil.nextFIdx(rel, opt.functions);
  if (nextF === -1) {
    return null;
  }
  var kvf = rel.kvf[nextF];
  rel.kvf[nextF] = undefined;
  var firstF = kvf.f.shift();
  var f = opt.functions[firstF](rel, kvf.k, kvf.v, kvf.f);
  if (opt.functions.__isTransform__(kvf.k, kvf.v, firstF)) {    
    return new FunctionalStream(f._transform, f._flush);
  } else {
    return new ReStream(function (m) {
      return opt.db.streamData(f._require(m), rel.rel);
    });
  }
};
