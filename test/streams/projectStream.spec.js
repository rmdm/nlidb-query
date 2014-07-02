var ProjectStream = require('../../lib/streams/projectStream');

describe('ProjectStream', function () {
  
  var _transform = ProjectStream.prototype._transform;
  var push = function () {};
  
  var fake = {
    _transform: _transform,
    push: push
  };
  
  it('has _transform method that passess only projection of given objects', function () {
    spyOn(fake, 'push');
    
    fake.project = ['b'];
    
    fake._transform({a: 3}, 0, function(){});
    expect(fake.push).not.toHaveBeenCalled();
    expect(fake.push).not.toHaveBeenCalledWith({a: 3});
    
    fake._transform({a: 3, b: 4, c: 5}, 0, function(){});
    expect(fake.push).toHaveBeenCalledWith({b: 4});
    expect(fake.push).not.toHaveBeenCalledWith({a: 3, b: 4, c: 5});
    
    fake.project = ['a', 'b'];
    
    fake._transform({a: 3, b: 4, c: 5}, 0, function(){});
    expect(fake.push).toHaveBeenCalledWith({a: 3, b: 4});
    expect(fake.push).not.toHaveBeenCalledWith({a: 3, b: 4, c: 5});
  });
  
});
