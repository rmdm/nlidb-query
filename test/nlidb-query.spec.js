var nlidb_query = require('../lib/nlidb-query')(null, null, null); //tested here methods do not depends on args

describe('Set of methods to complete querying db according to some formal representation', function(){

  var rel = {rel: 'rel1', kvf:[{k: 'k1'}, {k: 'k2', v: 'v2'}, {k: 'k2', v: 'v_2'}, {k: 'k3', v: 'v3', f: ['f3']}, {k: 'k4', f: ['f4', 'f_4']}]};
  var copy = nlidb_query.copyOf(rel);
  
  function cmpRels(expect, rel1, rel2){
    expect(rel1).not.toBe(rel2);
    expect(rel1.rel).toBe(rel2.rel);
    expect(rel1.kvf).not.toBe(rel2.kvf);
    expect(rel1.kvf[0].k).toBe(rel2.kvf[0].k); //elements of an array still can be the same
    expect(rel1.kvf[0].v).toBe(rel2.kvf[0].v);
    expect(rel1.kvf[0].f).toBe(rel2.kvf[0].f);
  }
  
  it('copyOf() method used to make a copy of formal representation part - relation', function(){    
    cmpRels(expect, rel, copy);
  });
  
  var rep = [rel, {rel: 'rel2', kvf: [{k: 'k1', v: 'v1'}]}];
  var deep = nlidb_query.deepCopy(rep);
  
  it('deepCopy() method used to make copy of entire formal representation', function(){
    cmpRels(expect, rep[0], deep[0]);
    cmpRels(expect, rep[1], deep[1]);
  });
  
  it('getMatch() method produce body of mongoDB query off an relation', function(){
    var match = nlidb_query.getMatch(rel);
    expect(Object.keys(match).length).toBe(1);
    expect(Object.keys(match)[0]).toBe('k2');
    expect(match['k2']['$in']).toBeDefined();
    expect(Array.isArray(match['k2']['$in'])).toBe(true);
    expect(match['k2']['$in'].length).toBe(2);
    expect(match['k2']['$in'][0]).toBe('v2');
    expect(match['k2']['$in'][1]).toBe('v_2');
  });
  
  //etc
  
});