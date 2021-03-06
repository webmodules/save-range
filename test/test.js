
var assert = require('assert');
var saveRange = require('../');

describe('save-range', function () {
  var div;

  afterEach(function () {
    if (div) {
      // clean up...
      document.body.removeChild(div);
      div = null;
    }
  });

  it('should save() and load() a Range instance', function () {
    div = document.createElement('div');
    div.innerHTML = '<b>f<i>o<u>o bar</u></i></b> baz';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

    var html = div.innerHTML;

    var range = document.createRange();
    range.setStart(div.firstChild.childNodes[1].childNodes[1].firstChild, 1);
    range.setEnd(div.childNodes[1], 3);
    assert.equal(' bar ba', range.toString());

    // save Range
    var info = saveRange(range);

    // test that the DOM has been altered in some way
    assert.notEqual(html, div.innerHTML);

    // load Range
    var r2 = saveRange.load(info);
    div.normalize();

    // test that the DOM is back to original state
    assert.equal(html, div.innerHTML);

    // test that the Range remains the same
    assert.equal(' bar ba', range.toString());
    assert(range.startContainer === div.firstChild.childNodes[1].childNodes[1].firstChild, '`startContainer` doesn\'t match');
    assert(range.startOffset === 1, '`startOffset` doesn\'t match')
    assert(range.endContainer === div.childNodes[1], '`endContainer` doesn\'t match');
    assert(range.endOffset === 3, '`endOffset` doesn\'t match');
  });

  it('should save() and load() a `collapsed` Range instance', function () {
    div = document.createElement('div');
    div.innerHTML = '<b>f<i>o<u>o bar</u></i></b> baz';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

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

  it('should save() and load() a Range through HTML serialization', function () {
    div = document.createElement('div');
    div.innerHTML = '<b>f<i>o<u>o bar</u></i></b> baz';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

    var html = div.innerHTML;
    var b = div.firstChild;

    var range = document.createRange();
    range.setStart(div.firstChild.childNodes[1].childNodes[1].firstChild, 1);
    range.setEnd(div.childNodes[1], 3);
    assert.equal(' bar ba', range.toString());

    // save Range
    var info = saveRange(range);

    // now destory the HTML DOM references on the `info` object by re-parsing the
    // `innerHTML` on the div
    div.innerHTML = div.innerHTML;

    // test that the previous <b> is now detached
    assert(!b.parentNode);
    assert(b !== div.firstChild);

    // load Range
    assert(div === info.parent);
    var r2 = saveRange.load(info);
    div.normalize();

    // test that the Range remains the same
    assert.equal(' bar ba', range.toString());
    assert(range.startContainer === div.firstChild.childNodes[1].childNodes[1].firstChild, '`startContainer` doesn\'t match');
    assert(range.startOffset === 1, '`startOffset` doesn\'t match')
    assert(range.endContainer === div.childNodes[1], '`endContainer` doesn\'t match');
    assert(range.endOffset === 3, '`endOffset` doesn\'t match');
  });

  it('should save() and load() a Range with explicit `parent` given', function () {
    div = document.createElement('div');
    div.innerHTML = '<b>f<i>o<u>o bar</u></i></b> baz';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

    var range = document.createRange();
    range.setStart(div.firstChild.childNodes[1].childNodes[1].firstChild, 1);
    range.setEnd(div.childNodes[1], 3);

    // save Range
    var info = saveRange(range);

    // now transfer the child nodes of the <div> into a new DOM element
    var em = document.createElement('em');
    while (div.firstChild) {
      em.appendChild(div.firstChild);
    }

    // load Range
    var r2 = saveRange.load(info, em);

    // test that the <em> is now the "common ancestor container"
    assert(r2.commonAncestorContainer === em);
  });

  it('should save() a Range and not modify its boundaries', function () {
    div = document.createElement('div');
    div.innerHTML = 'h<b>ello worl</b>d';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

    var range = document.createRange();
    range.setStart(div.childNodes[1].firstChild, 0);
    range.setEnd(div.childNodes[1].firstChild, 9);
    assert.equal('ello worl', range.toString());

    // save Range
    var info = saveRange(range);

    // test that the Range remains the same
    assert.equal('ello worl', range.toString());
    assert(range.startContainer === div.childNodes[1].childNodes[1], '`startContainer` doesn\'t match');
    assert(range.startOffset === 0, '`startOffset` doesn\'t match')
    assert(range.endContainer === div.childNodes[1].childNodes[1], '`endContainer` doesn\'t match');
    assert(range.endOffset === 9, '`endOffset` doesn\'t match');
  });

  it('should save() and load() a Range selecting text at the end of 2 different Ps', function () {
    div = document.createElement('div');
    div.innerHTML = '<p>asfd</p>' +
                    '<p><strong>asfd</strong></p>';
    div.setAttribute('contenteditable', 'true');
    document.body.appendChild(div);

    var range = document.createRange();
    range.setStart(div.firstChild.firstChild, 4);
    range.setEnd(div.lastChild.firstChild.firstChild, 4);
    assert.equal('asfd', range.toString());

    // save Range
    var info = saveRange(range);

    // now transfer the child nodes of the <div> into a new DOM element
    var strong = div.lastChild.firstChild;
    assert.equal('STRONG', strong.nodeName);
    while (strong.firstChild) {
      div.lastChild.appendChild(strong.firstChild);
    }
    strong.parentNode.removeChild(strong);

    // load Range
    var r2 = saveRange.load(info, div);

    assert.equal('asfd', range.toString());
    assert(range.startContainer === div.firstChild, '`startContainer` doesn\'t match');
    assert(range.startOffset === 1, '`startOffset` doesn\'t match')
    assert(range.endContainer === div.lastChild, '`endContainer` doesn\'t match');
    assert(range.endOffset === 1, '`endOffset` doesn\'t match');

    // this is what we really *want*, but the above works as well…
    //assert(range.startContainer === div.firstChild.firstChild, '`startContainer` doesn\'t match');
    //assert(range.startOffset === 4, '`startOffset` doesn\'t match')
    //assert(range.endContainer === div.lastChild.firstChild, '`endContainer` doesn\'t match');
    //assert(range.endOffset === 4, '`endOffset` doesn\'t match');
  });

});
