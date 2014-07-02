var nlidb_query = require('../lib/nlidb-query')(null, null, null); 

describe('Set of methods to complete querying db according to some formal representation', function(){
  
  it('ueses collectManyLevelResults function to build stream chains', function(){
    
    function onNextLvl (arr, res, buf, i, j) {
      var k = res.length;
      if (k) {
        for (; k--;) {
          buf.push(res[k] * arr[i][j]);
        }
      } else {
        buf.push(arr[i][j]);
      }
    }
    
    var res = nlidb_query.collectManyLevelResults([[]], onNextLvl);
    expect(res.length).toBe(0);
    var res = nlidb_query.collectManyLevelResults([[1]], onNextLvl);
    expect(res.length).toBe(1);
    var res = nlidb_query.collectManyLevelResults([[1], [2]], onNextLvl);
    expect(res.length).toBe(1);
    var res = nlidb_query.collectManyLevelResults([[1], [2], [3], [4], [5]], onNextLvl);
    expect(res.length).toBe(1);
    var res = nlidb_query.collectManyLevelResults([[1], [2, 3], [3, 4, 5]], onNextLvl);
    expect(res.length).toBe(6);
    var res = nlidb_query.collectManyLevelResults([[], [1], [2, 3], [3, 4, 5]], onNextLvl);
    expect(res.length).toBe(6);
    var res = nlidb_query.collectManyLevelResults([[1], [2, 3], [3, 4, 5], []], onNextLvl);
    expect(res.length).toBe(6);
    var res = nlidb_query.collectManyLevelResults([[], [1], [2, 3], [3, 4, 5], []], onNextLvl);
    expect(res.length).toBe(6);
    var res = nlidb_query.collectManyLevelResults([[1], [2, 3], [3, 4, 5]], onNextLvl);
    expect(res.length).toBe(6);
    var res = nlidb_query.collectManyLevelResults([[1], [2, 3], [3, 4, 5], [6, 7, 8, 9], [10, 11, 12, 13, 14]], onNextLvl);
    expect(res.length).toBe(120);
    
  });
    
});