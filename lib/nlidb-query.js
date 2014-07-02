var StreamRealation = require('./streams/streamRelation');

module.exports = function (db, links, functions) {
  
  function process (query) {
    return buildStreamChains(query);
  }
  
  function buildStreamChains (query) {
    return collectManyLevelResults(query, function onNextLvl(query, res, buf, i, j) {      
      var opt = {last: !i, db: db, functions: functions};
      var k = res.length;
      if(k){
        for(; k--;){
          opt.streamFrom = streams[k];
          buf.push(new StreamRelation(query[i][j], opt));
        }
      } else {          
        buf.push(new StreamRelation(query[i][j], opt));
      }
    });
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
    collectManyLevelResults: collectManyLevelResults
  };
  
};
