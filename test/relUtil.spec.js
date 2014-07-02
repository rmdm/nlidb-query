var rutil = require('../lib/relUtil');

describe('RelUtil', function () {

  it('is a set of util functions', function () {
    expect(typeof rutil.match).toBe('function');
    expect(typeof rutil.project).toBe('function');
    expect(typeof rutil.copy).toBe('function');
    expect(typeof rutil.nextFIdx).toBe('function');
    expect(typeof rutil.append).toBe('function');
  });
  
  it('has function copy used to copy a relation', function () {
    var rel = {rel: 'A', kvf: [{k: 'k1'}, {k: 'k2', v: 'v2'}, {k: 'k3', f: ['f3']}]};
    var copy = rutil.copy(rel);    
    expect(rel.rel).toBe(copy.rel);
    
    expect(rel.kvf[2]).not.toBe(copy.kvf[2]);
    
    expect(rel.kvf[2].k).toBe(copy.kvf[2].k);
    expect(rel.kvf[2].v).toBe(copy.kvf[2].v);
    expect(rel.kvf[2].f).not.toBe(copy.kvf[2].f);
    expect(rel.kvf[2].f.length).toBe(copy.kvf[2].f.length);
    expect(rel.kvf[2].f[0]).toBe(copy.kvf[2].f[0]);
        
    rel.kvf.shift();
    expect(rel.kvf.length).toBe(copy.kvf.length - 1);    
  });
  
  it('has function match used to collect f-less and v-full elements of kvf', function () {
    var rel1 = {rel: 'A', kvf: [{k: 'k1'}, {k: 'k2', v: 'v2'}, {k: 'k3', f: ['f3']}]};
    var match1ShouldBe = {k2: 'v2'};
    var match1 = rutil.match(rel1);
    
    var rel2 = {rel: 'A', kvf: []};
    var match2ShouldBe = {};
    var match2 = rutil.match(rel2);
    
    var rel3 = {rel: 'A', kvf: [{k: 'k1'}, {k: 'k2', v: 'v20'}, {k: 'k2', v: 'v2'}, {k: 'k3', f: ['f3']}]};
    var match3ShouldBe = {k2: ['v2', 'v20']};
    var match3 = rutil.match(rel3);
    
    cmpMatches(match1, match1ShouldBe);
    cmpMatches(match2, match2ShouldBe);
    cmpMatches(match3, match3ShouldBe);
    
    function cmpMatches(match, matchShouldBe) {
      var k1 = Object.keys(match);
      var k1s = Object.keys(matchShouldBe);
      
      expect(k1.length).toBe(k1s.length);
      
      for (var k in match) {
        if(Array.isArray(match[k])){
          expect(Array.isArray(matchShouldBe[k])).toBe(true);
          for (var i in match[k]) {
            expect(matchShouldBe[k].indexOf(match[k][i])).not.toBe(-1);
          }
        } else {
          expect(match[k]).toBe(matchShouldBe[k]);
        }
      }
    }    
  });
  
  it('has function project used to select set(an array) of v- and f-less kvf elements', function () {
    var rel1 = {rel: 'A', kvf: [{k: 'k1'}, {k: 'k2', v: 'v2'}, {k: 'k3', f: ['f3']}]};
    var project1ShouldBe = ['k1'];
    var project1 = rutil.project(rel1);
    
    var rel2 = {rel: 'A', kvf: [{k: 'k2', v: 'v2'}, {k: 'k3', f: ['f3']}]};
    var project2ShouldBe = [];
    var project2 = rutil.project(rel2);
    
    cmpProjections(project1, project1ShouldBe);
    cmpProjections(project2, project2ShouldBe);
    
    function cmpProjections (p1, p2) {
      expect(p1.length).toBe(p2.length);
      for (var i in p1) {
        expect(p2.indexOf(p1[i])).not.toBe(-1);
      }
    }    
  });
  
  it('has function nextFIdx used to select next function based on priority', function () {
    var p = {
      a: 0,
      b: 1,
      c: 2
    };
    
    var rel = {rel: 'A', kvf: [{k: 'k1', f: ['a']}, {k: 'k2', f: ['c', 'b']}, {k: 'k3', f: ['a']}, {k: 'k4'}]};
    expect(rutil.nextFIdx(rel, p)).toBe(2);
    
    rel = {rel: 'A', kvf: [{k: 'k1', f: ['a']}, {k: 'k2', f: ['c', 'b']}, {k: 'k3', f: []}, {k: 'k4'}]};
    expect(rutil.nextFIdx(rel, p)).toBe(0);
    
    rel = {rel: 'A', kvf: [undefined, {k: 'k2', f: ['c', 'b']}, {k: 'k3', f: []}, {k: 'k4'}]};
    expect(rutil.nextFIdx(rel, p)).toBe(1);
    
    rel = {rel: 'A', kvf: [undefined, {k: 'k2', f: ['b']}, {k: 'k3', f: []}, {k: 'k4'}]};
    expect(rutil.nextFIdx(rel, p)).toBe(1);
    
    rel = {rel: 'A', kvf: [undefined, {k: 'k2', f: []}, {k: 'k3', f: []}, {k: 'k4'}]};
    expect(rutil.nextFIdx(rel, p)).toBe(-1);
  });
  
  it('has helper function append used to add a kv pair. if already existed pushes to array', function () {
    var obj = {};
    
    rutil.append(obj, 'k1', 'v1');
    expect(obj['k1']).toBe('v1');
    
    rutil.append(obj, 'k2', 'v2');
    expect(obj['k2']).toBe('v2');
    
    rutil.append(obj, 'k1', 'v3');
    expect(Array.isArray(obj['k1'])).toBe(true);
    expect(obj['k1'].length).toBe(2);
    expect(obj['k1'][0]).toBe('v1');
    expect(obj['k1'][1]).toBe('v3');
  });
  
});
