var NlidbQuery = require('../lib/nlidb-query');

describe('Set of methods to complete querying db according to some formal representation', function(){
  
  var nlidb_query;
  var PassThrough = require('stream').PassThrough;
  var UniqueFilterStream = require('../lib/streams/uniqueFilterStream');
  var ProjectStream = require('../lib/streams/projectStream');
  
  beforeEach(function () {
    funcs = {
      f1: function () {
        return {
          _transform: function () {},
          _flush: function () {}
        };
      },
      get: function (f) {
        return this[f];
      }
    };
    nlidb_query = new NlidbQuery({
        streamData: function () { return new PassThrough(); }
      }, function () {return {a: 'a'};}, funcs); 
  });
  
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
  
  it('static "isEmpty" checks meaning of results', function(){    
    
    function isEmpty (stuff, shouldBe) {
      expect(NlidbQuery.isEmpty(stuff)).toBe(shouldBe);
    }
    
    isEmpty([], true);
    isEmpty([[]], true);
    isEmpty({}, true);
    isEmpty(function() {}, true);
    isEmpty([[1]], false);    
    
  });
  
  it('has function nextFunctionalStream to define next functional stream', function () {
    var rel = {rel: 'A', kvf: []};
    expect(nlidb_query.nextFunctionalStream(rel, {functions: funcs})).toBe(null);
    
    rel.kvf.push({k: 'k1', f: ['f1']});    
    expect(nlidb_query.nextFunctionalStream(rel, {functions: funcs})).not.toBe(null);    
  });
  
  it('has function buildFunctionalPlumbing to build part of stream chain', function () {
    var rel = {rel: 'A', kvf: []};
    var res = nlidb_query.buildFunctionalPlumbing(rel, {functions: funcs});
    expect(res.head).toBe(res.tail);
    expect(res.head instanceof PassThrough).toBe(true);
    expect(res.tail instanceof PassThrough).toBe(true);
    
    var rel = {rel: 'A', kvf: [{k: 'k1', f: ['f1']}]};
    var res = nlidb_query.buildFunctionalPlumbing(rel, {functions: funcs});
    expect(res.head).toBe(res.tail);
    expect(res.head instanceof PassThrough).toBe(false);
    expect(res.tail instanceof PassThrough).toBe(false);
    
    var rel = {rel: 'A', kvf: [{k: 'k1', f: ['f1']}, {k: 'k2', f: ['f1']}]};
    var res = nlidb_query.buildFunctionalPlumbing(rel, {functions: funcs});
    expect(res.head).not.toBe(res.tail);
    expect(res.head instanceof PassThrough).toBe(false);
    expect(res.tail instanceof PassThrough).toBe(false);
  });
  
  it('has function streamRelation to make a stream of current relation', function () {    
    var rel = {rel: 'A', kvf: [{k: 'k1', v: 'v1'}]};
    var res = nlidb_query.streamRelation(rel);
    expect(res instanceof ProjectStream).toBe(true);
    
    var res = nlidb_query.streamRelation(rel, true);
    expect(res instanceof UniqueFilterStream).toBe(true);
    
    var streamFrom = new PassThrough();
    streamFrom.rel = 'A';
    var res = nlidb_query.streamRelation(rel, true, streamFrom);
    expect(res instanceof UniqueFilterStream).toBe(true);
  });
  
  it('has function buildStreamChains', function () {
    var query = [
      [{rel: 'A', kvf: [{k: 'k1'}]}], 
      [{rel: 'A', kvf: [{k: 'k1'}]}, {rel: 'A', kvf: [{k: 'k1'}]}], 
      [{rel: 'A', kvf: [{k: 'k1'}]}, {rel: 'A', kvf: [{k: 'k1'}]}, {rel: 'A', kvf: [{k: 'k1'}]}],
      [{rel: 'A', kvf: [{k: 'k1', v: 'v1'}]}]
    ];
    var res = nlidb_query.buildStreamChains(query);
    expect(res.length).toBe(6);
  });
    
  it('will throw too broad query when stating reqpresentation falls to empty object', function () {
    var query = [
      [{rel: 'A', kvf: [{k: 'k1'}]}], 
      [{rel: 'A', kvf: [{k: 'k1'}]}, {rel: 'A', kvf: [{k: 'k1'}]}], 
      [{rel: 'A', kvf: [{k: 'k1'}]}, {rel: 'A', kvf: [{k: 'k1'}]}, {rel: 'A', kvf: [{k: 'k1'}]}],
      [{rel: 'A', kvf: [{k: 'k1'}]}]
    ];
    expect(function (){nlidb_query.buildStreamChains(query);}).toThrow();
  });
    
});