var MatchStream = require('../../lib/streams/matchStream');

describe('MatchStream', function () {

  var fake = {
    _copyProps: MatchStream.prototype._copyProps,
    _mergeProps: MatchStream.prototype._mergeProps,
    _generateOutput: MatchStream.prototype._generateOutput
  }
  
  it('has method _copyProps to copy properties of one object to anoter', function () {
    var obj = {};
    var e = {a: 45};
    MatchStream.prototype._copyProps.call(null, obj, e);
    expect(obj.a).toBe(45);
  });
  
  it('has method _mergeProps to copy properties of many objects into one object', function () {
    var obj = {};
    var objs = [
      {a: 3, b: 4},
      {c: 5},
      {a: 7},
      {}
    ];
    MatchStream.prototype._mergeProps.call(null, obj, objs);
    expect(obj.b).toBe(4);
    expect(obj.c).toBe(5);
    expect(Array.isArray(obj.a)).toBe(true);
    expect(obj.a.length).toBe(2);
    expect(obj.a[0]).toBe(3);
    expect(obj.a[1]).toBe(7);
  });
  
  it('has method _generateOutput to get final representation passed to next stream', function () {    
    var queue = [
      {a: 1},
      {b: 2},
      {c: 3},
      {},
      {d: [4,5]}
    ];
    var match = {a: [3,5], b: 1};
    
    var res = fake._generateOutput(queue, match);
    
    expect(queue.length).toBe(0);    
    
    expect(Object.keys(res).length).toBe(4);
    
    expect(Array.isArray(res.a)).toBe(true);
    expect(Array.isArray(res.b)).toBe(true);
    expect(Array.isArray(res.c)).toBe(false);
    expect(Array.isArray(res.d)).toBe(true);
    
    expect(res.a.length).toBe(3);
    expect(res.b.length).toBe(2);
    expect(res.d.length).toBe(2);
    expect(res.c).toBe(3);
    
    expect(res.a[0]).toBe(3);
    expect(res.a[1]).toBe(5);
    expect(res.a[2]).toBe(1);
    
    expect(res.b[0]).toBe(1);
    expect(res.b[1]).toBe(2);
    
    expect(res.d[0]).toBe(4);
    expect(res.d[1]).toBe(5);
  });
  
});
