(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "lib/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _hubManager = __webpack_require__(2);

	var _hubManager2 = _interopRequireDefault(_hubManager);

	exports['default'] = { HubManager: _hubManager2['default'] };
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _connection = __webpack_require__(3);

	var _connection2 = _interopRequireDefault(_connection);

	var _channelHandler = __webpack_require__(6);

	var _channelHandler2 = _interopRequireDefault(_channelHandler);

	var messageBus = _connection2['default'].getMessageBus();

	function createHub(hubname) {
	  return {
	    invoke: function invoke(method, args) {
	      messageBus.emit(_connection2['default'].INVOKE_EVT_NAME, {
	        hub: hubname,
	        method: method,
	        args: args
	      }, true);
	    },

	    listen: function listen(evtName, callback) {
	      return messageBus.on(_channelHandler2['default'].getHubEvtName(hubname, evtName), function (message) {
	        callback.apply(null, message.args);
	      });
	    }
	  };
	}

	exports['default'] = {
	  createHub: createHub
	};
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint id-length: 1 */
	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _tabex = __webpack_require__(4);

	var _tabex2 = _interopRequireDefault(_tabex);

	var _jquery = __webpack_require__(5);

	var _jquery2 = _interopRequireDefault(_jquery);

	var _channelHandler = __webpack_require__(6);

	var _channelHandler2 = _interopRequireDefault(_channelHandler);

	var SYS_NSPACE = 'signalr.sys.';
	var INVOKE_EVT_NAME = SYS_NSPACE + '.invoke';

	var messageBus = _tabex2['default'].client();

	var isMaster = false;
	var isConnected = false;
	var connection = null;

	function getSysEvtName(name) {
	  return SYS_NSPACE + name;
	}

	function emitConnectionStatus(includeSelf) {
	  if (!isMaster) return;
	  messageBus.emit(getSysEvtName('connectionstatus'), { isConnected: isConnected }, includeSelf);
	}

	function createConnection(signalRUrl, logging) {
	  if (!connection) {
	    connection = _jquery2['default'].connection(signalRUrl);

	    connection.logging = !!logging;

	    connection.connectionSlow(function () {
	      messageBus.emit(getSysEvtName('slow'), {}, true);
	      connection.log('Signalr connection is slow.');
	    });

	    connection.error(function (error) {
	      connection.log('SignalR error: ' + error);
	    });

	    connection.received(function (message) {
	      _channelHandler2['default'].processSignalRMessage(connection, messageBus, message);
	    });

	    connection.start(function () {
	      connection.log('Now connected, connection ID=' + connection.id);
	      isConnected = true;
	      emitConnectionStatus(true);
	    }).fail(function () {
	      connection.log('Could not connect');
	      isConnected = false;
	      emitConnectionStatus(true);
	    });
	  }
	}

	function masterChange(data) {
	  isMaster = data.node_id === data.master_id;

	  if (isMaster && !connection) {
	    createConnection();
	    return;
	  }

	  if (!isMaster && connection) {
	    connection.stop();
	    isConnected = false;
	    connection = null;
	  }
	}

	messageBus.on('!sys.master', masterChange);
	messageBus.on(INVOKE_EVT_NAME, function (message) {
	  if (!isMaster) return;
	  _channelHandler2['default'].sendInvokeMessage(connection, message);
	});

	exports['default'] = {
	  INVOKE_EVT_NAME: INVOKE_EVT_NAME,
	  getMessageBus: function getMessageBus() {
	    return messageBus;
	  }
	};
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("tabex");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("jQuery");

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _helpers = __webpack_require__(7);

	var _helpers2 = _interopRequireDefault(_helpers);

	var _hubHelper = __webpack_require__(8);

	var _hubHelper2 = _interopRequireDefault(_hubHelper);

	var HUB_NSPACE = 'signalr';

	function getHubEvtName(hubName, evtName) {
	  if (!hubName) throw new Error('hubName is required');
	  if (!evtName) throw new Error('evtName is required');

	  return HUB_NSPACE + '.' + hubName + '.' + evtName;
	}

	function sendInvokeMessage(connection, message) {
	  if (!connection) throw new Error('connection is required');
	  if (!message) throw new Error('message is required');

	  if (!message.hub || !message.method) {
	    throw new Error('Hub or Method to invoke not set');
	  }

	  var args = [];

	  if (message.args) {
	    args = _helpers2['default'].isArray(message.args) ? message.args : [message.args];
	  }

	  var invokeId = message.hub + '.' + message.method;
	  var data = { H: message.hub, M: message.method, A: args, I: invokeId };

	  connection.log('Invoking ' + invokeId);
	  connection.send(data);
	}

	function processSignalRMessage(connection, messageBus, minData) {
	  if (!connection) throw new Error('connection is required');
	  if (!messageBus) throw new Error('connection is required');
	  if (!minData) return;

	  if (typeof minData.I !== 'undefined') {
	    // We received the return value from a server method invocation, look up callback by id and call it
	    var dataCallbackId = minData.I.toString();
	    var result = _hubHelper2['default'].maximizeInvokeResponse(minData);

	    if (result.progress) {
	      // do nada
	    } else if (result.error) {
	        connection.log(dataCallbackId + ' failed to execute.');
	      } else {
	        connection.log('Invoked ' + dataCallbackId);
	      }
	  } else {
	    var data = _hubHelper2['default'].maximizeEvtMessage(minData);
	    connection.log('Triggering client hub event ' + data.method + ' on hub ' + data.hub + '.');
	    var evt = getHubEvtName(data.hub, data.method);
	    messageBus.emit(evt, data, true);
	  }
	}

	exports['default'] = {
	  getHubEvtName: getHubEvtName,
	  sendInvokeMessage: sendInvokeMessage,
	  processSignalRMessage: processSignalRMessage
	};
	module.exports = exports['default'];

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	function toString(obj) {
	  return Object.prototype.toString.call(obj);
	}

	var nativeIsArray = Array.isArray;

	var isArray = nativeIsArray || function (obj) {
	  return toString.call(obj) === '[object Array]';
	};

	exports['default'] = {
	  toString: toString,
	  isArray: isArray
	};
	module.exports = exports['default'];

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports["default"] = {
	  maximizeInvokeResponse: function maximizeInvokeResponse(minHubResponse) {
	    return {
	      state: minHubResponse.S,
	      result: minHubResponse.R,
	      progress: minHubResponse.P ? {
	        id: minHubResponse.P.I,
	        data: minHubResponse.P.D
	      } : null,
	      id: minHubResponse.I,
	      isHubException: minHubResponse.H,
	      error: minHubResponse.E,
	      stackTrace: minHubResponse.T,
	      errorData: minHubResponse.D
	    };
	  },

	  maximizeEvtMessage: function maximizeEvtMessage(minData) {
	    return {
	      hub: minData.H,
	      method: minData.M,
	      args: minData.A,
	      state: minData.S
	    };
	  }
	};
	module.exports = exports["default"];

/***/ }
/******/ ])));