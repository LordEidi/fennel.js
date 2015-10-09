var test = require('tape');

var handler = require('../libs/requesthandler');

test('timing test', function (t) {
  t.plan(2);

  t.equal(typeof Date.now, 'function');
  var start = Date.now();

  setTimeout(function () {
    t.equal(Date.now() - start, 100);
  }, 100);
});

test('beep boop', function (t) {
  t.plan(2);

  t.equal(1 + 1, 2);
  setTimeout(function () {
    t.deepEqual(
        'ABC'.toLowerCase().split(''),
        ['a','b','c']
    );
  });
});
