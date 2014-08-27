module.exports = NlidbQuery;

var rutil = require('./relUtil');
var stream = require('./stream');
var MatchStream = stream.Match
var FunctionalStream = stream.Functional;
var ProjectStream = stream.Project;
var UniqueFilterStream = stream.Unique;
var StringifyStream = stream.Stringify;

var PassThrough = require('stream').PassThrough;

function NlidbQuery (db, links, functions) {
  if (!db.streamData) {
    throw new Error('db object should have "streamData" method');
  }
  this.db = db;
  this.links = links;
  this.functions = functions;
}

NlidbQuery.stream = stream;

NlidbQuery.isEmpty = function (arr2d) {
  if (Array.isArray(arr2d)) {
    if (arr2d[0] && Array.isArray(arr2d[0])) {
      for (var i in arr2d) {
        for (var j in arr2d[i]) {
          if (arr2d[i][j]) {
            return false;
          }
        }
      }
    }
  }
  return true;
};

NlidbQuery.prototype.process = function (query) {
  if (NlidbQuery.isEmpty(query)) {
    return [];
  }
  return this.buildStreamChains(query);
}

NlidbQuery.prototype.buildStreamChains = function (query) {
  var that = this;
  return this.collectManyLevelResults(query, function onNextLvl(query, res, buf, i, j) {   
    var k = res.length;
    if(k){
      for(; k--;){
        buf.push(that.streamRelation(rutil.copy(query[i][j]), !i, res[k]));
      }
    } else {          
      buf.push(that.streamRelation(rutil.copy(query[i][j]), !i));
    }
  });
}

NlidbQuery.prototype.streamRelation = function  (rel, isLast, streamFrom) {
  var functionalPlumbing = this.buildFunctionalPlumbing(rel);
  var projectStream = new ProjectStream(null);    
  functionalPlumbing.tail.pipe(projectStream);
  if (streamFrom) {
    var mapping = this.links(streamFrom.rel, rel.rel);
    var matchStream = new MatchStream(rutil.match(rel), mapping);
    streamFrom.pipe(matchStream);
    var that = this;
    matchStream.on('readable', function () {
      that.db.streamData(rel.rel, matchStream.read()).pipe(functionalPlumbing.head);
    });
  } else {
    var m = rutil.match(rel);
    if (!isLast && Object.keys(m).length === 0) {
      throw new Error('Too broad query');
    }
    this.db.streamData(rel.rel, m).pipe(functionalPlumbing.head);
  }
  projectStream.rel = rel.rel;
  return isLast ? projectStream.pipe(new UniqueFilterStream()) : projectStream;
}

NlidbQuery.prototype.buildFunctionalPlumbing = function (rel) {
  var head = this.nextFunctionalStream(rel);
  if (head) {      
    var tail = head;
    while (next = this.nextFunctionalStream(rel)) {
      tail = tail.pipe(next);
    }
  } else {
    var tail = head = new PassThrough({objectMode: true});
  }
  return {head: head, tail: tail};
}

NlidbQuery.prototype.nextFunctionalStream = function (rel) {
  var nextF = rutil.nextFIdx(rel, this.functions.priority);
  if (nextF === -1) {
    return null;
  }
  var kvf = rel.kvf[nextF];
  rel.kvf[nextF] = undefined;
  var firstF = kvf.f.shift();
  var f = this.functions.get(firstF)(rel, kvf.k, kvf.v, kvf.f);    
  return new FunctionalStream(f._transform, f._flush);
}

NlidbQuery.prototype.collectManyLevelResults = function (arr2D, onNextLevel) {
  var i = arr2D.length;
  var mainResults = [];
  for(; i--;){
    var j = arr2D[i].length;
    var buf = [];
    for(; j--;){
      onNextLevel(arr2D, mainResults, buf, i, j);
    }
    if (buf.length) {
      mainResults = buf;
    }
  }
  return mainResults;
}
