// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Flags: --expose_externalize_string
'use strict';
const common = require('../common');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const fn = path.join(common.tmpDir, 'write.txt');
const fn2 = path.join(common.tmpDir, 'write2.txt');
const fn3 = path.join(common.tmpDir, 'write3.txt');
const expected = 'ümlaut.';
const constants = fs.constants;

/* eslint-disable no-undef */
common.allowGlobals(externalizeString, isOneByteString, x);

common.refreshTmpDir();

{
  const expected = 'ümlaut eins';  // Must be a unique string.
  externalizeString(expected);
  assert.strictEqual(true, isOneByteString(expected));
  const fd = fs.openSync(fn, 'w');
  fs.writeSync(fd, expected, 0, 'latin1');
  fs.closeSync(fd);
  assert.strictEqual(expected, fs.readFileSync(fn, 'latin1'));
}

{
  const expected = 'ümlaut zwei';  // Must be a unique string.
  externalizeString(expected);
  assert.strictEqual(true, isOneByteString(expected));
  const fd = fs.openSync(fn, 'w');
  fs.writeSync(fd, expected, 0, 'utf8');
  fs.closeSync(fd);
  assert.strictEqual(expected, fs.readFileSync(fn, 'utf8'));
}

{
  const expected = '中文 1';  // Must be a unique string.
  externalizeString(expected);
  assert.strictEqual(false, isOneByteString(expected));
  const fd = fs.openSync(fn, 'w');
  fs.writeSync(fd, expected, 0, 'ucs2');
  fs.closeSync(fd);
  assert.strictEqual(expected, fs.readFileSync(fn, 'ucs2'));
}

{
  const expected = '中文 2';  // Must be a unique string.
  externalizeString(expected);
  assert.strictEqual(false, isOneByteString(expected));
  const fd = fs.openSync(fn, 'w');
  fs.writeSync(fd, expected, 0, 'utf8');
  fs.closeSync(fd);
  assert.strictEqual(expected, fs.readFileSync(fn, 'utf8'));
}

fs.open(fn, 'w', 0o644, common.mustCall(function(err, fd) {
  assert.ifError(err);

  const done = common.mustCall(function(err, written) {
    assert.ifError(err);
    assert.strictEqual(Buffer.byteLength(expected), written);
    fs.closeSync(fd);
    const found = fs.readFileSync(fn, 'utf8');
    fs.unlinkSync(fn);
    assert.strictEqual(expected, found);
  });

  const written = common.mustCall(function(err, written) {
    assert.ifError(err);
    assert.strictEqual(0, written);
    fs.write(fd, expected, 0, 'utf8', done);
  });

  fs.write(fd, '', 0, 'utf8', written);
}));

const args = constants.O_CREAT | constants.O_WRONLY | constants.O_TRUNC;
fs.open(fn2, args, 0o644, common.mustCall((err, fd) => {
  assert.ifError(err);

  const done = common.mustCall((err, written) => {
    assert.ifError(err);
    assert.strictEqual(Buffer.byteLength(expected), written);
    fs.closeSync(fd);
    const found = fs.readFileSync(fn2, 'utf8');
    fs.unlinkSync(fn2);
    assert.strictEqual(expected, found);
  });

  const written = common.mustCall(function(err, written) {
    assert.ifError(err);
    assert.strictEqual(0, written);
    fs.write(fd, expected, 0, 'utf8', done);
  });

  fs.write(fd, '', 0, 'utf8', written);
}));

fs.open(fn3, 'w', 0o644, common.mustCall(function(err, fd) {
  assert.ifError(err);

  const done = common.mustCall(function(err, written) {
    assert.ifError(err);
    assert.strictEqual(Buffer.byteLength(expected), written);
    fs.closeSync(fd);
  });

  fs.write(fd, expected, done);
}));

[false, 'test', {}, [], null, undefined].forEach((i) => {
  common.expectsError(
    () => fs.write(i, common.mustNotCall()),
    {
      code: 'ERR_INVALID_ARG_TYPE',
      type: TypeError
    }
  );
  common.expectsError(
    () => fs.writeSync(i),
    {
      code: 'ERR_INVALID_ARG_TYPE',
      type: TypeError
    }
  );
});
