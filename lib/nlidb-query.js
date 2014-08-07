module.exports = NlidbQuery;

var rutil = require('./relUtil');
var MatchStream = require('./streams/matchStream');
var FunctionalStream = require('./streams/functionalStream');
var ProjectStream = require('./streams/projectStream');
var UniqueFilterStream = require('./streams/uniqueFilterStream');
var PassThrough = require('stream').PassThrough;

function NlidbQuery (db, links, functions) {
  this.db = db;
  this.links = links;
  this.functions = functions;
}

NlidbQuery.stream = {};
NlidbQuery.stream.Match = MatchStream;
NlidbQuery.stream.Functional = FunctionalStream;
NlidbQuery.stream.Project = ProjectStream;
NlidbQuery.stream.Unique = UniqueFilterStream;

NlidbQuery.prototype.process = function (query) {
  return this.buildStreamChains(query, {db: this.db, functions: this.functions, links: this.links});
}

NlidbQuery.prototype.buildStreamChains = function (query, opt) {
  var that = this;
  return this.collectManyLevelResults(query, function onNextLvl(query, res, buf, i, j) {      
    opt.last = !i;
    var k = res.length;
    if(k){
      for(; k--;){
        opt.streamFrom = res[k];
        buf.push(that.streamRelation(rutil.copy(query[i][j]), opt));
      }
    } else {          
      buf.push(that.streamRelation(rutil.copy(query[i][j]), opt));
    }
  });
}

NlidbQuery.prototype.streamRelation = function  (rel, opt) {
  var functionalPlumbing = this.buildFunctionalPlumbing(rel, opt);
  var projectStream = new ProjectStream(opt.last? null : rutil.project(rel));    
  functionalPlumbing.tail.pipe(projectStream);
  if (opt.streamFrom) {
    var mapping = opt.links[opt.streamFrom.rel][rel.rel];
    var matchStream = new MatchStream(rutil.match(rel), mapping);
    opt.streamFrom.pipe(matchStream);
    matchStream.on('readable', function () {
      opt.db.streamData(matchStream.read(), rel.rel).pipe(functionalPlumbing.head);
    });
  } else {
    opt.db.streamData(rutil.match(rel), rel.rel).pipe(functionalPlumbing.head);
  }
  projectStream.rel = rel.rel;
  return opt.last ? projectStream.pipe(new UniqueFilterStream()) : projectStream;
}

NlidbQuery.prototype.buildFunctionalPlumbing = function (rel, opt) {
  var head = this.nextFunctionalStream(rel, opt);
  if (head) {      
    var tail = head;
    while (next = this.nextFunctionalStream(rel, opt)) {
      tail = tail.pipe(next);
    }
  } else {
    var tail = head = new PassThrough({objectMode: true});
  }
  return {head: head, tail: tail};
}

NlidbQuery.prototype.nextFunctionalStream = function (rel, opt) {
  var nextF = rutil.nextFIdx(rel, opt.functions);
  if (nextF === -1) {
    return null;
  }
  var kvf = rel.kvf[nextF];
  rel.kvf[nextF] = undefined;
  var firstF = kvf.f.shift();
  var f = opt.functions[firstF](rel, kvf.k, kvf.v, kvf.f);    
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
  