module.exports = function (db, links, functions) {
  
  var rutil = require('./relUtil');
  var MatchStream = require('./streams/matchStream');
  var FunctionalStream = require('./streams/functionalStream');
  var ProjectStream = require('./streams/projectStream');
  var UniqueFilterStream = require('./streams/uniqueFilterStream');
  var PassThrough = require('stream').PassThrough;
  
  function process (query) {
    return buildStreamChains(query);
  }
  
  function buildStreamChains (query) {
    return collectManyLevelResults(query, function onNextLvl(query, res, buf, i, j) {      
      var opt = {last: !i, db: db, functions: functions, links: links};
      var k = res.length;
      if(k){
        for(; k--;){
          opt.streamFrom = res[k];
          buf.push(streamRelation(rutil.copy(query[i][j]), opt));
        }
      } else {          
        buf.push(streamRelation(rutil.copy(query[i][j]), opt));
      }
    });
  }
  
  function streamRelation (rel, opt) {
    var functionalPlumbing = buildFunctionalPlumbing(rel, opt);
    var projectStream = new ProjectStream(opt.last? null : rutil.project(rel));    
    functionalPlumbing.tail.pipe(projectStream);
    if (opt.streamFrom) {
      var mapping = opt.links[opt.streamFrom.rel][rel.rel];
      var matchStream = new MatchStream(rutil.match(rel), mapping);
      opt.streamFrom.pipe(matchStream);
      matchStream.on('data', function (data) {
        db.streamData(data, rel.rel).pipe(functionalPlumbing.head);
      });
    } else {
      db.streamData(rutil.match(rel), rel.rel).pipe(functionalPlumbing.head);
    }
    projectStream.rel = rel.rel;
    return opt.last ? projectStream.pipe(new UniqueFilterStream()) : projectStream;
  }
  
  function buildFunctionalPlumbing (rel, opt) {
    var head = nextFunctionalStream(rel, opt);
    if (head) {      
      var tail = head;
      while (next = nextFunctionalStream(rel, opt)) {
        tail = tail.pipe(next);
      }
    } else {
      var tail = head = new PassThrough({objectMode: true});
    }
    return {head: head, tail: tail};
  }
  
  function nextFunctionalStream (rel, opt) {
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
  
  function collectManyLevelResults (arr2D, onNextLevel) {
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
  
  return {
    process: process,
    buildStreamChains: buildStreamChains,
    streamRelation: streamRelation,
    buildFunctionalPlumbing: buildFunctionalPlumbing,
    nextFunctionalStream: nextFunctionalStream,
    collectManyLevelResults: collectManyLevelResults
  };
  
};
