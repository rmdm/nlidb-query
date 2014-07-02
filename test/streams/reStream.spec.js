var ReStream = require('../../lib/streams/ReStream');
var Readable = require('stream').Readable;
var Transform = require('stream').Transform;
var util = require('util');

describe('ReStream', function () {
  
  it('is used to create a stream on any write and stream it into an end point stream, which can be piped', function () {  
    util.inherits(R, Readable);
    
    function R (obj) {
      Readable.call(this, {objectMode: true});
      this.obj = obj;
      this.counter = 0;
    }

    R.prototype._read = function (size) {
      if(this.counter++ < 10){
        this.push(this.obj);
      } else {
        this.push(null);
      }
    }

    util.inherits(T, Transform);

    function T(){
      Transform.call(this);
      this._writableState.objectMode = true;
      this.count = 0;
      this.expected = 1;
    }

    T.prototype._transform = function (obj, _, cb) {
      expect(obj).toBe(this.expected);
      if (++this.count === 10) {
        this.count = 0;
        this.expected++;
      }      
      cb();
    };

    var r = new ReStream(function(obj){
      return new R(obj);
    }, function () {
      return true;
    });

    r.write(1);
    r.write(2);    
    r.write(3);
    r.end();

    r.pipe(new T());

  });
  
});
