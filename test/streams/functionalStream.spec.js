var FunctionalStream = require('../../lib/streams/functionalStream');

describe('FunctionalStream', function () {
  
  it('is configurable transform stream', function () {
    function transform (obj, _, cb) {
      this.push(obj * 2);
      this.count++;
      cb();
    }

    function flush (cb) {
      this.push(this.count);
      cb();
    }

    var fStream = new FunctionalStream(transform, flush);
    fStream.count = 0;
    
    fStream.write(1);
    fStream.write(2);
    fStream.write(3);
    fStream.end();
    expect(fStream.read()).toBe(2);
    expect(fStream.read()).toBe(4);
    expect(fStream.read()).toBe(6);
    expect(fStream.read()).toBe(3);
  });
  
});
