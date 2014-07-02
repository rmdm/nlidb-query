var UniqueFilterStream = require('../../lib/streams/uniqueFilterStream');

describe('UniqueFilterStream', function () {
  
  var fake;
  
  beforeEach(function () {  
    var _transform = UniqueFilterStream.prototype._transform;
    var push = function () {};
    
    fake = {
      _transform: _transform,
      push: push,
      set: {
        1:true,
        2:true
      },
      by: '_id'
    };
    
    spyOn(fake, 'push');  
  });
  
  it('has _transform method used to pass by "this.by" only that objects which have not been already passed', function () {
    fake._transform({_id: 1}, 0, function(){});
    expect(fake.push).not.toHaveBeenCalled();
    fake._transform({_id: 2}, 0, function(){});
    expect(fake.push).not.toHaveBeenCalled();
    fake._transform({_id: 3}, 0, function(){});
    expect(fake.push).toHaveBeenCalled();
  });
  
});
