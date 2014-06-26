module.exports = MatchStream;

var Duplex = require('stream').Duplex;
var util = require('util');

util.inherits(MatchStream, Duplex);

function MatchStream (match) {
  Duplex.call(this, {objectMode: true});
  this.match = match;
  this.queue = [];
}

MatchStream.prototype._copyProps = function (to, from) {
  for (var k in from) {
    to[k] = from[k];
  }
};

MatchStream.prototype._mergeProps = function (obj, objArr) {
  while (objArr.length) {
    var el = objArr.shift();
    for (var k in el) {
      if (obj[k]) {
        if (Array.isArray(obj[k])) {
          if (Array.isArray(el[k])) {
            Array.prototype.push.apply(obj[k], el[k]);
          } else {
            obj[k].push(el[k]);
          }
        } else {
          if (Array.isArray(el[k])) {
            el[k].push(obj[k]);
            obj[k] = el[k];
          } else {
            obj[k] = [obj[k], el[k]];
          }
        }
      } else {
        obj[k] = el[k];
      }
    }
  }
};

MatchStream.prototype._generateOutput = function (queue, match) {
  queue = queue || this.queue;
  match = match || this.match;
  var res = {};
  this._copyProps(res, match);
  this._mergeProps(res, queue);
  return res;
};

MatchStream.prototype._read = function (_) {
  this.push(this._generateOutput);
};

MatchStream.prototype._write = function (obj, _, callback) {
  this.queue.push(obj);
  callback();
};
