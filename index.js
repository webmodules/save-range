
/**
 * Module dependencies.
 */

var uid = require('component-uid');
var getDocument = require('get-document');
var insertNode = require('range-insert-node');
var debug = require('debug')('save-range');

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
  var parent = range.commonAncestorContainer;

  // ensure that "parent" is not a TextNode
  while (parent && parent.nodeType === 3 /* Node.TEXT_NODE */) {
    parent = parent.parentNode;
  }

  var info = {
    id: uid(8),
    range: range,
    document: doc,
    parent: parent,
    collapsed: Boolean(range.collapsed)
  };
  debug('generated id %o to save Range instance', info.id);

  // end marker
  var endRange = range.cloneRange();
  endRange.collapse(false);

  var endMarker = doc.createElement('span');
  endMarker.className = 'save-range-marker ' + info.id + '-end';
  debug('inserting "end marker" %o', endMarker);

  insertNode(endRange, endMarker);

  // start marker (if not `collapsed`)
  if (info.collapsed) {
    debug('skipping "start marker" because Range is `collapsed`');
  } else {
    var startNode = range.startContainer;
    var startOffset = range.startOffset;

    var startRange = range.cloneRange();
    startRange.collapse(true);

    var startMarker = doc.createElement('span');
    startMarker.className = 'save-range-marker ' + info.id + '-start';
    debug('inserting "start marker" %o', startMarker);

    insertNode(startRange, startMarker);

    if (startNode.nodeType === 3) {
      startNode = startMarker.nextSibling;
      startOffset = 0;
      range.setStart(startNode, startOffset);
    }
  }

  return info;
}

/**
 * Restores a `range` instance with the given range `info` object returned from
 * a prevous call to `save()`.
 *
 * @param {Object} info - the serialized Range info object returned from
 *    a previous `save()` call.
 * @param {Element} [parent] - Optional explicit `parent` DOM element to check for
 *    the DOM markers inside of.
 * @return {Range} return a Range instance with its boundaries set to the original
 *    points from the `save()` call.
 * @public
 */

function load (info, parent) {
  var range = info.range;
  if (!parent) parent = info.parent || info.document;
  debug('loading Range using parent %o', parent);

  var end = parent.getElementsByClassName(info.id  + '-end')[0];
  if (end) {
    range.setEndAfter(end);
  } else {
    debug('could not find DOM marker with class name %o', info.id  + '-end');
  }

  if (info.collapsed) {
    if (end) range.setStartBefore(end);
  } else {
    var start = parent.getElementsByClassName(info.id  + '-start')[0];
    if (start) {
      range.setStartBefore(start);

      // remove "start marker" from the DOM
      start.parentNode.removeChild(start);
    } else {
      debug('could not find DOM marker with class name %o', info.id  + '-start');
    }
  }

  // remove "end marker" from the DOM
  if (end) end.parentNode.removeChild(end);

  return range;
}
