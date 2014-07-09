module.exports = MatchStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(MatchStream, Transform);

function MatchStream (match) {
  Transform.call(this, {objectMode: true});
  this.match = match;
}

MatchStream.prototype.copy = function (of) {
  var copy = {};
  for (var k in of) {
    if (Array.isArray(of[k])) {
      copy[k] = of[k].slice();
    } else {
      copy[k] = of[k];
    }
  }
  return copy;
};

MatchStream.prototype.unite = function (obj) {
  var u = this.copy(this.match);
  var keys = Object.keys(obj);
  for (var k in keys) {
    if (u[keys[k]]) {
      if (Array.isArray(u[keys[k]])) {
        if (Array.isArray(obj[keys[k]])) {
          Array.prototype.push.apply(u[keys[k]], obj[keys[k]]);
        } else {
          u[keys[k]].push(obj[keys[k]]);
        }
      } else {
        if (Array.isArray(obj[keys[k]])) {
          obj[keys[k]].push(u[keys[k]]);
          u[keys[k]] = obj[keys[k]];
        } else {
          u[keys[k]] = [u[keys[k]], obj[keys[k]]];
        }
      }
    } else {
      u[keys[k]] = obj[keys[k]];
    }
  }
  return u;
};

MatchStream.prototype._transform = function (obj, _, callback) {
  this.push(this.unite(obj));
  callback();
};
