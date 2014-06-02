var exp = require('../lib/export');

describe('.query function', function(){

  it('is main function of the module and only that exposed', function(){
    expect(exp.query).toBeDefined();
    expect(exp.process).not.toBeDefined();
    expect(exp.copyOf).not.toBeDefined();
  });
  
});