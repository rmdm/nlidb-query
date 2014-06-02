module.exports = function(db, links, functions){
  
  function query(query, callback){
    var chains = [[]];
    query.forEach(function(q){
      if(q.length > 1){
        chains.forEach(function(c){
          var arrcpy = deepCopy(c);
          c.push(q[0]);
          for(var i = 1; i < q.length; i++){
            var b = deepCopy(arrcpy);
            b.push(q[i]);
            chains.push(b);
          }
        });
      } else {
        chains.forEach(function(chain){
          chain.push(q[0]);
        });
      }
    });

    chains.forEach(function(c){
      process(c, callback);
    });    
  }

  function process(chain, callback){
    var last = chain.pop();
    var match = getMatch(last);
    db[last.rel].find(match, {_id: 0}, function(err, data){
      if(err) return callback(err);
      data = data.map(function(e){
        return e.toObject();
      });
      data = processFunctions(last, data);
      if(chain.length){
        var next = chain.length - 1;
        projectToNext(last, chain[next].rel, data).forEach(function(e){
          chain[next].kvf.push(e);
        });
        process(chain);
      } else {
        callback(null, data);
      }
    });
  };

  function processFunctions(rel, data){
    while(true){
      var candidates = [];
      var indexes = [];

      rel.kvf.forEach(function(e, i){
        if(e && e.f && e.f.length){
          candidates.push(e.f[0]);
          indexes.push(i);
        }
      });

      if(candidates.length){
        var next = candidates[0];
        var ni = indexes[0];
        candidates.forEach(function(c, i){
          if(functions.__priority__[c] < functions.__priority__[next]){
            next = c;
            ni = indexes[i];
          }
        });

        var k = rel.kvf[ni].k;
        var v = rel.kvf[ni].v;
        rel.kvf[ni].f.shift();
        var f = rel.kvf[ni].f.slice();

        rel.kvf[ni] = undefined;

        data = functions[next](rel, data, k, v, f);
      } else {
        break;
      }
    }
    return data;
  }

  function getMatch(rel){
    var match = {};
    var manyvalues = {};
    var kv = rel.kvf.filter(function(e){
      if(e.k && e.v && !e.f){
        if(match[e.k]){
          if(!Array.isArray(match[e.k])){
            match[e.k] = [match[e.k]];
          }
          match[e.k].push(e.v);
          manyvalues[e.k] = true;
        } else {
          match[e.k] = e.v;
        }
        return false;
      } else {
        return true;
      }
    });
    rel.kvf = kv;
    Object.keys(manyvalues).forEach(function(k){
      match[k] = {$in: match[k]};
    });
    return match;
  }

  function projectToNext(rel, next, data){
    var projects = [];
    var currk = []
    rel.kvf.forEach(function(e){
      if(e && e.k){
        var nextk = links[rel.rel][next][e.k];
        if(nextk){
          currk.push(e.k);
          projects.push(nextk);
        }
      }
    });
    var arr = [];
    projects.forEach(function(p, i){
      data.forEach(function(d){
        if(Array.isArray(d[currk[i]])){
          d[currk[i]].forEach(function(ck){
            arr.push({k: p, v: ck});
          });
        } else {
          arr.push({k: p, v: d[currk[i]]});
        }
      });
    });
    return arr;
  }

  function deepCopy(relarray){
    var copy = [];
    relarray.forEach(function(e){
      copy.push(copyOf(e));
    });
    return copy;
  }

  function copyOf(rel){
    var copy = {rel: rel.rel, kvf: []};
    rel.kvf.forEach(function(e){
      copy.kvf.push({k: e.k, v: e.v, f: e.f ? e.f.slice() : undefined});
    });
    return copy;
  }
  
  return {
    query: query,
    process: process,
    processFunctions: processFunctions,
    getMatch: getMatch,
    projectToNext: projectToNext,
    deepCopy: deepCopy,
    copyOf: copyOf
  }
    
};