var MatchStream = require('./streams/matchStream');
var FunctionalStream = require('./streams/functionalStream');
var ProjectStream = require('./streams/projectStream');
var UniqueFilterStream = require('./streams/uniqueFilterStream');
var StringifyStream = require('./streams/stringifyStream');

var streams = {
  Match: MatchStream,
  Functional: FunctionalStream,
  Project: ProjectStream,
  Unique: UniqueFilterStream,
  Stringify: StringifyStream
}

module.exports = streams;
