var FunctionalStream = require('./streams/functionalStream');
var MatchStream = require('./streams/matchStream');
var ProjectStream = require('./streams/projectStream');
var ReStream = require('./streams/reStream');
var UniqueFilterStream = require('./streams/uniqueFilterStream');
var relUtil = require('./relUtil');

module.exports = function (db, links, functions) {
  
  function process (query) {
    return buildStreamChains(query);
  }
  
  function buildStreamChains (query) {
    var i = query.length;
    var streams = [];
    for(; i--;){
      var j = query[i].length;
      var newStreams = [];
      for(; j--;){
        var k = streams.length;
        if(k){
          for(; k--;){
            newStreams.push(streamRelation(query[i][j], {last: !i, streamFrom: streams[k]}));
          }
        } else {
          newStreams.push(streamRelation(query[i][j], {last: !i}));
        }
      }
      streams = newStreams;
    }
    return streams;
  }
  
  function streamRelation (rel, options) {
    var rel = relUtil.copy(rel);
    var stream = createInitialStream(relUtil.match(rel), options, rel.rel);  
    var nStream;
    while(nStream = nextStream(rel)){
      stream = stream.pipe(nStream);
    }
    if(!options.last){
      stream = stream.pipe(new ProjectStream(relUtil.project(rel)));
    }
    return stream;
  }
  
  function createInitialStream(match, options, rel){
    if(options.streamFrom){
      var queryStream = new ReStream(function (m) {
        return db.streamData(m, rel);
      });
      var stream = options.streamFrom
        .pipe(new MatchStream(match))
        .pipe(queryStream)
        .pipe(new UniqueFilterStream());
    } else {
      var stream = db.streamData(match, rel);
    }
    return stream;
  }
  
  function nextStream (rel) {
    var nextFIdx = relUtil.nextFunctionIdx(rel);
    if (nextFIdx === -1) {
      return null;
    }
    var kvf = rel.kvf[nextFIdx];
    rel.kvf[nextFIdx] = undefined;
    if (functions.__isTransform__(kvf)) {
      var f = functions[kvf.f.shift()](rel, kvf.k, kvf.v, kvf.f);
      return new FunctionalStream(f._transform, f._flush);
    } else {
      var f = functions[kvf.f.shift()](rel, kvf.k, kvf.v, kvf.f);
      return new ReStream(function (m) {
        return db.streamData(f._requery(m), rel.rel);
      });
    }
  }
  
  return {
    process: process,
    buildStreamChains: buildStreamChains,
    streamRelation: streamRelation,
    createInitialStream: createInitialStream,
    nextStream: nextStream
  };
  
};