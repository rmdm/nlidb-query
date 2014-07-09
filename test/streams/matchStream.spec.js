var MatchStream = require('../../lib/streams/matchStream');

describe('MatchStream', function () {

  var fake = {
    unite: MatchStream.prototype.unite,
    copy: MatchStream.prototype.copy,
    filter: MatchStream.prototype.filter,
    map: MatchStream.prototype.map
  }
  
  describe('unite method', function () {

    it('merges passed objects', function () {
      fake.allowed = ['a', 'b'];
      fake.mapping = {
        a: 'a',
        b: 'b'
      };
      var res = fake.unite({a: 4}, {b: 5});
      expect(res.a).toBe(4);
      expect(res.b).toBe(5);
      
      var res = fake.unite({a: 4}, {a: 5});
      expect(res.a.length).toBe(2);
      expect(res.a.indexOf(4)).not.toBe(-1);
      expect(res.a.indexOf(5)).not.toBe(-1);     
      delete fake.allowed;
      delete fake.mapping;
    });
 
  });
  
  describe('copy method', function () {
  
    it('copies only-array-not-object-containing objects', function () {
      var obj = {
        x: [1, 2],
        y: 3
      };
      var res = fake.copy(obj);
      expect(Object.keys(res).length).toBe(2);
      expect(res.x.length).toBe(2);
      expect(obj.x.length).toBe(2);
      obj.x.push(4);
      expect(res.x.length).toBe(2);
      expect(obj.x.length).toBe(3);
      expect(res.y).toBe(3);
    });
    
  });
  
  describe('filter method', function () {
  
    it('filters object props according to list of allowed props', function () {    
      var obj = {
        x: 1,
        y: 2,
        z: 3
      };
      var allowed = ['z'];
      fake.filter(obj, allowed);
      expect(obj.z).toBe(3);
      expect(obj.x).not.toBeDefined();
      expect(obj.y).not.toBeDefined();
    });
    
  });
  
  describe('map method', function () {
    
    it('renames props of an object', function () {
      var obj = {
        a: 1,
        b: 2,
        c: 3
      };
      var mapping = {
        a: 'x',
        b: 'y',
        c: 'z'
      }
      fake.map(obj, mapping);
      expect(obj.x).toBe(1);
      expect(obj.y).toBe(2);
      expect(obj.z).toBe(3);
      expect(obj.a).not.toBeDefined();
      expect(obj.b).not.toBeDefined();
      expect(obj.c).not.toBeDefined();
    });
    
  });
  
});
