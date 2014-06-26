module.exports = ProjectStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(ProjectStream, Transform);

function ProjectStream (project) {
  Transform.call(this, {objectMode: true});
  this.project = project;
}

ProjectStream.prototype._transform = function (obj, _, callback) {
  var toPush = {};  
  var a = this.project;
  var i = a.length;
  for (; i--;) {
    toPush[a[i]] = obj[a[i]];
  }
  this.push(toPush);
  callback();
};