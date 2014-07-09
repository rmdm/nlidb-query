module.exports = MatchStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(MatchStream, Transform);

function MatchStream (match, mapping) {
  Transform.call(this, {objectMode: true});    
  this.allowed = Object.keys(mapping);
  this.mapping = mapping;
  this.match = this.map(this.filter(match));
}

MatchStream.prototype.map = function (obj, mapping) {
  mapping = mapping || this.mapping;
  for (var k in obj) {
    var temp = obj[k];
    delete obj[k];
    obj[mapping[k]] = temp;
  }
  return obj;
};

MatchStream.prototype.filter = function (obj, allowed) {
  allowed = allowed || this.allowed;
  for (var k in obj) {
    if (allowed.indexOf(k) === -1) {
      delete obj[k];
    }
  }
  return obj;
};

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

MatchStream.prototype.unite = function (obj, match) {  
  match = match || this.match;
  var u = this.copy(match);
  obj = this.map(this.filter(obj));
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
