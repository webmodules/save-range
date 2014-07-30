
var assert = require('assert');
var saveRange = require('../');

describe('save-range', function () {

  it('save() and load() a Range instance', function () {
    var div = document.createElement('div');
    div.innerHTML = '<b>f<i>o<u>o bar</u></i></b> baz';

    var html = div.innerHTML;

    var range = document.createRange();
    range.setStart(div.firstChild.childNodes[1].childNodes[1].firstChild, 1);
    range.setEnd(div.childNodes[1], 3);

    // save Range
    var info = saveRange(range);

    // test that the DOM has been altered in some way
    assert.notEqual(html, div.innerHTML);

    // load Range
    var r2 = saveRange.load(info);

    // test that the DOM is back to original state
    assert.equal(html, div.innerHTML);
  });

  it('save() and load() a `collapsed` Range instance', function () {
    var div = document.createElement('div');
    div.innerHTML = '<b>f<i>o<u>o bar</u></i></b> baz';

    var html = div.innerHTML;

    var range = document.createRange();
    range.setStart(div.firstChild.firstChild, 1);
    range.setEnd(div.firstChild.firstChild, 1);

    // test that the Range is collapsed
    assert(range.collapsed);

    // save Range
    var info = saveRange(range);

    // test that the DOM has been altered in some way
    assert.notEqual(html, div.innerHTML);

    // load Range
    var r2 = saveRange.load(info);

    // test that the DOM is back to original state
    assert.equal(html, div.innerHTML);

    // test that the new Range is collapsed
    assert.equal('B', r2.startContainer.nodeName);
    assert.equal(1, r2.startOffset);
    assert.equal('B', r2.endContainer.nodeName);
    assert.equal(1, r2.endOffset);
    assert(r2.collapsed);
  });

});
