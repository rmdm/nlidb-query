var Stringify = require('../../lib/streams/stringifyStream');

describe('Stringify stream', function () {

  var fake = {
    _transform: Stringify.prototype._transform,
    push: function () {},
    replacer: null,
    space: ' '
  };

  it('will transform an object to strig', function () {
    spyOn(fake, 'push');
    fake._transform({a: 1, b:2}, null, function (){});
    expect(fake.push).toHaveBeenCalledWith('{\n "a": 1,\n "b": 2\n}');
  });
  
});