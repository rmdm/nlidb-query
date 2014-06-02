module.exports = function(db, links, functions){
  return require('./nlidb-query')(db, links, functions).query;
}