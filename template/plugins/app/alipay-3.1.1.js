/**
 * AlipayJSAPI
 * @author wangyou.ly
 * @version 3.1.1
 * @todo
 **/
;(function (self) {

  function PromisePolyfillImpl() {
    /*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.1.0+f9a5575b
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$) {
  if (maybeThenable.constructor === promise.constructor && then$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
      GET_THEN_ERROR.error = null;
    } else if (then$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$)) {
      handleForeignThenable(promise, maybeThenable, then$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value.error = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$ = c.resolve;

  if (resolve$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$) {
        return resolve$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.

    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```

    Chaining
    --------

    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.

    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });

    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```

    Assimilation
    ------------

    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.

    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```

    If the assimliated promise rejects, then the downstream promise will also reject.

    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```

    Simple Example
    --------------

    Synchronous Example

    ```javascript
    let result;

    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```

    Errback Example

    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```

    Promise Example;

    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```

    Advanced Example
    --------------

    Synchronous Example

    ```javascript
    let author, books;

    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```

    Errback Example

    ```js

    function foundBooks(books) {

    }

    function failure(reason) {

    }

    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```

    Promise Example;

    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```

    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.

    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }

    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }

    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```

    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

Promise.polyfill();

return Promise;

})));

  }

  function shouldIgnorePolyfill(self) {
    var isSupport = false;
    var P = self.Promise;

    if (P) {
      var promise = null;
      var then = null;
      try {
        promise = P.resolve();
        then = promise.then;
      } catch (e) {
        // silently ignored
      }
      if (promise instanceof P && typeof then === 'function' && !P.cast) {
        isSupport = true;
      }
    }
    return isSupport;
  }

  if (!shouldIgnorePolyfill(self)) {
    PromisePolyfillImpl();
  }
})(self);
/**
 * AP SOURCE
 */
;(function (self) {
  'use strict';
  /********************* JSAPI functions ********************/
  // AlipayJSBridge

  var _JS_BRIDGE_NAME = 'AlipayJSBridge';
  var _JS_BRIDGE = self[_JS_BRIDGE_NAME];
  var _UA = navigator.userAgent || navigator.swuserAgent;
  var _MEDIA_BUSINESS = 'apm-h5';
  var _IS_SUPPORT_PROMISE;
  var window = self.window;
  var document = self.document;
  var console = self.console;
  var parseInt = self.parseInt;
  /**
   * 待执行队列，处理 ready 前的接口调用
   */
  var _WAITING_QUEUE = [];

  //缓存
  var _CACHE = {
    getBAPSI: {
      isListening: false,
      lastState: 2,
      on: function on() {
        if (!_CACHE.getBAPSI.isListening) {
          _JS_BRIDGE.call('startMonitorBackgroundAudio');
          _CACHE.getBAPSI.isListening = true;
          AP.on('getBackgroundAudioPlayedStateInfo', _CACHE.getBAPSI.listener);
        }
      },
      off: function off() {
        AP.off('getBackgroundAudioPlayedStateInfo', _CACHE.getBAPSI.listener);
        _JS_BRIDGE.call('stopMonitorBackgroundAudio');
        _CACHE.getBAPSI.isListening = false;
      },
      listener: function listener(evt) {
        var data = evt.data || {};
        var state = data.status;
        var triggerEvent = ['backgroundAudioPause', 'backgroundAudioPlay', 'backgroundAudioStop'][state];
        if (triggerEvent && state !== _CACHE.getBAPSI.lastState) {
          AP.trigger(triggerEvent);
          _CACHE.getBAPSI.lastState = state;
        }
      }
    }
  };
  /**
   * JSAPI 异步接口列表，下面是列表中具体代码结构的说明
   * @type {Object}
   *
   * @String   m => mapping                   JSAPI 名称映射，即对应的 AlipayJSBridge 的接口名，方便直接改名
   * @Object   e => extra                     JSAPI 扩展信息，方便追加自定义标识
   *                                          handleResultSuccess: Boolean 是否处理 success 字段
   *                                          handleEventData: Boolean 是否处理事件携带的数据，即过滤掉 event 对象只返回 data
   *                                          optionModifier: Function 对原有 option 入参做进一步处理
   * 
   * @Function b => before(opt, cb)           前置处理，处理入参
   *           @param  {Object}     opt       原始入参，其中 opt._ 是调用接口时可直接传入的某个参数
   *           @return {Object}               处理过的入参
   * @Function d => doing(_opt, cb, opt)      代替执行，代替原有 api 直接执行，会忽略 AlipayJSBridge.call 接口
      *        @param  {Object}    opt        原始入参
   *           @param  {Object}    _opt       before 处理过的入参
   *           @param  {Function}   cb        接口回调函数，已在 AP.call 中处理，所以此处一定是一个 Function 无需判断
   * @Function a => after(res, _opt, opt)     后置处理，处理出参，即接口返回给回调函数的值
   *           @param  {Object}     opt       原始入参
   *           @param  {Object}     _opt      经 before 处理过的入参
   *           @param  {Object}     res       JSAPI 接口的原始返回值
   *           @return {Object}               处理过的接口返回值
   *
   */
  var _JSAPI = {
    /************************* alipayjsapi-inc 内部接口，下为占位符，外部发布时会被删除 *************************/

    
    /**
     * 新版蓝牙相关接口
     */
    openBluetoothAdapter: {},
    closeBluetoothAdapter: {},
    getBluetoothAdapterState: {},
    startBluetoothDevicesDiscovery: {
      b: function b(opt) {
        if (__isString(opt._)) {
          opt._ = [opt._];
        }
        _mapping(opt, {
          _: 'services'
        });
        return opt;
      }
    },
    stopBluetoothDevicesDiscovery: {},
    getBluetoothDevices: {
      b: function b(opt) {
        if (__isString(opt._)) {
          opt._ = [opt._];
        }
        _mapping(opt, {
          _: 'services'
        });
        return opt;
      },
      a: function a(res) {
        if (__isArray(res.devices)) {
          __forEach(res.devices, function (key, val) {
            _mapping(val, {
              manufacturerData: 'advertisData'
            });
          });
        }

        return res;
      }
    },
    getConnectedBluetoothDevices: {
      a: function a(res) {
        if (__isArray(res.devices)) {
          __forEach(res.devices, function (key, val) {
            _mapping(val, {
              manufacturerData: 'advertisData'
            });
          });
        }

        return res;
      }
    },
    connectBLEDevice: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'deviceId'
        });
        return opt;
      }
    },
    disconnectBLEDevice: {},
    writeBLECharacteristicValue: {},
    readBLECharacteristicValue: {},
    notifyBLECharacteristicValueChange: {},
    getBLEDeviceServices: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'deviceId'
        });
        return opt;
      }
    },
    getBLEDeviceCharacteristics: {},
    onBLECharacteristicValueChange: {
      //真正的事件名，会把首字母自动转成小写，因此这里使用 map 可避免这个问题
      m: 'BLECharacteristicValueChange'

    },
    offBLECharacteristicValueChange: {
      m: 'BLECharacteristicValueChange'
    },
    onBluetoothAdapterStateChange: {},
    offBluetoothAdapterStateChange: {},
    onBLEConnectionStateChanged: {
      m: 'BLEConnectionStateChanged'

    },
    offBLEConnectionStateChanged: {
      m: 'BLEConnectionStateChanged'
    },
    onBluetoothDeviceFound: {
      a: function a(res) {
        return _mapping(res, {
          manufacturerData: 'advertisData'
        });
      }
    },
    offBluetoothDeviceFound: {},
    /**
     * end 新版蓝牙相关接口
     */

    pushBizWindow: {},
    compressImage: {
      b: function b(opt) {
        opt.level = __isUndefined(opt.level) ? 4 : opt.level;
        return _mapping(opt, {
          _: 'apFilePaths',
          level: 'compressLevel%d'
        });
      },
      d: function d(_opt, cb) {
        if (__isAndroid()) {
          _JS_BRIDGE.call('compressImage', _opt, cb);
        } else {
          _fakeCallBack(cb, {
            apFilePaths: _opt.apFilePaths || []
          });
        }
      }
    },

    /**
    * 获取启动参数，并记录在 AP.launchParams
    * @method getLaunchParams
    * @param  {String}   null
    * @param  {Function} fn  回调
    */
    getLaunchParams: {
      d: function d(opt, cb) {
        AP.launchParams = window.ALIPAYH5STARTUPPARAMS || _JS_BRIDGE.startupParams || {};
        if (__isFunction(cb)) {
          cb(AP.launchParams);
        }
      }
    },
    //旧版蓝牙接口移除

    onTabClick: {},
    offTabClick: {},
    onShare: {
      m: 'onShare'

    },
    offShare: {
      m: 'onShare'
    },
    connectSocket: {
      b: function b(opt) {
        return _mapping(opt, {
          headers: 'header'
        });
      }
    },
    sendSocketMessage: {
      b: function b(opt) {
        return _mapping(opt, {
          _: 'data'
        });
      }
    },
    closeSocket: {},
    onSocketOpen: {},
    offSocketOpen: {},
    onSocketMessage: {},
    offSocketMessage: {},
    onSocketError: {},
    offSocketError: {},
    onSocketClose: {},
    offSocketClose: {},

    ////////////////////////////// [AlipayJSAPI/ui] ////////////////////////////
    /**
     * 接口可直接传入一个字符串（opt.content）
     * 统一 alert 和 confirm 的内容字段为 content
     */
    alert: {
      b: function b(opt) {
        opt = _mapping(opt, {
          _: 'content',
          content: 'message%s',
          buttonText: 'button%s'
        });
        if (!__isUndefined(opt.title)) {
          opt.title = _toType('%s', opt.title);
        }
        return opt;
      }
    },
    /**
     * 接口可直接传入一个字符串（opt.content）
     * 统一 alert 和 confirm 的内容字段为 content
     */
    confirm: {
      b: function b(opt) {
        opt = _mapping(opt, {
          _: 'content%s',
          content: 'message%s',
          confirmButtonText: 'okButton%s',
          cancelButtonText: 'cancelButton%s'
        });
        if (!__isUndefined(opt.title)) {
          opt.title = _toType('%s', opt.title);
        }
        return opt;
      },
      a: function a(res) {
        return _mapping(res, {
          ok: 'confirm' //更改之前返回值里的 ok 为 confirm
        });
      }
    },
    /**
     * 接口可直接传入一个字符串（opt.content）
     */
    showToast: {
      m: 'toast',
      b: function b(opt) {
        //toast 内容字段本来就是 content
        _mapping(opt, {
          _: 'content%s'
        });
        if (!__isString(opt.content)) {
          opt.content = _toType('%s', opt.content);
        }
        //opt.duration = opt.duration || 2000;
        return opt;
      }
    },
    hideToast: {},
    /**
     * 接口可直接传入一个字符串（opt.content）
     * 接口改造 opt.content => opt.text
     */
    showLoading: {
      b: function b(opt) {
        return _mapping(opt, {
          _: 'content', // %s 没必要加给 content，
          content: 'text%s' // 因为最后调用接口时真正入参是 text
        });
      }
    },
    hideLoading: {},
    showNavigationBarLoading: {
      m: 'showTitleLoading'
    },
    hideNavigationBarLoading: {
      m: 'hideTitleLoading'
    },
    /**
     * 整合了 setTitle, setTitleColor, setBarBottomLineColor 三个接口
     * @type {Object}
     */
    setNavigationBar: {
      b: function b(opt) {
        // JSAPI 名称太长又多次引用，不利于代码压缩，固单独记录
        var st = 'setTitle';
        var stc = 'setTitleColor';
        var sblc = 'setBarBottomLineColor';
        var _opt = {};

        _opt[st] = {};
        _opt[stc] = {};
        _opt[sblc] = {};

        // 映射不同 JSAPI 的入参
        _opt[st] = _mapping(_opt[st], {
          _: 'title', //接口可直接传入一个字符串（opt.title）
          title: 'title%s',
          image: 'image%b' //处理 image 为 base64 的情况，为 native 移除格式头
        }, opt);
        _opt[stc] = _mapping(_opt[stc], {
          backgroundColor: 'color%c',
          reset: 'reset'
        }, opt);
        _opt[sblc] = _mapping(_opt[sblc], {
          borderBottomColor: 'color%c'
        }, opt);

        return _opt;
      },
      d: function d(_opt, cb) {
        var st = 'setTitle';
        var stc = 'setTitleColor';
        var sblc = 'setBarBottomLineColor';
        var res = {};
        //setTitle
        if (!__isEmptyObject(_opt[st])) {
          _JS_BRIDGE.call(st, _opt[st]);
        }
        //setBarBottomLineColor
        if (!__isEmptyObject(_opt[sblc])) {
          _JS_BRIDGE.call(sblc, _opt[sblc]);
          if (__isNaN(_opt[sblc].color)) {
            res.error = 2;
            res.errorMessage = '颜色值不合法';
          }
        }
        //setTitleColor
        if (!__isEmptyObject(_opt[stc])) {
          _JS_BRIDGE.call(stc, _opt[stc], function (result) {
            res = __extend(result, res);
            cb(res);
          });
        } else {
          //setTitle 和 setBarBottomLineColor 本身没有回调
          //为保持接口一致性要模拟一个异步回调
          _fakeCallBack(cb, res);
        }
      }
    },
    showTabBar: {
      b: function b(opt) {
        //创建 tabBar
        opt.action = 'create';
        //默认激活第一个 tab
        opt.activeIndex = opt.activeIndex || 0;
        //其他属性映射
        _mapping(opt, {
          color: 'textColor%c',
          activeColor: 'selectedColor%c',
          activeIndex: 'selectedIndex%d'
        });

        if (__isArray(opt.items)) {
          var items = opt.items;
          //需要复制一份，不能在原数组上修改，会破坏用户数据
          opt.items = [];
          items.forEach(function (item, i) {
            item = _mapping(__extend({}, item), {
              title: 'name%s',
              tag: 'tag%s',
              icon: 'icon%b',
              activeIcon: 'activeIcon%b',
              badge: 'redDot%s'
            }, {
              tag: i,
              // title: item.title,
              // icon: item.icon,
              // activeIcon: item.activeIcon,
              badge: __isUndefined(item.badge) ? '-1' : item.badge
            });
            item.icon = _toType('%b', item.icon);
            item.activeIcon = _toType('%b', item.activeIcon);
            opt.items.push(item);
          });
        }
        return opt;
      },
      d: function d(_opt, cb, opt) {
        var apiName = 'showTabBar';
        if (!__isUndefined(_CACHE.showTabBar)) {
          console.error(apiName + ' must be called at most once');
        } else {
          _CACHE.showTabBar = {
            opt: opt
          };
        }
        //监听点击事件
        AP.on('tabClick', function (evt) {
          var res = {};
          _mapping(res, {
            tag: 'index%d'
          }, {
            tag: __isObject(evt.data) && evt.data.tag ? evt.data.tag : '0'
          });
          cb(res);
        });
        //调用方法
        _JS_BRIDGE.call('tabBar', _opt, function (result) {
          //result 并非真正的返回值，但是要处理接口错误
          _handleApiError(apiName, result);
        });
      }
    },
    setTabBarBadge: {
      m: 'tabBar',
      b: function b(opt) {
        opt.action = 'redDot';
        _mapping(opt, {
          index: 'tag%s',
          badge: 'redDot%s'
        }, {
          index: opt.index
        });
        return opt;
      }
    },
    showActionSheet: {
      m: 'actionSheet',
      b: function b(opt) {
        _mapping(opt, {
          items: 'btns',
          cancelButtonText: 'cancelBtn%s'
        });
        //把按钮字段转成字符串，非字符串会导致钱包闪退
        if (__isArray(opt.btns)) {
          var btns = opt.btns;
          opt.btns = [];
          btns.forEach(function (item) {
            return opt.btns.push(item + '');
          });
        }
        //把取消按钮字段转成字符串，非字符串会导致 actionSheet 全屏
        if (__isUndefined(opt.cancelBtn)) {
          opt.cancelBtn = '取消';
        }

        return opt;
      },
      a: function a(res, _opt) {
        if (__isArray(_opt.btns) && res.index === _opt.btns.length) {
          res.index = -1;
        }
        return res;
      }
    },
    redirectTo: {
      /**
       * 增加 opt.data 作为 queryString 拼在 url 后面
       */
      b: function b(opt) {
        //直接传入一个字符串时当作 opt.url 参数
        _mapping(opt, {
          _: 'url'
        });
        //如果有 data 参数则构造有 queryString 的 url
        if (__isObject(opt.data)) {
          opt.url = __buildUrl(opt.url, opt.data);
        }
        return opt;
      },
      d: function d(_opt) {
        if (_opt.url) {
          window.location.replace(_opt.url);
        }
      }
    },
    pushWindow: {
      /**
       * 增加 opt.data 作为 queryString 拼在 url 后面
       */
      b: function b(opt) {
        //直接传入一个字符串时当作 opt.url 参数
        _mapping(opt, {
          _: 'url',
          params: 'param'
        });
        if (opt.url.indexOf('?') > -1) {
          console.warn('try opt.' + 'data' + ' instead of querystring');
        }
        if (opt.url.indexOf('__webview_options__') > -1) {
          console.warn('try opt.' + 'params' + ' instead of ' + '__webview_options__');
        }
        //如果有 data 参数则构造有 queryString 的 url
        if (__isObject(opt.data)) {
          opt.url = __buildUrl(opt.url, opt.data);
          delete opt.data;
        }
        return opt;
      }
    },
    popWindow: {
      b: function b(opt) {
        opt = _fixOptData(opt);
        if (!__isObject(opt.data)) {
          opt.data = {
            ___forResume___: opt.data
          };
        }
        return opt;
      }
    },
    popTo: {
      /**
       * 接口可直接传入一个数字（opt.index）或者一个字符串（opt.urlPattern）
       */
      b: function b(opt) {
        _mapping(opt, {
          _: function () {
            var key = void 0;
            if (__isNumber(opt._)) {
              key = 'index';
            }
            if (__isString(opt._)) {
              key = 'urlPattern';
            }
            return key;
          }()
        });
        if (!__isObject(opt.data)) {
          opt.data = {
            ___forResume___: opt.data
          };
        }
        return opt;
      }
    },
    allowPullDownRefresh: {
      d: function d(opt) {
        var onPDR = 'onPullDownRefresh';
        _mapping(opt, {
          _: 'allow'
        });
        opt.allow = __isUndefined(opt.allow) ? true : !!opt.allow;

        if (__isObject(_CACHE[onPDR])) {
          _CACHE[onPDR].allow = opt.allow;
        } else {
          _CACHE[onPDR] = {
            allow: opt.allow
          };
          //监听事件，通过 event.preventDefault() 阻止下拉刷新
          //满足用户在没有监听事件的情况下调用 AP.allowPullDownRefresh(false) 仍然生效
          AP.onPullDownRefresh();
        }
        if (_CACHE[onPDR].allow) {
          _JS_BRIDGE.call('restorePullToRefresh');
        } else {
          if (_CACHE[onPDR].event) {
            _CACHE[onPDR].event.preventDefault();
          }
        }
      }
    },

    choosePhoneContact: {
      m: 'contact'
    },
    /**
     * 最多选择10个联系人，只露出 count 参数，其他屏蔽
     */
    chooseAlipayContact: {
      m: 'chooseContact',
      b: function b(opt) {
        var multi = 'multi';
        var single = 'single';
        _mapping(opt, {
          _: 'count'
        });
        if (__isUndefined(opt.count)) {
          opt.count = 1;
        }
        if (opt.count === 1) {
          opt.type = single;
        } else {
          opt.type = multi;
          if (opt.count <= 0 || opt.count > 10) {
            opt.multiMax = 10;
          } else {
            opt.multiMax = opt.count;
          }
        }
        delete opt.count;
        return opt;
      },
      a: function a(res) {
        if (__isArray(res.contacts)) {
          res.contacts.forEach(function (contact) {
            _mapping(contact, {
              headImageUrl: 'avatar',
              name: 'realName'
            });
            delete contact.from;
          });
        }
        return res;
      }
    },
    share: {
      b: function b(opt) {
        var startShareOpt = {};
        var shareToChannelOpt = {};
        startShareOpt.onlySelectChannel = ['ALPContact', 'ALPTimeLine', 'ALPCommunity', 'Weibo', 'DingTalkSession', 'SMS', 'Weixin', 'WeixinTimeLine', 'QQ', 'QQZone'];
        if (__hasOwnProperty(opt, 'bizType')) {
          startShareOpt.bizType = opt.bizType;
        }

        shareToChannelOpt = __extend({}, opt);
        delete shareToChannelOpt.bizType;
        delete shareToChannelOpt.onlySelectChannel;
        _mapping(shareToChannelOpt, {
          image: 'imageUrl'
        });

        _CACHE.share = {
          startShare: startShareOpt,
          shareToChannel: shareToChannelOpt
        };
        return opt;
      },
      d: function d(opt, cb) {
        //隐藏第二行
        if (opt.showToolBar === false) {
          _JS_BRIDGE.call('setToolbarMenu', {
            menus: [],
            override: true
          });
        }
        //唤起分享面板
        _JS_BRIDGE.call('startShare', _CACHE.share.startShare, function (info) {
          var stcOpt = _CACHE.share.shareToChannel;
          if (info.channelName) {
            _JS_BRIDGE.call('shareToChannel', {
              name: info.channelName,
              param: stcOpt
            }, cb);
          } else {
            cb(info);
          }
        });
      }
    },
    datePicker: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'formate',
          formate: 'mode',
          currentDate: 'beginDate',
          startDate: 'minDate',
          endDate: 'maxDate'
        });
        switch (opt.mode) {
          case 'HH:mm:ss':
            opt.mode = 0;
            break;
          case 'yyyy-MM-dd':
            opt.mode = 1;
            break;
          case 'yyyy-MM-dd HH:mm:ss':
            opt.mode = 2;
            break;
          default:
            opt.mode = 1;
        }
        return opt;
      },
      a: function a(res) {
        if (__isString(res.date)) {
          //返回格式为yyyy-MM-dd
          res.date = res.date.replace(/\//g, '-').trim();
        }
        // if (res.error === 2 ) {
        //   const currentDate = _opt.currentDate || Date.now();
        //   const startDate = _opt.startDate;
        // }
        return res;
      }
    },
    chooseCity: {
      m: 'getCities',
      b: function b(opt) {
        var customCities;
        var customHotCities;
        _mapping(opt, {
          showHotCities: 'needHotCity',
          cities: 'customCities',
          hotCities: 'customHotCities'
        });
        //显示定位城市
        if (opt.showLocatedCity === true) {
          opt.currentCity = '';
          opt.adcode = '';
        } else {
          delete opt.currentCity;
          delete opt.adcode;
        }
        delete opt.showLocatedCity;

        //自定义城市
        customCities = opt.customCities;
        if (!__isUndefined(opt.customCities)) {
          opt.customCities = mapArray(customCities);
        }
        //自定义热门城市
        customHotCities = opt.customHotCities;
        if (!__isUndefined(opt.customHotCities)) {
          opt.customHotCities = mapArray(customHotCities);
        }

        function mapArray(arr) {
          var tempArr;
          if (__isArray(arr)) {
            tempArr = [];
            arr.forEach(function (city) {
              tempArr.push(_mapping({}, {
                city: 'name',
                adCode: 'adcode%s',
                spell: 'pinyin'
              }, city));
            });
            arr = tempArr;
          }
          return arr;
        }

        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          adcode: 'adCode'
        });
        return res;
      }
    },

    ////////////////////////////// 事件 /////////////////////////////////
    onBack: {
      a: function a(evt) {
        var res = {};
        var onBack = 'onBack';
        if (__isObject(_CACHE[onBack])) {
          _CACHE[onBack].event = evt;
        } else {
          _CACHE[onBack] = {
            event: evt,
            allowButton: true
          };
        }
        if (_CACHE[onBack].allowButton === false) {
          evt.preventDefault();
        }
        res.backAvailable = _CACHE[onBack].allowButton;
        return res;
      },

      e: {
        handleEventData: false
      }
    },
    offBack: {},

    onResume: {
      a: function a(evt) {
        var res = {};
        if (!__isUndefined(evt.data)) {
          res.data = evt.data;
        }
        if (__hasOwnProperty(evt.data, '___forResume___')) {
          res.data = evt.data.___forResume___;
        }
        return res;
      },

      e: {
        handleEventData: false
      }
    },
    offResume: {},

    onPause: {},
    offPause: {},

    onPageResume: {
      a: function a(evt) {
        var res = {};
        if (!__isUndefined(evt.data)) {
          res.data = evt.data;
        }
        if (__hasOwnProperty(evt.data, '___forResume___')) {
          res.data = evt.data.___forResume___;
        }
        return res;
      },

      e: {
        handleEventData: false
      }
    },
    offPageResume: {},
    onPagePause: {},
    offPagePause: {},

    onTitleClick: {},
    offTitleClick: {},

    //onSubTitleClick: {},
    onPullDownRefresh: {
      m: 'firePullToRefresh',
      a: function a(evt) {
        var res = {};
        var onPDR = 'onPullDownRefresh';
        if (__isObject(_CACHE[onPDR])) {
          _CACHE[onPDR].event = evt;
        } else {
          _CACHE[onPDR] = {
            event: evt,
            allow: true
          };
        }
        if (_CACHE[onPDR].allow === false) {
          _CACHE[onPDR].event.preventDefault();
        }
        res.refreshAvailable = _CACHE[onPDR].allow;
        return res;
      },

      e: {
        handleEventData: false
      }
    },
    offPullDownRefresh: {
      m: 'firePullToRefresh'
    },

    onNetworkChange: {
      d: function d(_opt, _cb, opt, cb) {
        //直接调用一次 getNetworkType 吐回当前网络状态
        var handler = function handler() {
          return AP.getNetworkType(_cb);
        };
        _cacheEventHandler('h5NetworkChange', cb, handler);
        AP.on('h5NetworkChange', handler);
      }
    },
    offNetworkChange: {
      d: function d(_opt, _cb, opt, cb) {
        _removeEventHandler('h5NetworkChange', cb);
      }
    },
    onAccelerometerChange: {
      b: function b() {
        _JS_BRIDGE.call('watchShake', { monitorAccelerometer: true });
      },
      a: function a(evt) {
        var res = {};
        _mapping(res, {
          x: 'x',
          y: 'y',
          z: 'z'
        }, __isObject(evt.data) ? evt.data : evt);
        return res;
      },

      e: {
        handleEventData: false
      }
    },
    offAccelerometerChange: {
      b: function b() {
        _JS_BRIDGE.call('watchShake', { monitorAccelerometer: false });
      }
    },
    onCompassChange: {
      b: function b() {
        _JS_BRIDGE.call('watchShake', { monitorCompass: true });
      },
      a: function a(evt) {
        var res = {};
        _mapping(res, {
          direction: 'direction'
        }, __isObject(evt.data) ? evt.data : evt);
        return res;
      },

      e: {
        handleEventData: false
      }
    },
    offCompassChange: {
      b: function b() {
        _JS_BRIDGE.call('watchShake', { monitorCompass: false });
      }
    },

    onBackgroundAudioPlay: {
      b: function b(opt) {
        _CACHE.getBAPSI.on();
        return opt;
      }
    },
    offBackgroundAudioPlay: {},

    onBackgroundAudioPause: {
      b: function b(opt) {
        _CACHE.getBAPSI.on();
        return opt;
      }
    },
    offBackgroundAudioPause: {},

    onBackgroundAudioStop: {
      b: function b(opt) {
        _CACHE.getBAPSI.on();
        return opt;
      }
    },
    offBackgroundAudioStop: {},

    onAppResume: {},
    offAppResume: {},
    onAppPause: {},
    offAppPause: {},

    ///////////////////////////// device /////////////////////////////
    getNetworkType: {
      a: function a(res) {
        if (!__isUndefined(res.networkInfo)) {
          res.networkType = __tuc(res.networkInfo);
        }
        //无需这么多字段
        delete res.err_msg;
        delete res.networkInfo;
        return res;
      }
    },
    scan: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'type'
        });
        opt.type = opt.type || 'qr';
        return opt;
      },
      a: function a(res) {
        if (res.qrCode || res.barCode) {
          res.code = res.qrCode || res.barCode;
          delete res.qrCode;
          delete res.barCode;
        }

        return res;
      }
    },
    watchShake: {
      b: function b(opt) {
        //用户真正使用此接口时不需要传入任何参数
        //移除所有入参，入参被传感器事件监听开关占用
        //如果有入参，ios 不会调用回调，android 会直接调用回调。
        if (__isEmptyObject(opt)) {
          opt = null;
        }
        return opt;
      }
    },
    getLocation: {
      b: function b(opt) {
        _mapping(opt, {
          accuracy: 'horizontalAccuracy',
          type: 'requestType%d'
        });
        if (__isUndefined(opt.requestType)) {
          opt.requestType = 2;
        }
        if (__isAndroid()) {
          if (__isUndefined(opt.isHighAccuracy)) {
            opt.isHighAccuracy = true;
          }
          if (__isUndefined(opt.isNeedSpeed)) {
            opt.isNeedSpeed = true;
          }
        }
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          citycode: 'cityCode',
          adcode: 'adCode'
        });
        if (__isUndefined(res.city) && res.province) {
          res.city = res.province;
        }
        if (res.latitude) {
          res.latitude = _toType('%s', res.latitude);
        }
        if (res.longitude) {
          res.longitude = _toType('%s', res.longitude);
        }
        if (res.accuracy) {
          res.accuracy = _toType('%f', res.accuracy);
        }
        if (res.speed) {
          res.speed = _toType('%f', res.speed);
        }
        return res;
      }
    },
    getSystemInfo: {
      a: function a(res) {
        var pixelRatio = 'pixelRatio';
        var windowWidth = 'windowWidth';
        var windowHeight = 'windowHeight';
        var language = 'language';
        if (!__hasOwnProperty(res, 'error')) {
          res[pixelRatio] = _toType('%f', res[pixelRatio]);
          res[windowWidth] = _toType('%d', res[windowWidth]);
          res[language] = (res[language] || '').replace(/\s?\w+\/((?:\w|-)+)$/, '$1');
          res[windowHeight] = _toType('%d', res[windowHeight]);
          try {
            if (__isIOS() && AP.compareVersion('10.0.12') < 0) {
              res[windowHeight] = window.screen.height - 64;
            }
          } catch (err) {}
        }
        return res;
      }
    },
    vibrate: {},
    getServerTime: {},

    /////////////////////////// media //////////////////////////
    previewImage: {
      m: 'imageViewer',
      /**
       * 接口改造 opt.current => opt.init
       *        opt.urls => opt.images
       *        默认支持直接传入一个数组作为 opt.urls
       */
      b: function b(opt) {
        _mapping(opt, {
          _: 'urls',
          current: 'init%d'
        });
        //处理默认索引
        if (__isUndefined(opt.init)) {
          opt.init = 0;
        }
        //处理图片链接
        opt.images = [];
        (opt.urls || []).forEach(function (url) {
          opt.images.push({
            u: url
          });
        });
        delete opt.urls;

        return opt;
      }
    },
    chooseImage: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'count%d'
        });
        if (__isUndefined(opt.count)) {
          opt.count = 1;
        }
        if (__isString(opt.sourceType)) {
          opt.sourceType = [opt.sourceType];
        }
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          errorCode: 'error',
          errorDesc: 'errorMessage',
          localIds: 'apFilePaths',
          tempFilePaths: 'apFilePaths'
        });
        //删除无用属性
        delete res.scene;
        delete res.localIds;
        delete res.tempFilePaths;

        //android 返回字符串
        if (__isString(res.apFilePaths)) {
          res.apFilePaths = __parseJSON(res.apFilePaths);
        }

        return res;
      }
    },
    chooseVideo: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'maxDuration%d'
        });
        if (__isString(opt.sourceType)) {
          opt.sourceType = [opt.sourceType];
        }
        if (__isString(opt.camera)) {
          opt.camera = [opt.camera];
        }
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          errorCode: 'error', //android errorCode
          errorDesc: 'errorMessage', // android errorDesc
          msg: 'errorMessage', // ios msg
          localId: 'apFilePath',
          tempFilePath: 'apFilePath',
          tempFile: 'apFilePath'
        });
        //删除无用属性
        delete res.localId;
        delete res.tempFilePath;
        delete res.tempFile;

        switch (res.error) {
          case 0:
            //ios 成功
            delete res.error;
            break;
          case 1:
            //ios 参数出错
            res.error = 2; //通用参数无效
            break;
          case 2:
            //ios 用户取消
            res.error = 10; //android 用户取消
            break;
          case 3:
            //ios 操作失败
            res.error = 11; //android 操作失败
            break;
          case 4:
            //ios 数据处理失败
            res.error = 12;
            break;
          default:
        }

        return res;
      }
    },
    uploadFile: {
      b: function b(opt) {
        _mapping(opt, {
          headers: 'header',
          fileName: 'name',
          fileType: 'type'
        });
        if (_isLocalId(opt.filePath)) {
          opt.localId = opt.filePath;
          delete opt.filePath;
        }
        return opt;
      },
      a: function a(res) {
        if (res.error === 2) {
          res.error = 11;
        }
        return res;
      }
    },
    saveImage: {
      b: function b(opt, cb) {
        _mapping(opt, {
          _: 'url',
          url: 'src'
        });
        if (__isFunction(cb)) {
          opt.cusHandleResult = true;
        }
        return opt;
      }
    },
    downloadFile: {
      b: function b(opt) {
        _mapping(opt, {
          headers: 'header'
        });
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          tempFilePath: 'apFilePath',
          errorCode: 'error'
        });
        delete res.tempFilePath;
        return res;
      }
    },

    ///////////////////////////////// 数据 ////////////////////////////////
    setSessionData: {
      b: function b(opt) {
        opt = _fixOptData(opt);
        if (!__isObject(opt.data)) {
          opt.data = {
            data: opt.data
          };
        }
        __forEach(opt.data, function (key, value) {
          opt.data[key] = JSON.stringify(value);
        });
        return opt;
      }
    },
    getSessionData: {
      b: function b(opt) {
        //直接传入一个 key
        if (__isString(opt._)) {
          opt.keys = [opt._];
        }
        //直接传入一个数组
        if (__isArray(opt._)) {
          opt.keys = opt._;
        }
        delete opt._;
        return opt;
      },
      a: function a(res) {
        __forEach(res.data, function (key, value) {
          res.data[key] = __parseJSON(value);
        });
        return res;
      }
    },
    ////////////////////////////// 开放接口 ////////////////////////////////
    startBizService: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'name',
          params: 'param%s'
        });
        return opt;
      }
    },
    tradePay: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'orderStr'
        });
        return opt;
      }
    },
    getAuthCode: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'scopes'
        });
        if (__isString(opt.scopes)) {
          opt.scopeNicks = [opt.scopes];
        } else if (__isArray(opt.scopes)) {
          opt.scopeNicks = opt.scopes;
        } else {
          opt.scopeNicks = ['auth_base'];
        }
        delete opt.scopes;

        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          authcode: 'authCode'
        });
        return res;
      }
    },
    getAuthUserInfo: {
      a: function a(res) {
        _mapping(res, {
          nick: 'nickName',
          userAvatar: 'avatar'
        });
        return res;
      }
    },
    ////////////////////////// v0.1.3+ ///////////////////////////////
    openInBrowser: {
      /**
       * 接口可直接传入一个字符串（opt.url）
       */
      b: function b(opt) {
        return _mapping(opt, {
          _: 'url'
        });
      }
    },
    openLocation: {
      b: function b(opt) {
        if (__isUndefined(opt.scale)) {
          opt.scale = 15; //默认缩放15级
        }
        return opt;
      }
    },
    showPopMenu: {
      b: function b(opt) {
        //其他属性映射
        _mapping(opt, {
          _: 'items',
          items: 'menus'
        });

        //popMenuClick事件只监听一次，防止多次回调
        if (__isObject(_CACHE.showPopMenu)) {
          _CACHE.showPopMenu.menus = {};
        } else {
          _CACHE.showPopMenu = {
            menus: {}
          };
        }
        if (__isArray(opt.menus)) {
          var menus = opt.menus;
          //需要复制一份，不能在原数组上修改，会破坏用户数据
          opt.menus = [];
          menus.forEach(function (item, i) {
            //支持菜单直接是个字符串数组
            if (__isString(item)) {
              item = {
                title: item
              };
            }
            item = _mapping(__extend({}, item), {
              title: 'name%s',
              tag: 'tag%s',
              badge: 'redDot%s'
            }, {
              tag: i,
              title: item.title,
              badge: __isUndefined(item.badge) ? '-1' : item.badge
            });
            if (!__isUndefined(item.icon)) {
              item.icon = _toType('%b', item.icon);
            }
            opt.menus.push(item);
            _CACHE.showPopMenu.menus[item.name] = i;
          });
        }
        return opt;
      },
      d: function d(_opt, cb) {
        var apiName = 'showPopMenu';
        if (_CACHE.showPopMenu.onEvent !== true) {
          _CACHE.showPopMenu.onEvent = true;
          //监听点击事件
          AP.on('popMenuClick', function (evt) {
            var res = {};
            _mapping(res, {
              title: 'index%d'
            }, {
              title: __isObject(evt.data) && evt.data.title ? _CACHE.showPopMenu.menus[evt.data.title] : '-1'
            });
            cb(res);
          });
        }

        //调用方法
        _JS_BRIDGE.call(apiName, _opt, function (result) {
          //result 并非真正的返回值，但是要处理接口错误
          _handleApiError(apiName, result);
        });
      }
    },
    setOptionButton: {
      m: 'setOptionMenu',
      b: function b(opt) {
        if (__isString(opt._)) {
          opt.title = opt._;
          delete opt._;
        }
        if (__isArray(opt._)) {
          opt.items = opt._;
          delete opt._;
        }
        _mapping(opt, {
          items: 'menus',
          type: 'iconType',
          badge: 'redDot%s'
        });
        if (!__isUndefined(opt.icon)) {
          opt.icon = _toType('%b', opt.icon);
        }
        //optionMenu事件只监听一次，防止多次回调
        if (__isObject(_CACHE.setOptionButton)) {
          _CACHE.setOptionButton.menus = [];
        } else {
          _CACHE.setOptionButton = {
            menus: []
          };
        }
        if (__isArray(opt.menus)) {
          var menus = opt.menus;
          //需要复制一份，不能在原数组上修改，会破坏用户数据
          opt.menus = [];
          menus.forEach(function (item, i) {
            item = _mapping(__extend({}, item), {
              type: 'icontype',
              badge: 'redDot%s'
            }, {
              badge: __isUndefined(item.badge) ? '-1' : item.badge
            });
            if (!__isUndefined(item.icon)) {
              item.icon = _toType('%b', item.icon);
            }
            opt.menus.unshift(item);
            _CACHE.setOptionButton.menus[menus.length - 1 - i] = i;
          });
          if (opt.menus.length > 0 && __isUndefined(opt.override)) {
            opt.override = true;
          }
        }
        //每次 setOptionMenu 要注册新的事件
        if (__isFunction(_CACHE.setOptionButton.onEvent)) {
          AP.off('optionMenu', _CACHE.setOptionButton.onEvent);
        }
        if (__isFunction(opt.onClick)) {
          var onClick = opt.onClick;
          var eventHandler = function eventHandler(evt) {
            var index = 0;
            var res = {};
            if (__isObject(evt.data) && __isNumber(evt.data.index) && _CACHE.setOptionButton.menus.length > 0) {
              index = _CACHE.setOptionButton.menus[evt.data.index];
            }
            res.index = _toType('%d', index);
            onClick(res);
          };
          _CACHE.setOptionButton.onEvent = eventHandler;
          //监听点击事件
          if (opt.reset !== true) {
            AP.on('optionMenu', eventHandler);
          }
          delete opt.onClick;
        }
        return opt;
      },
      d: function d(_opt, cb) {
        _JS_BRIDGE.call('setOptionMenu', _opt, cb);
        //iOS 没有回调, 10.0.8
        if (__isIOS()) {
          _fakeCallBack(cb, {});
        }
        AP.showOptionButton();
      }
    },
    showOptionButton: {
      m: 'showOptionMenu'
    },
    hideOptionButton: {
      m: 'hideOptionMenu'
    },
    showBackButton: {},
    hideBackButton: {},
    allowBack: {
      d: function d(opt) {
        var onBack = 'onBack';
        _mapping(opt, {
          _: 'allowButton'
        });
        opt.allowButton = __isUndefined(opt.allowButton) ? true : !!opt.allowButton;

        if (__isBoolean(opt.allowGesture)) {
          _JS_BRIDGE.call('setGestureBack', {
            val: opt.allowGesture
          });
        }
        if (__isObject(_CACHE[onBack])) {
          _CACHE[onBack].allowButton = opt.allowButton;
        } else {
          _CACHE[onBack] = {
            allowButton: opt.allowButton
          };
          AP.onBack();
        }
        if (opt.allowButton === false && _CACHE[onBack].event) {
          _CACHE[onBack].event.preventDefault();
        }
      }
    },
    startRecord: {
      m: 'startAudioRecord',
      b: function b(opt) {
        _mapping(opt, {
          maxDuration: 'maxRecordTime%f',
          minDuration: 'minRecordTime%f',
          bizType: 'business'
        }, {
          maxDuration: opt.maxDuration || 60,
          minDuration: opt.minDuration || 1
        });
        if (__isUndefined(opt.business)) {
          opt.business = _MEDIA_BUSINESS;
        }
        // 10.0.5统一成秒
        // opt.maxRecordTime *= 1000;
        // opt.minRecordTime *= 1000;
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          tempFilePath: 'apFilePath',
          identifier: 'apFilePath'
        });
        return res;
      }
    },
    stopRecord: {
      m: 'stopAudioRecord'
    },
    cancelRecord: {
      m: 'cancelAudioRecord'
    },
    playVoice: {
      m: 'startPlayAudio',
      b: function b(opt) {
        _mapping(opt, {
          _: 'filePath',
          filePath: 'identifier',
          bizType: 'business'
        });
        if (__isUndefined(opt.business)) {
          opt.business = _MEDIA_BUSINESS;
        }
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          identifier: 'filePath'
        });
        return res;
      }
    },
    pauseVoice: {
      m: 'pauseAudioPlay'
    },
    resumeVoice: {
      m: 'resumeAudioPlay'
    },
    stopVoice: {
      m: 'stopAudioPlay'
    },
    makePhoneCall: {
      d: function d(opt, cb) {
        var url = 'tel:';
        _mapping(opt, {
          _: 'number'
        });
        url += opt.number;
        _JS_BRIDGE.call('openInBrowser', { url: url }, cb);
      }
    },
    playBackgroundAudio: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'url',
          url: 'audioDataUrl%s',
          title: 'audioName%s',
          singer: 'singerName%s',
          describe: 'audioDescribe%s',
          logo: 'audioLogoUrl%s',
          cover: 'coverImgUrl%s',
          bizType: 'business'
        }, {
          bizType: opt.bizType || _MEDIA_BUSINESS
        });
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          describe: 'errorMessage'
        });
        _handleResultSuccess(res, 12, 0);
        return res;
      }
    },
    pauseBackgroundAudio: {
      a: function a(res) {
        _mapping(res, {
          describe: 'errorMessage'
        });
        _handleResultSuccess(res, 12, 0);
        return res;
      }
    },
    stopBackgroundAudio: {
      a: function a(res) {
        _mapping(res, {
          describe: 'errorMessage'
        });
        _handleResultSuccess(res, 12, 0);
        return res;
      }
    },
    seekBackgroundAudio: {
      b: function b(opt) {
        _mapping(opt, {
          _: 'position',
          bizType: 'business'
        }, {
          bizType: opt.bizType || _MEDIA_BUSINESS
        });
        opt.position = _toType('%f', opt.position);
        return opt;
      },
      a: function a(res) {
        _mapping(res, {
          describe: 'errorMessage'
        });
        _handleResultSuccess(res, 12, 0);
        return res;
      }
    },
    getBackgroundAudioPlayerState: {
      a: function a(res) {
        _mapping(res, {
          audioDataUrl: 'url',
          describe: 'errorMessage'
        });
        _handleResultSuccess(res, 12, 0);
        return res;
      }
    }

    //////////////////////////// 未开放方法 //////////////////////////////

    //numInput: {},
    //inputFocus: {},
    //inputBackFill: {},
    //numInputReset: {},
    //inputBlur: {},
    //downloadApp: {},
    //getSwitchControlStatus: {},
    //setToolbarMenu: {},


    //uploadImage: {}, ？apFilePath
    //downloadImage: {}, ？apFilePath
    //saveFile: {},
    //rpc: {},
    //startApp: {},
    //remoteLog: {},
    //getConfig: {},
    //getUserInfo: {},
    //setSharedData: {},
    //getSharedData: {},
    //removeSharedData: {},
    //setClipboard: {},
    //getClipboard: {},
    //login: {},
    //sendSMS: {},
    //isSupportShortCut: {},
    //setShortCut: {},
    //removeShortCut: {},
    //registerSync: {},
    //responseSyncNotify: {},
    //unregisterSync: {},
    //refreshSyncSkey: {},
    //getScreenBrightness: {},
    //setScreenBrightness: {},
    //isInstalledApp: {},
    //getAllContacts: {},
    //preRender: {},
    //finishRender: {},
    //clearRender: {},


    //setPullDownText: {},
    //hideTransBack: {},
    //limitAlert: {},
    //startPackage: {},
    //getClientInfo: {},
    //reportData: {},
    //getSceneStackInfo: {},
    //getAppInfo: {},
    //rsa: {},
    //shareToken: {},
    //snapshot: {},
    //getAppToken: {},
    //ping: {},
    //checkJSAPI: {},
    //checkApp: {},
    //commonList: {},
    //beehiveOptionsPicker: {},
    //beehiveGetPOI: {},
    //addEventCal: {},
    //removeEventCal: {},
    //speech: {},
    //selectAddress: {},
    //nfch5plugin: {},
  };
  /********************* AP 对象其他静态属性及同步方法 ************************/

  //Alipay 缩写
  var AP = {
    version: '3.1.1',
    ua: _UA,
    isAlipay: __inUA(/AlipayClient/),
    alipayVersion: function () {
      var version = _UA.match(/AlipayClient[a-zA-Z]*\/(\d+(?:\.\d+)+)/);
      return version && version.length ? version[1] : '';
    }(),
    /////////////////////////////// AP 同步方法 /////////////////////////////
    /**
     * 版本比较
     * @method compareVersion
     * @param  {String}       targetVersion 目标版本
     * @return {Number}                     比较结果，1代表当前版本大于目标版本，-1相反，相同为0
     */
    compareVersion: function compareVersion(targetVersion) {
      var alipayVersion = AP.alipayVersion.split('.');

      targetVersion = targetVersion.split('.');
      for (var i = 0, n1, n2; i < alipayVersion.length; i++) {
        n1 = parseInt(targetVersion[i], 10) || 0;
        n2 = parseInt(alipayVersion[i], 10) || 0;
        if (n1 > n2) return -1;
        if (n1 < n2) return 1;
      }
      return 0;
    },

    /**
     * 获取 url 上的全部传参并转成对象
     * @method parseQueryString
     * @param  {String}          queryString
     * @return {Object}          location.search 对应的键值对象
     */
    parseQueryString: function parseQueryString(queryString) {
      var result = {};
      var searchStr = queryString || window.location.search;
      var bool = {
        true: true,
        false: false
      };
      var kv;
      searchStr = searchStr.indexOf('?') === 0 ? searchStr.substr(1) : searchStr;
      searchStr = searchStr ? searchStr.split('&') : '';
      for (var i = 0; i < searchStr.length; i++) {
        kv = searchStr[i].split('=');
        kv[1] = decodeURIComponent(kv[1]);
        //Boolean
        kv[1] = __isUndefined(bool[kv[1]]) ? kv[1] : bool[kv[1]];
        //Number
        //kv[1] = +kv[1] + '' === kv[1] ? +kv[1] : kv[1];
        result[kv[0]] = kv[1];
      }
      _apiRemoteLog('parseQueryString');
      return result;
    },

    /**
     * 开启 debug 模式，控制台打印接口调用日志
     * @type {Object}
     */
    enableDebug: function enableDebug() {
      AP.debug = true;
    },


    /**
     * 绑定全局事件
     * @method on
     * @param  {String}   evts 事件类型，多个事件用空格分隔
     * @param  {Function} fn     事件回调
     */
    on: function on(evts, fn) {
      var isReady = evts === 'ready';
      var isSimple = isReady || evts === 'back';

      if (isSimple) {
        document.addEventListener(isReady ? _JS_BRIDGE_NAME + 'Ready' : evts, fn, false);
      } else {
        evts = evts.replace(/ready/, _JS_BRIDGE_NAME + 'Ready');
        evts.split(/\s+/g).forEach(function (eventName) {
          document.addEventListener(eventName, fn, false);
        });
      }
    },

    /**
     * 移除事件监听
     * @method off
     * @param  {String}   evt    事件类型
     * @param  {Function} fn     事件回调
     */
    off: function off(evt, fn) {
      document.removeEventListener(evt, fn, false);
    },
    trigger: function trigger(evtName, data) {
      var evt = document.createEvent('Events');
      evt.initEvent(evtName, false, true);
      evt.data = data || {};
      document.dispatchEvent(evt);
      return evt;
    },


    /**
     * ready事件独立方法
     * @method ready
     * @param  {Function} fn ready 回调
     */
    ready: function ready(fn) {
      if (__isSupportPromise()) {
        return new Promise(realReady);
      } else {
        realReady();
      }

      function realReady(resolve) {
        if (_isBridgeReady()) {
          if (__isFunction(fn)) {
            fn();
          }
          if (__isFunction(resolve)) {
            resolve();
          }
        } else {
          AP.on('ready', function () {
            //防止 jsbridge 晚注入
            _isBridgeReady();

            if (__isFunction(fn)) {
              fn();
            }
            if (__isFunction(resolve)) {
              resolve();
            }
          });
        }
      }
    },

    

    /**
     * 通用接口，调用方式等同AlipayJSBridge.call
     * 无需考虑ready事件，会自动加入到待执行队列
     * @method call
     */
    call: function call() {
      var args = __argumentsToArg(arguments);
      if (__isSupportPromise()) {
        return AP.ready().then(function () {
          return new Promise(realCall);
        });
      } else {
        //如果直接加到 ready 事件里会有不触发调用的情况
        //AP.ready(realCall);

        if (_isBridgeReady()) {
          realCall();
        } else {
          //保存在待执行队列
          _WAITING_QUEUE.push(args);
        }
      }

      function realCall(resolve, reject) {
        var apiName;
        var opt; //原始 option
        var cb; //原始 callback
        var _opt; //处理过的 option
        var _cbSFC; //不同状态回调
        var _cb; //处理过的 callback
        var onEvt;
        var offEvt;
        var doingFn;
        var logOpt;
        //强制转为 name + object + function 形式的入参
        apiName = args[0] + '';
        opt = args[1];
        cb = args[2];
        //处理 cb 和 opt 的顺序
        if (__isUndefined(cb) && __isFunction(opt)) {
          cb = opt;
          opt = {};
        }
        //接口有非对象入参，设为快捷入参
        if (!__isObject(opt) && args.length >= 2) {
          //before、doing、after 方法中直接取 opt._ 作为参数
          opt = {
            _: opt
          };
        }
        //兜底
        if (__isUndefined(opt)) {
          opt = {};
        }

        //处理入参
        _opt = _getApiOption(apiName, opt, cb);

        //获取回调
        _cbSFC = _getApiCallBacks(apiName, _opt);

        if (__isUndefined(_opt)) {
          console.error('please confirm ' + apiName + '.before() returns the options.');
        }
        //获取 api 的 d 方法
        doingFn = _getApiDoing(apiName);

        //输出入参
        logOpt = __hasOwnProperty(opt, '_') ? opt._ : opt;
        _apiLog(apiName, logOpt, _opt);

        //是否是事件监听
        onEvt = _getApiOnEvent(apiName);
        //是否是事件移除
        offEvt = _getApiOffEvent(apiName);

        //处理回调
        _cb = function _cb(res) {
          var _res = void 0;
          res = res || {};

          if (onEvt && _getApiExtra(apiName, 'handleEventData') !== false) {
            _res = _handleEventData(res);
          }

          //处理结果
          _res = _getApiResult(apiName, _res || res, _opt, opt, cb);
          if (__isUndefined(_res)) {
            console.error('please confirm ' + apiName + '.after() returns the result.');
          }
          //处理错误码
          _res = _handleApiError(apiName, _res);
          //打印 debug 日志
          _apiLog(apiName, logOpt, _opt, res, _res);

          if (__hasOwnProperty(_res, 'error') || __hasOwnProperty(_res, 'errorMessage')) {
            if (__isFunction(reject)) {
              reject(_res);
            }
            if (__isFunction(_cbSFC.fail)) {
              _cbSFC.fail(_res);
            }
          } else {
            if (__isFunction(resolve)) {
              resolve(_res);
            }
            if (__isFunction(_cbSFC.success)) {
              _cbSFC.success(_res);
            }
          }
          if (__isFunction(_cbSFC.complete)) {
            _cbSFC.complete(_res);
          }
          //执行用户的回调
          if (__isFunction(cb)) {
            cb(_res);
          }
        };

        //如果存在 d 直接执行，否则执行 AlipayJSBridge.call
        if (__isFunction(doingFn)) {
          doingFn(_opt, _cb, opt, cb);
        } else if (onEvt) {
          _cacheEventHandler(onEvt, cb, _cb, _cbSFC);
          AP.on(onEvt, _cb);
        } else if (offEvt) {
          _removeEventHandler(offEvt, cb);
        } else {
          _JS_BRIDGE.call(_getApiName(apiName), _opt, _cb);
        }
        _apiRemoteLog(apiName);
      }
    },

    /**
     * 扩展 JSAPI 的接口
     */
    extendJSAPI: function extendJSAPI(JSAPI, isInitAP) {
      //如果是字符串，直接当作接口名
      if (!isInitAP && __isString(JSAPI)) {
        JSAPI = [JSAPI];
      }
      __forEach(JSAPI, function (key) {
        var apiName = key;
        // 如果是初始化调用，则无需再注册到 _JSAPI 对象上
        if (isInitAP !== true) {
          var api = JSAPI[apiName];
          //如果接口定义是一个 function，即作为 doing 方法
          if (__isFunction(api)) {
            api = {
              doing: api
            };
          }
          if (__isString(api)) {
            apiName = api;
            api = {};
            api[apiName] = {};
          }

          _JSAPI[apiName] = _mapping(_JSAPI[apiName] || {}, {
            mapping: 'm',
            before: 'b',
            doing: 'd',
            after: 'a'
          }, api);

          if (__isObject(api.extra)) {
            _JSAPI[apiName].e = _JSAPI[apiName].e || {};
            _JSAPI[apiName].e = __extend(_JSAPI[apiName].e, api.extra);
          }
        }

        // TODO: 需要验证U3是否支持bind参数
        // AP[apiName] = AP.call.bind(null, apiName);
        AP[apiName] = function () {
          return AP.call.apply(null, [apiName].concat(__argumentsToArg(arguments)));
        };
      }, true);
    }
  };
  AP.extendJSAPI.mapping = _mapping;
  AP.extendJSAPI.toType = _toType;

  if (!AP.isAlipay) {
    console.warn('Run ' + 'alipayjsapi' + '.js in ' + 'Alipay' + ' please!');
  }
  /*********************** 注册异步 JSAPI ***********************/

  (function () {
    // 将 JSAPI 注册到 AP 上
    AP.extendJSAPI(_JSAPI, true);
    //ready 入口
    AP.on('ready', function () {
      if (!!_WAITING_QUEUE.length) {
        next();
      }
      function next() {
        __raf(function () {
          var args = _WAITING_QUEUE.shift();
          AP.call.apply(null, args);
          if (_WAITING_QUEUE.length) next();
        });
      }
    });
  })();
  /******************JSAPI 相关辅助处理方法 _ ********************/
  /**
   * 是否ready
   * @method _isBridgeReady
   * @return {Boolean} 是否 可以调用 AlipayJSBridge.call
   */
  function _isBridgeReady() {
    _JS_BRIDGE = _JS_BRIDGE || self[_JS_BRIDGE_NAME];
    return _JS_BRIDGE && _JS_BRIDGE.call;
  }
  /**
   * 获取缓存相关接口的 business
   * @method _getStorageBusiness
   * @return {String} business
   */
  function _getStorageBusiness() {
    var href = self && self.location && self.location.href ? self.location.href : '';
    var business = href.replace(/^(http|https):\/\//i, '').split('/')[0];
    return business;
  }
  /**
   * 假回调，用于没有实现回调的接口
   * @param {Function} cb
   * @param {Object} arg
   */
  function _fakeCallBack(cb, arg) {
    setTimeout(function () {
      cb(arg);
    }, 1);
  }
  /**
   * 是否是 localId
   * @method _isLocalId
   * @param  {String}   localId 资源定位符
   * @return {Boolean}          是否 localId
   */
  function _isLocalId(localId) {
    return (/^[a-z0-9|]+$/i.test(localId)
    );
  }
  /**
   * 是否是 apFilePath 地址
   * @method _isApFilePath
   * @param  {String}      apFilePath 10.0.2新统一资源定位符
   * @return {Boolean}                是否 apFilePath
   */
  // function _isApFilePath(apFilePath) {
  //   return /^https:\/\/resource\/[a-z0-9|]+\./i.test(apFilePath)
  // }


  /**
   * 修复某个快捷入参是对象类型
   * @method _fixOptData
   * @param  {Object}    opt     入参对象
   * @param  {String}    dataKey 快捷入参的 key
   * @return {Object}            对象
   */
  function _fixOptData(opt, dataKey) {
    var objectArg = false;
    dataKey = dataKey || 'data';
    if (__hasOwnProperty(opt, '_')) {
      //入参不是一个对象
      opt[dataKey] = opt._;
      delete opt._;
    } else {
      //入参是一个对象，但可能有除了 data 外的其他 key
      __forEach(opt, function (key) {
        if (key !== dataKey) {
          objectArg = true;
        }
      });
      if (objectArg) {
        objectArg = opt;
        opt = {};
        opt[dataKey] = objectArg;
      }
    }
    return opt;
  }

  /**
   * 判断事件注册监听是否是同一个回调，并返回此回调函数
   * @method _getSameHandlers
   * @param  {String}        evt 事件名
   * @param  {Function}      cb  相同回调函数
   * @return {Function / false}            是否是回调
   */
  function _getSameHandlers(evt, cb, isRemoveCache) {
    var sameHandlers = false;
    var sameIndex;
    if (!__isUndefined(evt)) {
      if (!_CACHE.EVENTS) {
        _CACHE.EVENTS = {};
      }
      if (!_CACHE.EVENTS[evt]) {
        _CACHE.EVENTS[evt] = {
          callbacks: []
        };
      }
      if (!_CACHE.EVENTS[evt].callbacks) {
        _CACHE.EVENTS[evt].callbacks = [];
      }

      _CACHE.EVENTS[evt].callbacks.forEach(function (item, i) {
        if (item.cb === cb) {
          sameHandlers = item;
          sameIndex = i;
        }
      });
      if (isRemoveCache && __isNumber(sameIndex)) {
        _CACHE.EVENTS[evt].callbacks.splice(sameIndex, 1);
      }
    }
    return sameHandlers;
  }

  function _cacheEventHandler(evt, cb, _cb, _cbSFC) {
    var sameCBs = _getSameHandlers(evt, cb);
    if (!sameCBs) {
      _CACHE.EVENTS[evt].callbacks.push({
        cb: cb,
        _cb: _cb,
        _cbSFC: _cbSFC
      });
    }
  }

  function _removeEventHandler(evt, cb) {
    var handlers = _getSameHandlers(evt, cb, true);
    if (!__isFunction(cb)) {
      //移除全部通过 AP.onXXXX注册的监听
      _CACHE.EVENTS[evt].callbacks.forEach(function (item) {
        AP.off(evt, item._cb);
      });
      _CACHE.EVENTS[evt].callbacks = [];
    } else if (handlers) {
      AP.off(evt, handlers._cb);
    }
  }

  /**
   * 获取要注册的事件类型
   * @method _getApiOnEvent
   * @param  {String}     apiName API 名称
   * @return {String}             事件类型，如果不是事件类 API 就返回 false
   */
  function _getApiOnEvent(apiName) {
    return _getApiEvent('on', apiName);
  }

  /**
   * 获取要移除的事件类型
   * @method _getApiOffEvent
   * @param  {String}        apiName 接口名
   * @return {String}                事件类型，如果不是事件类 API 就返回 false
   */
  function _getApiOffEvent(apiName) {
    return _getApiEvent('off', apiName);
  }

  /**
   * 获取事件名
   * @method _getApiEvent
   * @param  {String}     prefix  前缀
   * @param  {String}     apiName 接口名
   * @return {String}             事件名
   */
  function _getApiEvent(prefix, apiName) {
    var jsapi = _JSAPI[apiName];
    var evt = false;
    var evtApiPattern = prefix === 'off' ? /^off([A-Z])(\w+)/ : /^on([A-Z])(\w+)/;

    // 以 on、off 开头的 api 是 事件，排除 AP.on、AP.off 方法
    if (jsapi && evtApiPattern.test(apiName)) {
      apiName = apiName.match(evtApiPattern);
      evt = jsapi.m;
      if (!evt && apiName[1] && apiName[2]) {
        evt = __tlc(apiName[1]) + apiName[2];
      }
    }
    return evt;
  }

  /**
   * 获取接口扩展字段
   * @method _getApiExtra
   * @param  {String}     apiName  接口名
   * @param  {String}     extraKey 扩展字段的 key
   * @return {Any}                 返回相应字段值
   */
  function _getApiExtra(apiName, extraKey) {
    var jsapi = _JSAPI[apiName] || {};
    var extra = jsapi.e || jsapi.extra || {};
    return extra[extraKey];
  }
  /**
   * 获取 opt._，适配直接传入某个参数的场景，即调用 api 时第二个参数传入的不是 Object 的情况
   * @method _getObjArg
   * @param  {Object}   opt AP.call 方法的 opt 入参
   * @return {any}       一般是 String，默认是 undefined
   */
  // function _getObjArg(opt, optTarget) {
  //   var arg = optTarget;
  //   if (!__isUndefined(opt._)) {
  //     arg = opt._;
  //     delete opt._;
  //   }
  //   return arg;
  // }

  /**
   * 获取 JSAPI 映射接口名
   * @method _getApiName
   * @param  {String}    apiName AP 接口名
   * @return {String}            AlipayJSBridge 接口名
   */
  function _getApiName(apiName) {
    var jsapi = _JSAPI[apiName];
    return jsapi && jsapi.m ? jsapi.m : apiName;
  }

  /**
   * 处理 JSAPI 的入参
   * @method _getApiOption
   * @param  {String}      apiName JSAPI 名称
   * @param  {Object}      opt     JSAPI 入参
   * @param  {Function}    cb      JSAPI 未处理过的回调函数
   * @return {Object}              处理过的 opt
   */
  function _getApiOption(apiName, opt, cb) {
    var jsapi = _JSAPI[apiName];
    var finalOpt = jsapi && jsapi.b ? jsapi.b(__extend({}, opt), cb) : opt;
    var modifier = _getApiExtra(apiName, 'optionModifier');
    if (__isFunction(modifier)) {
      var modifyOpt = modifier(finalOpt, cb);
      if (__isObject(modifyOpt)) {
        finalOpt = modifyOpt;
      }
    }

    return finalOpt;
  }
  /**
   * 获取不同状态回调
   * @method _getApiCallBacks
   * @param  {String}        apiName  接口名
   * @param  {Object}        opt      接口入参
   * @return {Object}                 回调对象
   */
  function _getApiCallBacks(apiName, opt) {
    var cb = {};
    opt = opt || {};
    if (__isFunction(opt.success)) {
      cb.success = opt.success;
      delete opt.success;
    }
    if (__isFunction(opt.fail)) {
      cb.fail = opt.fail;
      delete opt.fail;
    }
    if (__isFunction(opt.complete)) {
      cb.complete = opt.complete;
      delete opt.complete;
    }
    return cb;
  }

  /**
   * 获取 API 的 doing 函数
   * @method _getApiDoing
   * @param  {String}     apiName API 名称
   * @return {function}           doing 函数
   */
  function _getApiDoing(apiName) {
    var jsapi = _JSAPI[apiName];
    return jsapi && jsapi.d ? jsapi.d : false;
  }

  /**
   * 处理 JSAPI 的出参
   * @method _getApiResult
   * @param  {String}      apiName JSAPI 接口名
   * @param  {Object}      opt     JSAPI 原始入参
   * @param  {Object}      _opt    JSAPI before方法 处理过的入参
   * @param  {Object}      res     JSAPI 出参
   * @param  {Function}    cb      JSAPI 未处理过的回调函数
   * @return {Object}              处理过的 res
   */
  function _getApiResult(apiName, res, _opt, opt, cb) {
    var jsapi = _JSAPI[apiName];
    var finalRes = jsapi && jsapi.a ? jsapi.a(__isEvent(res) ? res : __extend({}, res), _opt, opt, cb) : __extend({}, res);
    var modifier = _getApiExtra(apiName, 'resultModifier');
    if (__isFunction(modifier)) {
      var modifyRes = modifier(finalRes, _opt, opt, cb);
      if (__isObject(modifyRes)) {
        finalRes = modifyRes;
      }
    }
    return finalRes;
  }
  /**
   * 处理错误信息，转换 error 字段为 Number 类型
   * @method _handleApiError
   * @param  {String}        apiName 接口名
   * @param  {Object}        res     出参
   * @return {Object}                处理过的 res
   */
  function _handleApiError(apiName, res) {
    //错误码强制转成数字
    if (__hasOwnProperty(res, 'error')) {
      res.error = parseInt(res.error, 10);
    }
    //处理 success
    if (_getApiExtra(apiName, 'handleResultSuccess') !== false) {
      _handleResultSuccess(res);
    }
    //处理 error: 0 的情况，error 为 0 表示成功
    if (res.error === 0) {
      delete res.error;
      delete res.errorMessage;
    }

    //有些 error 不代表接口异常，而是用户取消操作，不应该统一做报错日志。
    if (res.error > 0 && res.error < 10) {
      console.error(apiName, res);
    }
    return res;
  }
  /**
   * 处理结果中的 success 字段
   * @method _handleResultSuccess
   * @param  {Object}             res           接口返回值
   * @param  {Number}             errorCode     对应错误码
   * @param  {Any}                successValue  success字段处理值
   * @return {Object}                           处理后的 result
   */
  function _handleResultSuccess(res, mappingError, successValue) {
    successValue = __isUndefined(successValue) ? false : successValue;
    if (!__hasOwnProperty(res, 'error') && res.success === successValue) {
      res.error = __isNumber(mappingError) ? mappingError : 2; //2 是参数错误
    }
    delete res.success;
    return res;
  }

  //取到 data
  function _handleEventData(evtObj) {
    var data = {};
    if (!__isUndefined(evtObj.data)) {
      data = evtObj.data;
      data = __isObject(data) ? data : { data: data };
    }
    return data;
  }

  /**
   * 拆分类型键名里真正的 key 和对应的 type
   * @method _separateTypeKey
   * @param  {String}         key 带类型标识的键名
   * @return {Object}             返回键名和类型标识两个字段，
   *                              如{k: 'content', t: '%s'}
   */
  function _separateTypeKey(key) {
    var matches = (key || '').match(/(\w+)(%\w)$/i);
    var tk = {
      k: key
    };
    if (matches) {
      tk.k = matches[1];
      tk.t = matches[2];
    }
    return tk;
  }

  /**
   * 把值转换成相应类型
   * @method _toType
   * @param  {String} type  类型标识，目前支持
   *                        %s(字符串)
   *                        %c(16转10进制颜色)
   *                        %h(10转16进制颜色)
   *                        %b(移除 base64 数据格式头)
   *                        %a{mimeType}(添加 base64 数据头)
   *                        %d(整数)
   *                        %f(浮点数)
   * @param  {any} value 待转换值，类型未知
   * @return {any}       转换好的相应类型的
   */
  function _toType(type, value) {
    if (type === '%s') value = __superToString(value);
    if (type === '%c') value = __h2dColor(value);
    //if (type === '%h') value = __d2hColor(value);
    if (type === '%b') value = __removeBase64Head(value);
    if (type === '%d') value = parseInt(value, 10);
    if (type === '%f') value = parseFloat(value);
    return value;
  }
  /**
   * 处理对象映射关系
   * @method _mapping
   * @param  {Object}  tObj 原始目标对象
   * @param  {Object}  map 映射关系，如{content: 'text'}，
   *                       即把 sObj.content 的值赋给 tObj.text，
   *                       并删除 tObj 的 content 属性，
   *                       所以 content 就是 sKey，text 就是 tKey。
   *                       可以把 map 对象中的冒号(:)理解成 to，
   *                       即 {content to text}。
   *                       其中 tKey 的值的最后可以加 %s 等类型标识转换成相应类型，
   *                       注意：要加到最后赋值给 tObj 的那个 tKey 的后面。
   *                       这么做是因为：
   *                       有些接口的入参字段直接传入非字符串值时，接口完全无响应，
   *                       比如 AlipayJSBridge.call('alert',{message: 12345})
   *
   * @param  {Object} sObj 参照来源对象
   * @return {Object}     处理映射后的 tObj
   */
  function _mapping(tObj, map, sObj) {
    var typeKey;
    sObj = sObj || {};
    __forEach(map, function (sKey, tKey) {
      typeKey = _separateTypeKey(map[sKey]);
      //目标 key
      tKey = typeKey.k;
      //映射条件，否则不赋值，避免添加 value 为 undefined 的 key
      if (!__isUndefined(tKey) //目标 key 定义过
      && (__hasOwnProperty(tObj, sKey) || __hasOwnProperty(sObj, sKey)) //源数据至少有一个有效
      && __isUndefined(tObj[tKey]) //目标数据空缺待赋值
      ) {
          //sKey 既可以是 sObj 的，也可以是 tObj 自己的，但sObj 优先级高于原始 tObj
          //即 sObj[sKey]的值 会覆盖 tObj[sKey]的值
          //并且要根据 type 占位符做相应类型转换
          tObj[tKey] = _toType(typeKey.t, __isUndefined(sObj[sKey]) ? tObj[sKey] : sObj[sKey]);
          // 删除原始 tObj 中的 sKey，tKey 和 sKey 同名时不做删除
          if (tKey !== sKey) {
            delete tObj[sKey];
          }
        }
    });
    return tObj;
  }
  /**
   * ap 接口埋点
   * 保证队列里有调用记录时才启动计时器，做到不调用不计时
   * @param {String} apiName  接口名
   */
  var _apiRemoteLog = function () {
    var apiInvokeQueue = [];
    var timerId = void 0;
    var isTimerActived = false;
    //发送日志
    function triggerSendLog() {
      setTimeout(function () {
        if (apiInvokeQueue.length > 0) {
          var param1 = apiInvokeQueue.join('|');
          AP.ready(function () {
            _JS_BRIDGE.call('remoteLog', {
              type: 'monitor',
              bizType: 'ALIPAYJSAPI',
              logLevel: 1, // 1 - high, 2 - medium, 3 - low
              actionId: 'MonitorReport',
              seedId: 'ALIPAYJSAPI_INVOKE_COUNTER',
              param1: param1
            });
          });
          AP.debug && console.info('REMOTE_LOG_QUEUE>', apiInvokeQueue);
          apiInvokeQueue = [];
        }
        // 停止计时器
        clearTimer();
      }, 0);
    }
    // 计时器
    function timer() {
      // 计时激活标致
      isTimerActived = true;
      // 启动计时器
      timerId = setTimeout(function () {
        // 日志发送
        triggerSendLog();
      }, 5000); // 5 秒上报
    }
    // 清除计时器
    function clearTimer() {
      !__isUndefined(timerId) && clearTimeout(timerId);
      isTimerActived = false;
    }
    // back 事件上报日志，作为兜底
    AP.on('back', function () {
      triggerSendLog();
    });

    return function (apiName) {
      apiInvokeQueue.push(apiName);
      // 6 个上报
      if (apiInvokeQueue.length >= 6) {
        triggerSendLog();
      } else if (!isTimerActived) {
        timer();
      }
    };
  }();

  function _apiLog() {
    var args = __argumentsToArg(arguments);
    var apiName;
    var opt;
    var _opt;
    var res;
    var _res;
    var logs;
    if (AP.debug) {
      apiName = args[0];
      opt = args[1];
      _opt = args[2];
      res = args[3];
      _res = args[4];
      logs = [args.length > 3 ? 'RETURN>' : 'INVOKE>', apiName, __hasOwnProperty(opt, '_') ? opt._ : opt, _opt];
      if (args.length > 3) {
        logs.push(res);
      }
      if (args.length > 4) {
        logs.push(_res);
      }
      console.info(logs);
    }
  }
  /****************** Util方法 __ ***********************/
  /**
   * 是否在 UA 中包含某个字符串
   * @method _inUA
   * @param  {String}   keyStr      目标字符串
   * @return {Boolean}              是否包含
   */
  function __inUA(keyPattern) {
    return keyPattern.test(_UA);
  }
  /**
   * 动画帧
   * @method raf
   * @param  {Function} fn 回调
   * @return {Function}    requestAnimationFrame
   */
  var __raf = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
      window.setTimeout(function () {
        callback(+new Date(), element);
      }, 1000 / 60);
    };
  }();
  /**
   *  当前环境是否支持 Promise
   * @method __supportPromise
   * @return {Boolean}              是否支持
   */
  function __isSupportPromise() {
    if (_IS_SUPPORT_PROMISE === undefined) {
      var isSupport = false;
      var P = self.Promise;

      if (P) {
        var promise = null;
        var then = null;
        try {
          promise = P.resolve();
          then = promise.then;
        } catch (e) {
          // silently ignored
        }
        if (promise instanceof P && __isFunction(then) && !P.cast) {
          isSupport = true;
        }
      }
      if (!isSupport) {
        console.warn('try callback since no Promise detected');
      }
      _IS_SUPPORT_PROMISE = isSupport;
    }
    return _IS_SUPPORT_PROMISE;
  }

  /**
   * 超级字符串转换
   * @method __superToString
   * @param  {Any}        content 待转换内容
   * @return {String}             转换后的字符串
   */
  function __superToString(content) {
    var str = content;
    if (__isObject(content) || __isArray(content)) {
      try {
        str = JSON.stringify(content);
      } catch (e) {
        //静默
      }
    } else {
      str = content + '';
    }
    return str;
  }

  /**
   * 16进制颜色转成10进制数字
   * @method __h2dColor
   * @param  {String}   hex 16进制颜色字符串
   * @return {Number}       10进制数字
   */
  function __h2dColor(hex) {
    var dec = '' + hex;
    //如果加了#号，去掉
    if (dec.indexOf('#') === 0) {
      dec = dec.substr(1);
    }
    //如果是3位简写，补全成6位
    if (dec.length === 3) {
      dec = dec.replace(/(.)/g, '$1$1');
    }
    dec = parseInt(dec, 16);
    if (__isNaN(dec)) {
      console.error(hex + ' is invalid hex color.');
    }
    return dec;
  }

  /**
   * 10进制数字转成16进制颜色
   * @method __d2hColor
   * @param  {Number}   dec 10进制数字
   * @return {String}       16进制颜色字符串
   */
  // function __d2hColor(dec) {
  //   return '#' + dec.toString(16);
  // }
  /**
   * native 返回的无头 base64 数据，添加浏览器识别的 mimeType 的 base64数据头
   * @method __addBase64Head
   * @param   {String}        base64   无头数据
   * @param   {String}        mimeType 数据格式
   * @return  {String}                 有头数据
   */
  function __addBase64Head(base64, mimeType) {
    if (base64 && mimeType) {
      base64 = 'data:' + mimeType + ';base64,' + base64;
    }
    return base64;
  }

  /**
   * 移除 base64 数据头，native 接口不需要传入头部
   * @method __removeBase64Head
   * @param  {String}           base64 有头数据
   * @return {String}                  无头数据
   */
  function __removeBase64Head(base64) {
    if (__isString(base64)) {
      base64 = base64.replace(/^data:(\/|\w|\-|\.)+;base64,/i, '');
    }
    return base64;
  }

  /**
   * 把 json 转成 & 相连的请求参数
   * @method __toQueryString
   * @param  {Object}        data key: value参数键值对
   * @return {String}             queryString
   */
  function __toQueryString(data) {
    var result = [];

    __forEach(data, function (key, value) {
      result.push(key + '=' + encodeURIComponent(__isUndefined(value) ? '' : value));
    });
    result = result.join('&');
    // var limits = [1024, 2048];
    // var notice;
    // notice = 'query string length has more than %d，please use setSessionData interface';
    // if (result.length > limits[1]) {
    //   console.warn(notice, limits[1]);
    // } else if (result.length > limits[0]) {
    //   console.warn(notice, limits[0]);
    // }
    return result;
  }

  /**
   * 构造带参的完整 url
   * @method __buildUrl
   * @param  {String}   url    原始 url，可能已经有 queryString
   * @param  {Object}   params url 参数对象
   * @return {String}          拼接好的带参 url
   */
  function __buildUrl(url, params) {
    var qs = params;
    if (__isObject(params)) {
      qs = __toQueryString(params);
    }
    if (!/\?/.test(url)) {
      qs = '?' + qs;
    } else if (!/&$/.test(url) && !/\?$/.test(url)) {
      qs = '&' + qs;
    }
    return url + qs;
  }
  /**
   * 一个对象是否含有某个 key
   * @method __hasOwnProperty
   * @param  {Object}         obj 对象或数组
   * @param  {String}         key 键值
   * @return {Boolean}            是否含有此键值
   */
  function __hasOwnProperty(obj, key) {
    if (__isObject(obj) || __isArray(obj)) {
      return obj.hasOwnProperty(key);
    }
    return false;
  }
  /**
   * 遍历对象
   * @method __forEach
   * @param  {Object}   obj 待遍历对象或数组
   * @param  {Function} cb  每个 key 的回调
   *                        回调入参是 key 和对应的 value
   */
  function __forEach(obj, cb, notArray) {
    var i;
    var key;
    if (!notArray && __likeArray(obj)) {
      for (i = 0; i < obj.length; i++) {
        if (cb(i, obj[i]) === false) {
          return obj;
        }
      }
    } else {
      for (key in obj) {
        if (cb(key, obj[key]) === false) {
          return obj;
        }
      }
    }
    return obj;
  }
  /**
   * 解析 JSON
   * @method __parseJSON
   * @param  {String}    str JSON 字符串
   * @return {Object}        JSON 对象
   */
  function __parseJSON(str) {
    try {
      str = JSON.parse(str);
    } catch (err) {
      console.warn(err, str);
    }
    return str;
  }

  /**
   * 转成小写字母
   * @method __tlc
   * @param  {String} str 待转换字符串
   * @return {String}     小写字符串
   */
  function __tlc(str) {
    if (__isString(str)) {
      str = str.toLowerCase();
    }
    return str;
  }

  /**
   * 转成大写字母
   * @method __tuc
   * @param  {String} str 待转换字符串
   * @return {String}     大写字符串
   */
  function __tuc(str) {
    if (__isString(str)) {
      str = str.toUpperCase();
    }
    return str;
  }

  function __isAndroid() {
    return __inUA(/android/i);
  }

  function __isIOS() {
    return __inUA(/iPad|iPod|iPhone|iOS/i);
  }

  function __isUndefined(o) {
    return __type_original(o) === '[object Undefined]';
  }

  function __isNull(o) {
    return __type_original(o) === '[object Null]';
  }

  function __isNaN(num) {
    return parseInt(num, 10).toString() === 'NaN';
  }
  function __isBoolean(val) {
    return typeof val === 'boolean';
  }

  function __isFunction(fn) {
    return __type_original(fn) === '[object Function]';
  }

  function __isString(str) {
    return typeof str === 'string';
  }

  function __isObject(o) {
    return __type_original(o) === '[object Object]';
  }

  function __isNumber(num) {
    // 如果用typeof number 会生成SymbolPolyfill
    return __type_original(num) === '[object Number]';
  }

  function __isArray(arr) {
    return __type_original(arr) === '[object Array]';
  }

  function __likeArray(obj) {
    return !!obj && !__isFunction(obj) && (__isArray(obj) || __isNumber(obj.length));
  }
  function __isEvent(evt) {
    return __type_original(evt) === '[object Event]';
  }

  function __type_original(obj) {
    return Object.prototype.toString.call(obj);
  }

  function __isEmptyObject(obj) {
    for (var name in obj) {
      return false;
    }
    return true;
  }

  function __argumentsToArg(_arguments) {
    var _startIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var len = _arguments.length - _startIndex;
    var arg = new Array(len);
    for (var i = 0; i < len; i++) {
      arg[i] = _arguments[i + _startIndex];
    }
    return arg;
  }

  /**
   * 对象扩展
   * @method __extend
   * @param  {Object} obj  原始对象
   * @param  {Object} args 多个继承对象
   * @return {Object}      扩展后对象
   */
  function __extend(obj) {
    var args = __argumentsToArg(arguments, 1);
    var source;
    var prop;
    if (!__isObject(obj)) {
      return obj;
    }
    for (var i = 0, length = args.length; i < length; i++) {
      source = args[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  }

  /***************** 输出 AP 对象 *******************/
  self._AP = AP;

  if (typeof module !== 'undefined' && module.exports) {
    // 兼容 CommonJS
    module.exports = AP;
  } else if (typeof define === 'function' && (define.amd || define.cmd)) {
    // 兼容 AMD / RequireJS / seaJS
    define(function () {
      return AP;
    });
  } else {
    // 如果不使用模块加载器则自动生成全局变量
    self.ap = self.AP = AP;
  }
})(self);