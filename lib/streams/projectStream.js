module.exports = ProjectStream;

var Transform = require('stream').Transform;
var util = require('util');

util.inherits(ProjectStream, Transform);

function ProjectStream (project) {
  Transform.call(this, {objectMode: true});
  this.project = project;
}

ProjectStream.prototype._transform = function (obj, _, callback) {
  if (this.project) {
    var toPush = {};  
    var p = this.project;
    var i = p.length;
    for (; i--;) {
      if(obj[p[i]]){
        toPush[p[i]] = obj[p[i]];
      }
    }
    if (Object.keys(toPush).length) {
      this.push(toPush);
    }
  } else {
    this.push(obj);
  }
  callback();
};