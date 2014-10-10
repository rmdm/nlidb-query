module.exports = (function () {

  function copy (rel) {
    var copy = {rel: rel.rel, kvf: []};
    rel.kvf.forEach(function (e) {
      e && copy.kvf.push({k: e.k, v: e.v, f: e.f? e.f.slice() : undefined});
    });
    return copy;
  }
  
  function match (rel) {
    var match = {};
    var arr = rel.kvf;
    var i = arr.length;
    for (; i--;) {
      var e = arr[i];
      if (e && e.v && !e.f) {
        append(match, e.k, e.v);
        arr[i] = null;
      }
    }
    return match;
  }
  
  function append (obj, k, v) {
    if (obj[k]) {
      if (Array.isArray(obj[k])) {
        obj[k].push(v);
      } else {
        obj[k] = [obj[k], v];
      }
    } else {
      obj[k] = v;
    }
  }
  
  function project (rel) {
    var project = {};
    var arr = rel.kvf;
    var i = arr.length;
    for (; i--;) {
      var e = arr[i];
      if (e && !e.v && !e.f) {
        project[e.k] = true;
      }
    }
    return Object.keys(project);
  }
  
  function nextFIdx (rel, fPriority) {
    var candidateIdxs = [];
    var arr = rel.kvf;
    var l = arr.length;
    for (var i = 0; i < l; i++) {
      var e = arr[i];
      if (e && e.f && e.f.length) {
        candidateIdxs.push(i);
      }
    }
    var i = candidateIdxs.length;
    if (i === 0) {
      return -1;
    }
    var highestPriorityFIdx = candidateIdxs[--i];
    if(fPriority){
      for (; i--;) {
        if(fPriority[arr[highestPriorityFIdx].f[0]] > fPriority[arr[candidateIdxs[i]].f[0]]) {
          highestPriorityFIdx = candidateIdxs[i];
        }
      }
    }
    return highestPriorityFIdx;
  }
  
  return {
    copy: copy,
    match: match,
    project: project,
    nextFIdx: nextFIdx,
    append: append
  };
  
})();
