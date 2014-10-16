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
    return {query: [], streams: []};
  }
  return {query: query, streams: this.buildStreamChains(query)};
}

NlidbQuery.prototype.buildStreamChains = function (query) {
  var that = this;
  return this.collectManyLevelResults(query, function onNextLvl(query, res, buf, i, j) {   
    var k = res.length;
    if(k){
      for(; k--;){
        var p = res[k].path.slice();
        p.unshift(j);
        var stream = that.streamRelation(rutil.copy(query[i][j]), !i, res[k].stream);
        buf.push({path: p, stream: stream, lastQuery: stream.lastQuery, lastRel: stream.rel, lastF: stream.lastF});
      }
    } else {
      var stream = that.streamRelation(rutil.copy(query[i][j]), !i);
      buf.push({path: [j], stream: stream, lastQuery: stream.lastQuery, lastRel: stream.rel, lastF: stream.lastF});
    }
  });
}

NlidbQuery.prototype.streamRelation = function  (rel, isLast, streamFrom) {
  if (isLast) {
    var fp = this.buildFunctionalPlumbing(rutil.copy(rel));
  }
  var functionalPlumbing = this.buildFunctionalPlumbing(rel);
  var projectStream = new ProjectStream(null);    
  functionalPlumbing.tail.pipe(projectStream);
  var lastQuery;
  if (streamFrom) {
    lastQuery = rutil.match(rel);
    var mapping = this.links(streamFrom.rel, rel.rel);
    var matchStream = new MatchStream(lastQuery, mapping);
    streamFrom.pipe(matchStream);
    var that = this;
    var matches = 0;
    var mEnded = false;
    var ended = 0;
    matchStream.on('readable', function () {
      matches++;
      var dbstream = that.db.streamData(rel.rel, matchStream.read());
      dbstream.on('data', function (data) {
        functionalPlumbing.head.write(data);
      });
      dbstream.on('end', function () {
        ended++;
        if (matches === ended && mEnded) {
          functionalPlumbing.head.end();
        }
      });
      matchStream.on('end', function () {
        mEnded = true;
      });
    });
  } else {
    lastQuery = rutil.match(rel);
    if (!isLast && Object.keys(lastQuery).length === 0 && functionalPlumbing.bare) {
      var e = new Error('Too broad query');
      e.level = 'nlidb_query';
      throw e;
    }
    this.db.streamData(rel.rel, lastQuery).pipe(functionalPlumbing.head);
  }
  if (isLast) {
    projectStream = projectStream.pipe(new UniqueFilterStream());
    projectStream.lastQuery = lastQuery;
    projectStream.lastF = fp;
  }  
  projectStream.rel = rel.rel;
  return projectStream;
}

NlidbQuery.prototype.buildFunctionalPlumbing = function (rel) {
  var head = this.nextFunctionalStream(rel);
  if (head) {
    var bare = false;
    var tail = head;
    while (next = this.nextFunctionalStream(rel)) {
      tail = tail.pipe(next);
    }
  } else {
    var bare = true;
    var tail = head = new PassThrough({objectMode: true});
  }
  return {head: head, tail: tail, bare: bare};
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
