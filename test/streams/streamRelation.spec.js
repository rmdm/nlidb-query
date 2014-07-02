var StreamRelation = require('../../lib/streams/streamRelation');
var FunctionalStream = require('../../lib/streams/functionalStream');
var ReStream = require('../../lib/streams/reStream');
var PassThrough = require('stream').PassThrough;
var util = require('util');

describe('StreamRelation', function () {

  it('has mathod initial used to define head of stream chain', function () {
  
    var rel = {rel: 'A', kvf: []}; 
    var obj = {db: {streamData: function () {
        return new PassThrough({objectMode: true});
      }}
    };
    var streamFrom = new PassThrough({objectMode: true});
    
    var stream = StreamRelation.prototype.initial(rel, obj);
    expect(stream instanceof PassThrough).toBe(true);
    
    obj.streamFrom = streamFrom;
    var stream = StreamRelation.prototype.initial(rel, obj);
    expect(stream instanceof PassThrough).not.toBe(true);
  });
  
  it('has method nextFunctionalStream used to get next stream to append', function () {
    rel = {rel: 'A', kvf: []}; 
    obj = {db: {streamData: function () {
        var pt = new PassThrough({objectMode: true});
        pt.write(1);
        pt.end();
        return pt;
      }}
    };
    streamFrom = new PassThrough({objectMode: true});
    functions = {
      __isTransform__: function (k, v, f) {
        return f !== 'a';
      },
      a: function (rel, k, v, f) {
        return {
          _transform: function () {},
          _flush: function () {},
          _require: function (m) {}
        }
      },
      b: function (rel, k, v, f) {
        return {
          _transform: function () {},
          _flush: function () {}
        }
      }
    };
  
    var stream = StreamRelation.prototype.nextFunctionalStream(rel, obj);
    expect(stream).toBe(null);
    
    obj.functions = functions;
    var stream = StreamRelation.prototype.nextFunctionalStream({rel: 'A', kvf: [{k: 'atr', f: ['b']}]}, obj);
    expect(stream instanceof FunctionalStream).toBe(true);
    
    var stream = StreamRelation.prototype.nextFunctionalStream({rel: 'A', kvf: [{k: 'atr', f: ['a']}]}, obj);
    expect(stream instanceof ReStream).toBe(true);
  });
  
});
