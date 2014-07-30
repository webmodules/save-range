
/**
 * Module dependencies.
 */

var uid = require('component-uid');
var getDocument = require('get-document');
var insertNode = require('range-insert-node');

/**
 * Module exports.
 */

exports = module.exports = save;
exports.save = save;
exports.load = load;

/**
 * Saves the start and end markers of the given `range` into the DOM for
 * "revival" at a later point.
 *
 * @param {Range} range - DOM Range instance to "save"
 * @return {Object} returns an opaque object that should be passed back to the
 *    `load()` function once you want to turn the DOM serialization back into a DOM
 *    Range instance.
 * @public
 */

function save (range, doc) {
  if (!doc) doc = getDocument(range) || document;

  var info = {
    id: uid(8),
    range: range,
    parent: range.commonAncestorContainer,
    collapsed: Boolean(range.collapsed)
  };

  // end marker
  var endRange = range.cloneRange();
  endRange.collapse(false);

  var endMarker = doc.createElement('span');
  endMarker.className = 'save-range-marker ' + info.id + '-end';

  insertNode(endRange, endMarker);

  // start marker (if not `collapsed`)
  if (!info.collapsed) {
    var startRange = range.cloneRange();
    startRange.collapse(true);

    var startMarker = doc.createElement('span');
    startMarker.className = 'save-range-marker ' + info.id + '-start';

    insertNode(startRange, startMarker);
  }

  return info;
}

/**
 * Restores a `range` instance with the given range `info` object returned from
 * a prevous call to `save()`.
 *
 * @param {Object} info - the serialized Range info object returned from
 *    a previous `save()` call
 * @return {Range} return a Range instance with its boundaries set to the original
 *    points from the `save()` call
 * @public
 */

function load (info) {
  var range = info.range;
  var parent = info.parent;

  // ensure that "parent" is not a TextNode
  while (parent && parent.nodeType === 3 /* Node.TEXT_NODE */) {
    parent = parent.parentNode;
  }

  var end = parent.getElementsByClassName(info.id  + '-end')[0];
  range.setEndAfter(end);

  if (info.collapsed) {
    range.setStartBefore(end);
  } else {
    var start = parent.getElementsByClassName(info.id  + '-start')[0];
    range.setStartBefore(start);

    start.parentNode.removeChild(start);
  }

  end.parentNode.removeChild(end);

  return range;
}
