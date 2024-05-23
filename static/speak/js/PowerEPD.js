var libPowerEPD = (function () {
	var _scriptDir =
		typeof document !== 'undefined' && document.currentScript
			? document.currentScript.src
			: undefined
	return function (libPowerEPD) {
		libPowerEPD = libPowerEPD || {}

		var Module = typeof libPowerEPD !== 'undefined' ? libPowerEPD : {}
		var moduleOverrides = {}
		var key
		for (key in Module) {
			if (Module.hasOwnProperty(key)) {
				moduleOverrides[key] = Module[key]
			}
		}
		Module['arguments'] = []
		Module['thisProgram'] = './this.program'
		Module['quit'] = function (status, toThrow) {
			throw toThrow
		}
		Module['preRun'] = []
		Module['postRun'] = []
		var ENVIRONMENT_IS_WEB = false
		var ENVIRONMENT_IS_WORKER = false
		var ENVIRONMENT_IS_NODE = false
		var ENVIRONMENT_IS_SHELL = false
		ENVIRONMENT_IS_WEB = typeof window === 'object'
		ENVIRONMENT_IS_WORKER = typeof importScripts === 'function'
		ENVIRONMENT_IS_NODE =
			typeof process === 'object' &&
			typeof require === 'function' &&
			!ENVIRONMENT_IS_WEB &&
			!ENVIRONMENT_IS_WORKER
		ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER
		if (Module['ENVIRONMENT']) {
			throw new Error(
				'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)',
			)
		}
		var scriptDirectory = ''
		function locateFile(path) {
			if (Module['locateFile']) {
				return Module['locateFile'](path, scriptDirectory)
			} else {
				return scriptDirectory + path
			}
		}
		if (ENVIRONMENT_IS_NODE) {
			scriptDirectory = __dirname + '/'
			var nodeFS
			var nodePath
			Module['read'] = function shell_read(filename, binary) {
				var ret
				ret = tryParseAsDataURI(filename)
				if (!ret) {
					if (!nodeFS) nodeFS = require('fs')
					if (!nodePath) nodePath = require('path')
					filename = nodePath['normalize'](filename)
					ret = nodeFS['readFileSync'](filename)
				}
				return binary ? ret : ret.toString()
			}
			Module['readBinary'] = function readBinary(filename) {
				var ret = Module['read'](filename, true)
				if (!ret.buffer) {
					ret = new Uint8Array(ret)
				}
				assert(ret.buffer)
				return ret
			}
			if (process['argv'].length > 1) {
				Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/')
			}
			Module['arguments'] = process['argv'].slice(2)
			process['on']('uncaughtException', function (ex) {
				if (!(ex instanceof ExitStatus)) {
					throw ex
				}
			})
			process['on']('unhandledRejection', abort)
			Module['quit'] = function (status) {
				process['exit'](status)
			}
			Module['inspect'] = function () {
				return '[Emscripten Module object]'
			}
		} else if (ENVIRONMENT_IS_SHELL) {
			if (typeof read != 'undefined') {
				Module['read'] = function shell_read(f) {
					var data = tryParseAsDataURI(f)
					if (data) {
						return intArrayToString(data)
					}
					return read(f)
				}
			}
			Module['readBinary'] = function readBinary(f) {
				var data
				data = tryParseAsDataURI(f)
				if (data) {
					return data
				}
				if (typeof readbuffer === 'function') {
					return new Uint8Array(readbuffer(f))
				}
				data = read(f, 'binary')
				assert(typeof data === 'object')
				return data
			}
			if (typeof scriptArgs != 'undefined') {
				Module['arguments'] = scriptArgs
			} else if (typeof arguments != 'undefined') {
				Module['arguments'] = arguments
			}
			if (typeof quit === 'function') {
				Module['quit'] = function (status) {
					quit(status)
				}
			}
		} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
			if (ENVIRONMENT_IS_WORKER) {
				scriptDirectory = self.location.href
			} else if (document.currentScript) {
				scriptDirectory = document.currentScript.src
			}
			if (_scriptDir) {
				scriptDirectory = _scriptDir
			}
			if (scriptDirectory.indexOf('blob:') !== 0) {
				scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/') + 1)
			} else {
				scriptDirectory = ''
			}
			Module['read'] = function shell_read(url) {
				try {
					var xhr = new XMLHttpRequest()
					xhr.open('GET', url, false)
					xhr.send(null)
					return xhr.responseText
				} catch (err) {
					var data = tryParseAsDataURI(url)
					if (data) {
						return intArrayToString(data)
					}
					throw err
				}
			}
			if (ENVIRONMENT_IS_WORKER) {
				Module['readBinary'] = function readBinary(url) {
					try {
						var xhr = new XMLHttpRequest()
						xhr.open('GET', url, false)
						xhr.responseType = 'arraybuffer'
						xhr.send(null)
						return new Uint8Array(xhr.response)
					} catch (err) {
						var data = tryParseAsDataURI(url)
						if (data) {
							return data
						}
						throw err
					}
				}
			}
			Module['readAsync'] = function readAsync(url, onload, onerror) {
				var xhr = new XMLHttpRequest()
				xhr.open('GET', url, true)
				xhr.responseType = 'arraybuffer'
				xhr.onload = function xhr_onload() {
					if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
						onload(xhr.response)
						return
					}
					var data = tryParseAsDataURI(url)
					if (data) {
						onload(data.buffer)
						return
					}
					onerror()
				}
				xhr.onerror = onerror
				xhr.send(null)
			}
			Module['setWindowTitle'] = function (title) {
				document.title = title
			}
		} else {
			throw new Error('environment detection error')
		}
		var out =
			Module['print'] ||
			(typeof console !== 'undefined'
				? console.log.bind(console)
				: typeof print !== 'undefined'
					? print
					: null)
		var err =
			Module['printErr'] ||
			(typeof printErr !== 'undefined'
				? printErr
				: (typeof console !== 'undefined' && console.warn.bind(console)) || out)
		for (key in moduleOverrides) {
			if (moduleOverrides.hasOwnProperty(key)) {
				Module[key] = moduleOverrides[key]
			}
		}
		moduleOverrides = undefined
		assert(
			typeof Module['memoryInitializerPrefixURL'] === 'undefined',
			'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead',
		)
		assert(
			typeof Module['pthreadMainPrefixURL'] === 'undefined',
			'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead',
		)
		assert(
			typeof Module['cdInitializerPrefixURL'] === 'undefined',
			'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead',
		)
		assert(
			typeof Module['filePackagePrefixURL'] === 'undefined',
			'Module.filePackagePrefixURL option was removed, use Module.locateFile instead',
		)
		var STACK_ALIGN = 16
		stackSave =
			stackRestore =
			stackAlloc =
				function () {
					abort(
						'cannot use the stack before compiled code is ready to run, and has provided stack access',
					)
				}
		function staticAlloc(size) {
			assert(!staticSealed)
			var ret = STATICTOP
			STATICTOP = (STATICTOP + size + 15) & -16
			assert(
				STATICTOP < TOTAL_MEMORY,
				'not enough memory for static allocation - increase TOTAL_MEMORY',
			)
			return ret
		}
		function dynamicAlloc(size) {
			assert(DYNAMICTOP_PTR)
			var ret = HEAP32[DYNAMICTOP_PTR >> 2]
			var end = (ret + size + 15) & -16
			HEAP32[DYNAMICTOP_PTR >> 2] = end
			if (end >= TOTAL_MEMORY) {
				var success = enlargeMemory()
				if (!success) {
					HEAP32[DYNAMICTOP_PTR >> 2] = ret
					return 0
				}
			}
			return ret
		}
		function alignMemory(size, factor) {
			if (!factor) factor = STACK_ALIGN
			var ret = (size = Math.ceil(size / factor) * factor)
			return ret
		}
		function getNativeTypeSize(type) {
			switch (type) {
				case 'i1':
				case 'i8':
					return 1
				case 'i16':
					return 2
				case 'i32':
					return 4
				case 'i64':
					return 8
				case 'float':
					return 4
				case 'double':
					return 8
				default: {
					if (type[type.length - 1] === '*') {
						return 4
					} else if (type[0] === 'i') {
						var bits = parseInt(type.substr(1))
						assert(bits % 8 === 0)
						return bits / 8
					} else {
						return 0
					}
				}
			}
		}
		function warnOnce(text) {
			if (!warnOnce.shown) warnOnce.shown = {}
			if (!warnOnce.shown[text]) {
				warnOnce.shown[text] = 1
				err(text)
			}
		}
		var jsCallStartIndex = 1
		var functionPointers = new Array(0)
		var funcWrappers = {}
		function dynCall(sig, ptr, args) {
			if (args && args.length) {
				assert(args.length == sig.length - 1)
				assert(
					'dynCall_' + sig in Module,
					"bad function pointer type - no table for sig '" + sig + "'",
				)
				return Module['dynCall_' + sig].apply(null, [ptr].concat(args))
			} else {
				assert(sig.length == 1)
				assert(
					'dynCall_' + sig in Module,
					"bad function pointer type - no table for sig '" + sig + "'",
				)
				return Module['dynCall_' + sig].call(null, ptr)
			}
		}
		var tempRet0 = 0
		var setTempRet0 = function (value) {
			tempRet0 = value
		}
		var getTempRet0 = function () {
			return tempRet0
		}
		var GLOBAL_BASE = 8
		var ABORT = false
		var EXITSTATUS = 0
		function assert(condition, text) {
			if (!condition) {
				abort('Assertion failed: ' + text)
			}
		}
		function getCFunc(ident) {
			var func = Module['_' + ident]
			assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported')
			return func
		}
		var JSfuncs = {
			stackSave: function () {
				stackSave()
			},
			stackRestore: function () {
				stackRestore()
			},
			arrayToC: function (arr) {
				var ret = stackAlloc(arr.length)
				writeArrayToMemory(arr, ret)
				return ret
			},
			stringToC: function (str) {
				var ret = 0
				if (str !== null && str !== undefined && str !== 0) {
					var len = (str.length << 2) + 1
					ret = stackAlloc(len)
					stringToUTF8(str, ret, len)
				}
				return ret
			},
		}
		var toC = { string: JSfuncs['stringToC'], array: JSfuncs['arrayToC'] }
		function ccall(ident, returnType, argTypes, args, opts) {
			function convertReturnValue(ret) {
				if (returnType === 'string') return Pointer_stringify(ret)
				if (returnType === 'boolean') return Boolean(ret)
				return ret
			}
			var func = getCFunc(ident)
			var cArgs = []
			var stack = 0
			assert(returnType !== 'array', 'Return type should not be "array".')
			if (args) {
				for (var i = 0; i < args.length; i++) {
					var converter = toC[argTypes[i]]
					if (converter) {
						if (stack === 0) stack = stackSave()
						cArgs[i] = converter(args[i])
					} else {
						cArgs[i] = args[i]
					}
				}
			}
			var ret = func.apply(null, cArgs)
			ret = convertReturnValue(ret)
			if (stack !== 0) stackRestore(stack)
			return ret
		}
		function cwrap(ident, returnType, argTypes, opts) {
			return function () {
				return ccall(ident, returnType, argTypes, arguments, opts)
			}
		}
		function setValue(ptr, value, type, noSafe) {
			type = type || 'i8'
			if (type.charAt(type.length - 1) === '*') type = 'i32'
			switch (type) {
				case 'i1':
					HEAP8[ptr >> 0] = value
					break
				case 'i8':
					HEAP8[ptr >> 0] = value
					break
				case 'i16':
					HEAP16[ptr >> 1] = value
					break
				case 'i32':
					HEAP32[ptr >> 2] = value
					break
				case 'i64':
					;(tempI64 = [
						value >>> 0,
						((tempDouble = value),
						+Math_abs(tempDouble) >= +1
							? tempDouble > +0
								? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0
								: ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0
							: 0),
					]),
						(HEAP32[ptr >> 2] = tempI64[0]),
						(HEAP32[(ptr + 4) >> 2] = tempI64[1])
					break
				case 'float':
					HEAPF32[ptr >> 2] = value
					break
				case 'double':
					HEAPF64[ptr >> 3] = value
					break
				default:
					abort('invalid type for setValue: ' + type)
			}
		}
		function getValue(ptr, type, noSafe) {
			type = type || 'i8'
			if (type.charAt(type.length - 1) === '*') type = 'i32'
			switch (type) {
				case 'i1':
					return HEAP8[ptr >> 0]
				case 'i8':
					return HEAP8[ptr >> 0]
				case 'i16':
					return HEAP16[ptr >> 1]
				case 'i32':
					return HEAP32[ptr >> 2]
				case 'i64':
					return HEAP32[ptr >> 2]
				case 'float':
					return HEAPF32[ptr >> 2]
				case 'double':
					return HEAPF64[ptr >> 3]
				default:
					abort('invalid type for getValue: ' + type)
			}
			return null
		}
		var ALLOC_STATIC = 2
		var ALLOC_NONE = 4
		function Pointer_stringify(ptr, length) {
			if (length === 0 || !ptr) return ''
			var hasUtf = 0
			var t
			var i = 0
			while (1) {
				assert(ptr + i < TOTAL_MEMORY)
				t = HEAPU8[(ptr + i) >> 0]
				hasUtf |= t
				if (t == 0 && !length) break
				i++
				if (length && i == length) break
			}
			if (!length) length = i
			var ret = ''
			if (hasUtf < 128) {
				var MAX_CHUNK = 1024
				var curr
				while (length > 0) {
					curr = String.fromCharCode.apply(
						String,
						HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)),
					)
					ret = ret ? ret + curr : curr
					ptr += MAX_CHUNK
					length -= MAX_CHUNK
				}
				return ret
			}
			return UTF8ToString(ptr)
		}
		var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined
		function UTF8ArrayToString(u8Array, idx) {
			var endPtr = idx
			while (u8Array[endPtr]) ++endPtr
			if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
				return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
			} else {
				var u0, u1, u2, u3, u4, u5
				var str = ''
				while (1) {
					u0 = u8Array[idx++]
					if (!u0) return str
					if (!(u0 & 128)) {
						str += String.fromCharCode(u0)
						continue
					}
					u1 = u8Array[idx++] & 63
					if ((u0 & 224) == 192) {
						str += String.fromCharCode(((u0 & 31) << 6) | u1)
						continue
					}
					u2 = u8Array[idx++] & 63
					if ((u0 & 240) == 224) {
						u0 = ((u0 & 15) << 12) | (u1 << 6) | u2
					} else {
						u3 = u8Array[idx++] & 63
						if ((u0 & 248) == 240) {
							u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3
						} else {
							u4 = u8Array[idx++] & 63
							if ((u0 & 252) == 248) {
								u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4
							} else {
								u5 = u8Array[idx++] & 63
								u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5
							}
						}
					}
					if (u0 < 65536) {
						str += String.fromCharCode(u0)
					} else {
						var ch = u0 - 65536
						str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023))
					}
				}
			}
		}
		function UTF8ToString(ptr) {
			return UTF8ArrayToString(HEAPU8, ptr)
		}
		function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
			if (!(maxBytesToWrite > 0)) return 0
			var startIdx = outIdx
			var endIdx = outIdx + maxBytesToWrite - 1
			for (var i = 0; i < str.length; ++i) {
				var u = str.charCodeAt(i)
				if (u >= 55296 && u <= 57343) {
					var u1 = str.charCodeAt(++i)
					u = (65536 + ((u & 1023) << 10)) | (u1 & 1023)
				}
				if (u <= 127) {
					if (outIdx >= endIdx) break
					outU8Array[outIdx++] = u
				} else if (u <= 2047) {
					if (outIdx + 1 >= endIdx) break
					outU8Array[outIdx++] = 192 | (u >> 6)
					outU8Array[outIdx++] = 128 | (u & 63)
				} else if (u <= 65535) {
					if (outIdx + 2 >= endIdx) break
					outU8Array[outIdx++] = 224 | (u >> 12)
					outU8Array[outIdx++] = 128 | ((u >> 6) & 63)
					outU8Array[outIdx++] = 128 | (u & 63)
				} else if (u <= 2097151) {
					if (outIdx + 3 >= endIdx) break
					outU8Array[outIdx++] = 240 | (u >> 18)
					outU8Array[outIdx++] = 128 | ((u >> 12) & 63)
					outU8Array[outIdx++] = 128 | ((u >> 6) & 63)
					outU8Array[outIdx++] = 128 | (u & 63)
				} else if (u <= 67108863) {
					if (outIdx + 4 >= endIdx) break
					outU8Array[outIdx++] = 248 | (u >> 24)
					outU8Array[outIdx++] = 128 | ((u >> 18) & 63)
					outU8Array[outIdx++] = 128 | ((u >> 12) & 63)
					outU8Array[outIdx++] = 128 | ((u >> 6) & 63)
					outU8Array[outIdx++] = 128 | (u & 63)
				} else {
					if (outIdx + 5 >= endIdx) break
					outU8Array[outIdx++] = 252 | (u >> 30)
					outU8Array[outIdx++] = 128 | ((u >> 24) & 63)
					outU8Array[outIdx++] = 128 | ((u >> 18) & 63)
					outU8Array[outIdx++] = 128 | ((u >> 12) & 63)
					outU8Array[outIdx++] = 128 | ((u >> 6) & 63)
					outU8Array[outIdx++] = 128 | (u & 63)
				}
			}
			outU8Array[outIdx] = 0
			return outIdx - startIdx
		}
		function stringToUTF8(str, outPtr, maxBytesToWrite) {
			assert(
				typeof maxBytesToWrite == 'number',
				'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!',
			)
			return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
		}
		function lengthBytesUTF8(str) {
			var len = 0
			for (var i = 0; i < str.length; ++i) {
				var u = str.charCodeAt(i)
				if (u >= 55296 && u <= 57343)
					u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023)
				if (u <= 127) {
					++len
				} else if (u <= 2047) {
					len += 2
				} else if (u <= 65535) {
					len += 3
				} else if (u <= 2097151) {
					len += 4
				} else if (u <= 67108863) {
					len += 5
				} else {
					len += 6
				}
			}
			return len
		}
		var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined
		function demangle(func) {
			warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling')
			return func
		}
		function demangleAll(text) {
			var regex = /__Z[\w\d_]+/g
			return text.replace(regex, function (x) {
				var y = demangle(x)
				return x === y ? x : y + ' [' + x + ']'
			})
		}
		function jsStackTrace() {
			var err = new Error()
			if (!err.stack) {
				try {
					throw new Error(0)
				} catch (e) {
					err = e
				}
				if (!err.stack) {
					return '(no stack trace available)'
				}
			}
			return err.stack.toString()
		}
		function stackTrace() {
			var js = jsStackTrace()
			if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']()
			return demangleAll(js)
		}
		var WASM_PAGE_SIZE = 65536
		var ASMJS_PAGE_SIZE = 16777216
		var MIN_TOTAL_MEMORY = 16777216
		function alignUp(x, multiple) {
			if (x % multiple > 0) {
				x += multiple - (x % multiple)
			}
			return x
		}
		var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64
		function updateGlobalBuffer(buf) {
			Module['buffer'] = buffer = buf
		}
		function updateGlobalBufferViews() {
			Module['HEAP8'] = HEAP8 = new Int8Array(buffer)
			Module['HEAP16'] = HEAP16 = new Int16Array(buffer)
			Module['HEAP32'] = HEAP32 = new Int32Array(buffer)
			Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer)
			Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer)
			Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer)
			Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer)
			Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer)
		}
		var STATIC_BASE, STATICTOP, staticSealed
		var STACK_BASE, STACKTOP, STACK_MAX
		var DYNAMIC_BASE, DYNAMICTOP_PTR
		STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0
		staticSealed = false
		function writeStackCookie() {
			assert((STACK_MAX & 3) == 0)
			HEAPU32[(STACK_MAX >> 2) - 1] = 34821223
			HEAPU32[(STACK_MAX >> 2) - 2] = 2310721022
		}
		function checkStackCookie() {
			if (
				HEAPU32[(STACK_MAX >> 2) - 1] != 34821223 ||
				HEAPU32[(STACK_MAX >> 2) - 2] != 2310721022
			) {
				abort(
					'Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' +
						HEAPU32[(STACK_MAX >> 2) - 2].toString(16) +
						' ' +
						HEAPU32[(STACK_MAX >> 2) - 1].toString(16),
				)
			}
			if (HEAP32[0] !== 1668509029)
				throw 'Runtime error: The application has corrupted its heap memory area (address zero)!'
		}
		function abortStackOverflow(allocSize) {
			abort(
				'Stack overflow! Attempted to allocate ' +
					allocSize +
					' bytes on the stack, but stack has only ' +
					(STACK_MAX - stackSave() + allocSize) +
					' bytes available!',
			)
		}
		function abortOnCannotGrowMemory() {
			abort(
				'Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' +
					TOTAL_MEMORY +
					', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ',
			)
		}
		if (!Module['reallocBuffer'])
			Module['reallocBuffer'] = function (size) {
				var ret
				try {
					var oldHEAP8 = HEAP8
					ret = new ArrayBuffer(size)
					var temp = new Int8Array(ret)
					temp.set(oldHEAP8)
				} catch (e) {
					return false
				}
				var success = _emscripten_replace_memory(ret)
				if (!success) return false
				return ret
			}
		function enlargeMemory() {
			assert(HEAP32[DYNAMICTOP_PTR >> 2] > TOTAL_MEMORY)
			var PAGE_MULTIPLE = Module['usingWasm'] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE
			var LIMIT = 2147483648 - PAGE_MULTIPLE
			if (HEAP32[DYNAMICTOP_PTR >> 2] > LIMIT) {
				err(
					'Cannot enlarge memory, asked to go up to ' +
						HEAP32[DYNAMICTOP_PTR >> 2] +
						' bytes, but the limit is ' +
						LIMIT +
						' bytes!',
				)
				return false
			}
			var OLD_TOTAL_MEMORY = TOTAL_MEMORY
			TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY)
			while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR >> 2]) {
				if (TOTAL_MEMORY <= 536870912) {
					TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE)
				} else {
					TOTAL_MEMORY = Math.min(
						alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE),
						LIMIT,
					)
					if (TOTAL_MEMORY === OLD_TOTAL_MEMORY) {
						warnOnce(
							'Cannot ask for more memory since we reached the practical limit in browsers (which is just below 2GB), so the request would have failed. Requesting only ' +
								TOTAL_MEMORY,
						)
					}
				}
			}
			var start = Date.now()
			var replacement = Module['reallocBuffer'](TOTAL_MEMORY)
			if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
				err(
					'Failed to grow the heap from ' +
						OLD_TOTAL_MEMORY +
						' bytes to ' +
						TOTAL_MEMORY +
						' bytes, not enough memory!',
				)
				if (replacement) {
					err(
						'Expected to get back a buffer of size ' +
							TOTAL_MEMORY +
							' bytes, but instead got back a buffer of size ' +
							replacement.byteLength,
					)
				}
				TOTAL_MEMORY = OLD_TOTAL_MEMORY
				return false
			}
			updateGlobalBuffer(replacement)
			updateGlobalBufferViews()
			if (!Module['usingWasm']) {
				err(
					'Warning: Enlarging memory arrays, this is not fast! ' + [OLD_TOTAL_MEMORY, TOTAL_MEMORY],
				)
			}
			return true
		}
		var byteLength
		try {
			byteLength = Function.prototype.call.bind(
				Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get,
			)
			byteLength(new ArrayBuffer(4))
		} catch (e) {
			byteLength = function (buffer) {
				return buffer.byteLength
			}
		}
		var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880
		var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216
		if (TOTAL_MEMORY < TOTAL_STACK)
			err(
				'TOTAL_MEMORY should be larger than TOTAL_STACK, was ' +
					TOTAL_MEMORY +
					'! (TOTAL_STACK=' +
					TOTAL_STACK +
					')',
			)
		assert(
			typeof Int32Array !== 'undefined' &&
				typeof Float64Array !== 'undefined' &&
				Int32Array.prototype.subarray !== undefined &&
				Int32Array.prototype.set !== undefined,
			'JS engine does not provide full typed array support',
		)
		if (Module['buffer']) {
			buffer = Module['buffer']
			assert(
				buffer.byteLength === TOTAL_MEMORY,
				'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength,
			)
		} else {
			{
				buffer = new ArrayBuffer(TOTAL_MEMORY)
			}
			assert(buffer.byteLength === TOTAL_MEMORY)
			Module['buffer'] = buffer
		}
		updateGlobalBufferViews()
		function getTotalMemory() {
			return TOTAL_MEMORY
		}
		HEAP32[0] = 1668509029
		HEAP16[1] = 25459
		if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99)
			throw 'Runtime error: expected the system to be little-endian!'
		function callRuntimeCallbacks(callbacks) {
			while (callbacks.length > 0) {
				var callback = callbacks.shift()
				if (typeof callback == 'function') {
					callback()
					continue
				}
				var func = callback.func
				if (typeof func === 'number') {
					if (callback.arg === undefined) {
						Module['dynCall_v'](func)
					} else {
						Module['dynCall_vi'](func, callback.arg)
					}
				} else {
					func(callback.arg === undefined ? null : callback.arg)
				}
			}
		}
		var __ATPRERUN__ = []
		var __ATINIT__ = []
		var __ATMAIN__ = []
		var __ATEXIT__ = []
		var __ATPOSTRUN__ = []
		var runtimeInitialized = false
		var runtimeExited = false
		function preRun() {
			if (Module['preRun']) {
				if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']]
				while (Module['preRun'].length) {
					addOnPreRun(Module['preRun'].shift())
				}
			}
			callRuntimeCallbacks(__ATPRERUN__)
		}
		function ensureInitRuntime() {
			checkStackCookie()
			if (runtimeInitialized) return
			runtimeInitialized = true
			callRuntimeCallbacks(__ATINIT__)
		}
		function preMain() {
			checkStackCookie()
			callRuntimeCallbacks(__ATMAIN__)
		}
		function exitRuntime() {
			checkStackCookie()
			callRuntimeCallbacks(__ATEXIT__)
			runtimeExited = true
		}
		function postRun() {
			checkStackCookie()
			if (Module['postRun']) {
				if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']]
				while (Module['postRun'].length) {
					addOnPostRun(Module['postRun'].shift())
				}
			}
			callRuntimeCallbacks(__ATPOSTRUN__)
		}
		function addOnPreRun(cb) {
			__ATPRERUN__.unshift(cb)
		}
		function addOnPostRun(cb) {
			__ATPOSTRUN__.unshift(cb)
		}
		function writeArrayToMemory(array, buffer) {
			assert(
				array.length >= 0,
				'writeArrayToMemory array must have a length (should be an array or typed array)',
			)
			HEAP8.set(array, buffer)
		}
		function writeAsciiToMemory(str, buffer, dontAddNull) {
			for (var i = 0; i < str.length; ++i) {
				assert((str.charCodeAt(i) === str.charCodeAt(i)) & 255)
				HEAP8[buffer++ >> 0] = str.charCodeAt(i)
			}
			if (!dontAddNull) HEAP8[buffer >> 0] = 0
		}
		if (!Math.imul || Math.imul(4294967295, 5) !== -5)
			Math.imul = function imul(a, b) {
				var ah = a >>> 16
				var al = a & 65535
				var bh = b >>> 16
				var bl = b & 65535
				return (al * bl + ((ah * bl + al * bh) << 16)) | 0
			}
		if (!Math.clz32)
			Math.clz32 = function (x) {
				var n = 32
				var y = x >> 16
				if (y) {
					n -= 16
					x = y
				}
				y = x >> 8
				if (y) {
					n -= 8
					x = y
				}
				y = x >> 4
				if (y) {
					n -= 4
					x = y
				}
				y = x >> 2
				if (y) {
					n -= 2
					x = y
				}
				y = x >> 1
				if (y) return n - 2
				return n - x
			}
		if (!Math.trunc)
			Math.trunc = function (x) {
				return x < 0 ? Math.ceil(x) : Math.floor(x)
			}
		var Math_abs = Math.abs
		var Math_ceil = Math.ceil
		var Math_floor = Math.floor
		var Math_min = Math.min
		var runDependencies = 0
		var runDependencyWatcher = null
		var dependenciesFulfilled = null
		var runDependencyTracking = {}
		function addRunDependency(id) {
			runDependencies++
			if (Module['monitorRunDependencies']) {
				Module['monitorRunDependencies'](runDependencies)
			}
			if (id) {
				assert(!runDependencyTracking[id])
				runDependencyTracking[id] = 1
				if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
					runDependencyWatcher = setInterval(function () {
						if (ABORT) {
							clearInterval(runDependencyWatcher)
							runDependencyWatcher = null
							return
						}
						var shown = false
						for (var dep in runDependencyTracking) {
							if (!shown) {
								shown = true
								err('still waiting on run dependencies:')
							}
							err('dependency: ' + dep)
						}
						if (shown) {
							err('(end of list)')
						}
					}, 1e4)
				}
			} else {
				err('warning: run dependency added without ID')
			}
		}
		function removeRunDependency(id) {
			runDependencies--
			if (Module['monitorRunDependencies']) {
				Module['monitorRunDependencies'](runDependencies)
			}
			if (id) {
				assert(runDependencyTracking[id])
				delete runDependencyTracking[id]
			} else {
				err('warning: run dependency removed without ID')
			}
			if (runDependencies == 0) {
				if (runDependencyWatcher !== null) {
					clearInterval(runDependencyWatcher)
					runDependencyWatcher = null
				}
				if (dependenciesFulfilled) {
					var callback = dependenciesFulfilled
					dependenciesFulfilled = null
					callback()
				}
			}
		}
		Module['preloadedImages'] = {}
		Module['preloadedAudios'] = {}
		var memoryInitializer = null
		var FS = {
			error: function () {
				abort(
					'Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1',
				)
			},
			init: function () {
				FS.error()
			},
			createDataFile: function () {
				FS.error()
			},
			createPreloadedFile: function () {
				FS.error()
			},
			createLazyFile: function () {
				FS.error()
			},
			open: function () {
				FS.error()
			},
			mkdev: function () {
				FS.error()
			},
			registerDevice: function () {
				FS.error()
			},
			analyzePath: function () {
				FS.error()
			},
			loadFilesFromDB: function () {
				FS.error()
			},
			ErrnoError: function ErrnoError() {
				FS.error()
			},
		}
		Module['FS_createDataFile'] = FS.createDataFile
		Module['FS_createPreloadedFile'] = FS.createPreloadedFile
		var dataURIPrefix = 'data:application/octet-stream;base64,'
		function isDataURI(filename) {
			return String.prototype.startsWith
				? filename.startsWith(dataURIPrefix)
				: filename.indexOf(dataURIPrefix) === 0
		}
		STATIC_BASE = GLOBAL_BASE
		STATICTOP = STATIC_BASE + 71744
		__ATINIT__.push(
			{
				func: function () {
					__GLOBAL__sub_I_PowerEPD_WB_cpp()
				},
			},
			{
				func: function () {
					__GLOBAL__sub_I_bind_cpp()
				},
			},
		)
		memoryInitializer =
			'data:application/octet-stream;base64,AAAAAAAAAACzf1J9nHimcZJojF3HUIFC/jKIIm0RAACT7njdAs1/vTmvdKJul1qOZIeugk2Azn5ndUpj0EndKrwI9uUdxaOoo5LAhACAwISjkqOoHcX25bwI3SrQSUpjZ3XOflJ9kmiBQm0ReN05r1qOTYBkh3SiAs0AAP4yjF2ceLN/pnHHUIgik+5/vW6XroJAe11XChoj1bacMoGZijC2RPfjOl1t/39dbeM6RPcwtpmKMoG2nCPVChpdV0B7nHiBQpPudKJNgG6XeN3+MqZxUn3HUAAAOa+uglqOAs2IIpJos3+MXW0Rf71kh2d13SodxcCEo5L25dBJzn5KY7wIo6gAgKOovAhKY85+0En25aOSwIQdxd0qZ3WmcW0RdKKuggLNgUKzf8dQeN1kh26XAACSaJt4iCI5r02Af73+MlJ9jF2T7lqOXW1E95mKtpwKGkB7XVcj1TKBMLbjOv9/4zowtjKBI9VdV0B7Chq2nJmKRPddbZJoeN1NgALNjF2mcZPuroJ/vcdQnHgAAGSHOa+BQlJ9bRFajnSi/jKzf4gibpdKYx3FwIS8CM5+3SqjkqOo0ElndfblAID25Wd10EmjqKOS3SrOfrwIwIQdxUpjjF05r26XgUKmcQLNZIeIIlJ9k+5NgAAAs39tEa6CeN2ceP4yWo5/vZJox1B0ol1Xtpwwtl1t4zqZiiPVQHsKGjKBRPf/f0T3MoEKGkB7I9WZiuM6XW0wtracXVcAAAAAAAAAAAMAAwADAAMAAwAEAAUABQAGAAYABwAIAAkACgAKAAwADgAOABEAEgAUAAAAAAAAAAAAAADvycM9uyePPhkE1j4xmeo+N4nBPsDsnj4Hzpk+NV56PiEfdD6ppE4+okU2PoqOJD4s1Bo+5/spPpqZGT6oNQ0+F7cRPiEf9D1oke09Y3/ZPQAAAAAAAAAAAAAAAAAAAADKw5BBOdaPQXe+lUH+Q51BF9l6QQCRTkEKaE5BRrYwQUmdMEFSSRVBF9kJQduK60ASFNdAUI3XQDMzu0AU0KJAMuagQGwJjUBGtotAyJh7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAEAAgACAAIAAwADAAMABAAEAAQABAAFAAUABQAFAAYABgAGAAYABgAHAAcABwAHAAcACAAIAAgACAAIAAgACQAJAAkACQAJAAkACgAKAAoACgAKAAoACgALAAsACwALAAsACwALAAsADAAMAAwADAAMAAwADAAMAAwADQANAA0ADQANAA0ADQANAA0ADQAOAA4ADgAOAA4ADgAOAA4ADgAOAA8ADwAPAA8ADwAPAA8ADwAPAA8ADwAPABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAARABEAEQARABEAEQARABEAEQARABEAEQARABEAEgASABIAEgASABIAEgASABIAEgASABIAEgASABIAEgASABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAEwATABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAVABUAFQAVABUAFQAVABUAFQAVABUAFQAVABUAFQAVABUAFQAVABUAFQAVABUAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAwkoAAL4XAADHZgAAtDcAAGIKAACvXgAAfzQAALkLAABFZAAADT4AAP8YAAAIdQAAGVIAACQwAAAaDwAA724AAJhPAAALMQAAPBMAACN2AAC5WQAA9D0AAM0iAAA9CAAAP24AAMxUAADeOwAAbyMAAHwLAAD/cwAA81wAAFVGAAAgMAAAUhoAAOUEAADXbwAAJFsAAMpGAADGMgAAFB8AALILAACeeAAA1mUAAFZTAAAdQQAAKS8AAHcdAAAHDAAA1XoAAOBpAAAoWQAAqUgAAGI4AABSKAAAeBgAANIIAABeeQAAHGoAAAtbAAAoTAAAdD0AAOwuAACQIAAAXxIAAFgEAAB6dgAAw2gAADRbAADKTQAAh0AAAGczAABsJgAAkxkAAN0MAABIAAAA1XMAAIFnAABNWwAAOE8AAEJDAABpNwAArSsAAA4gAACLFAAAJAkAANh9AACmcgAAjmcAAJBcAACrUQAA30YAACs8AACPMQAACicAAJ0cAABGEgAABQgAANp9AADFcwAAxWkAANpfAAADVgAAQEwAAJFCAAD2OAAAbi8AAPklAACXHAAARxMAAAgKAADcAAAAwncAALhuAADAZQAA2FwAAAFUAAA6SwAAhEIAAN05AABFMQAAvigAAEUgAADbFwAAgA8AADQHAAD2fgAAxnYAAKRuAACQZgAAiV4AAJBWAACkTgAAxkYAAPQ+AAAvNwAAdi8AAMonAAArIAAAlxgAABARAACUCQAAJAIAAL96AABmcwAAGGwAANZkAACeXQAAcVYAAE9PAAA4SAAAK0EAACg6AAAwMwAAQiwAAF0lAACDHgAAsxcAAOwQAAAvCgAAewMAANF8AAAwdgAAmG8AAAlpAACEYgAAB1wAAJNVAAAnTwAAxUgAAGpCAAAYPAAAzzUAAI4vAABVKQAAJCMAAPscAADaFgAAwRAAAK8KAACmBAAAo34AAKl4AAC2cgAAymwAAOZmAAAJYQAAM1sAAGRVAACcTwAA3EkAACJEAABvPgAAwzgAAB0zAAB+LQAA5icAAFQiAADJHAAARBcAAMYRAABODAAA3AYAAHEBAAALfAAArHYAAFJxAAD/awAAsWYAAGphAAAoXAAA7FYAALZRAACFTAAAW0cAADVCAAAVPQAA+zcAAOYyAADXLQAAzSgAAMgjAADIHgAAzhkAANkUAADpDwAA/goAABgGAAA3AQAAXHwAAIV3AACzcgAA5m0AAB1pAABaZAAAm18AAOFaAAArVgAAe1EAAM9MAAAnSAAAhEMAAOU+AABLOgAAtjUAACQxAACXLAAADygAAIsjAAALHwAAjxoAABcWAACkEQAANQ0AAMoIAABjBAAAAAAAAAAAAAAAAAAAAAAAAOStsgPIW2UHsAkYC5C3yg6AZX0SYBMwFkDB4hkgb5UdAB1IIQDL+iTAeK0owCZgLMDUEjCAgsUzgDB4N0DeKjtAjN0+ADqQQgDoQkYAlvVJAESoTYDxWlGAnw1VgE3AWAAAAAAAAAAAAAAAAAAAPQo+CkIKSQpSCl0KbAp8CpAKpgq+CtoK9woYCzoLYAuIC7IL3wsPDEEMdQysDOYMIg1gDaEN5A0qDnIOvQ4KD1kPqw//D1YQrxAKEWcRxxEpEo0S8xJcE8cTNBSjFBQVhxX9FXQW7hZqF+cXZxjoGGwZ8hl5GgIbjRsaHKkcOh3MHWAe9h6NHyYgwSBdIfshmiI7I94jgiQnJc4ldiYfJ8ondigkKdIpgiozK+UrmCxMLQIuuC5wLygw4TCbMVYyEjPPM4w0SjUJNsg2iDdJOAo5zDmOOlE7FDzYPJw9YD4lP+k/rkB0QTlC/0LEQ4pEUEUVRttGoUdmSCtJ8Um2SnpLP0wDTcdNik5NTw9Q0VCTUVRSFFPUU5NUUlUPVsxWiFdEWP5YuFlxWilb4FuVXEpd/l2xXmJfE2DCYHBhHGLIYnJjG2TCZGhlDWawZlJn8meRaC5pyWljavtqkmsnbLpsS23bbWlu9W5/bwdwjnAScZVxFnKUchFzjHMEdHt073RhddJ1QHasdhV3fXfid0V4pngEeWF5u3kSemd6unoLe1l7pXvuezV8eny8fPx8OX10fax94n0VfkZ+dH6gfsl+8H4UfzV/VH9xf4t/on+3f8l/2H/lf/B/93/9f/9//3/9f/d/8H/lf9h/yX+3f6J/i39xf1R/NX8Uf/B+yX6gfnR+Rn4VfuJ9rH10fTl9/Hy8fHp8NXzue6V7WXsLe7p6Z3oSert5YXkEeaZ4RXjid313FXesdkB20nVhde90e3QEdIxzEXOUchZylXEScY5wB3B/b/VuaW7bbUttumwnbJJr+2pjaslpLmmRaPJnUmewZg1maGXCZBtkcmPIYhxicGHCYBNgYl+xXv5dSl2VXOBbKVtxWrhZ/lhEWIhXzFYPVlJVk1TUUxRTVFKTUdFQD1BNT4pOx00DTT9Meku2SvFJK0lmSKFH20YVRlBFikTEQ/9COUJ0Qa5A6T8lP2A+nD3YPBQ8UTuOOsw5CjlJOIg3yDYJNko1jDTPMxIzVjKbMeEwKDBwL7guAi5MLZgs5SszK4Iq0ikkKXYoyicfJ3YmziUnJYIk3iM7I5oi+yFdIcEgJiCNH/YeYB7MHTodqRwaHI0bAht5GvIZbBnoGGcY5xdqF+4WdBb9FYcVFBWjFDQUxxNcE/MSjRIpEscRZxEKEa8QVhD/D6sPWQ8KD70Ocg4qDuQNoQ1gDSIN5gysDHUMQQwPDN8LsguIC2ALOgsYC/cK2gq+CqYKkAp8CmwKXQpSCkkKQgo+Cj0KAAAAAAAAAAAAAAAAAAAAzeXHAAAAAAAAAAAAAAAAAPeGxwAAAAAAAAAAAAAAAIB9ScgAAAAAAAAAAAAAAACAbInIAAAAAAAAAAAAAAAAgG8FyAAAAAAAAAAAAAAAAABhO8gAAAAAAAAAAAAAAAAA7KXGAAAAAAAAAAAAAAAAAKQ+RwAAAAAAAAAAAAAAAABQsUUAAAAAAAAAAAAAAAAAAAAA/wAAAPwBAAD3AgAA8QMAAOgEAADdBQAA0QYAAMMHAACzCAAAoQkAAI4KAAB5CwAAYgwAAEoNAAAvDgAAFA8AAPcPAADYEAAAtxEAAJYSAAByEwAATRQAACcVAAAAFgAA1hYAAKwXAACAGAAAUxkAACQaAAD0GgAAwxsAAJAcAABcHQAAJx4AAPEeAAC5HwAAgSAAAEchAAALIgAAzyIAAJIjAABTJAAAEyUAANIlAACQJgAATScAAAkoAADDKAAAfSkAADYqAADtKgAApCsAAFksAAAOLQAAwS0AAHQuAAAmLwAA1i8AAIYwAAA1MQAA4zEAAI8yAAA7MwAA5zMAAJE0AAA6NQAA4zUAAIo2AAAxNwAA1zcAAHw4AAAgOQAAxDkAAGY6AAAIOwAAqTsAAEk8AADpPAAAiD0AACU+AADDPgAAXz8AAPs/AACWQAAAMEEAAMlBAABiQgAA+kIAAJFDAAAoRAAAvkQAAFNFAADnRQAAfEYAAA9HAACiRwAANEgAAMVIAABWSQAA5kkAAHVKAAAESwAAkksAACBMAACtTAAAOU0AAMVNAABQTgAA2k4AAGRPAADuTwAAd1AAAP9QAACHUQAADlIAAJRSAAAaUwAAoFMAACVUAACpVAAALVUAALBVAAAzVgAAtVYAADdXAAC4VwAAOVgAAACAFgBTSA0AowQHAACQAwDFyQEAG+UAAJVyAABLOQAApRwAAFIOAAApBwAAlAMAAMoBAAAAAAAAAAAAAAAAAAAyamDMAAAAAAAAAAAAAAAANs0DzAAAAAAAAAAAAAAAAI/ExMwAAAAAAAAAAAAAAAD1MwbNAAAAAAAAAAAAAAAA406CzAAAAAAAAAAAAAAAALr8tswAAAAAAAAAAAAAAAB4CCLLAAAAAAAAAAAAAAAAKCy6SwAAAAAAAAAAAAAAACAoLUoAAAAAAAAAAAAAAACgHAAAyBoAAAgdAADQHAAAsBwAALAaAAAIHQAA0BwAAKAcAAAoGwAACB0AAPAcAACwHAAAEBsAAAgdAADwHAAAEQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAETCQsLAAAJBgsAAAsABhEAAAAREREAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAEQAKChEREQAKAAACAAkLAAAACQALAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAwAAAAADAAAAAAJDAAAAAAADAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAANAAAABA0AAAAACQ4AAAAAAA4AAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAADwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhISAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIAAAASEhIAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAKAAAAAAoAAAAACQsAAAAAAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAwMTIzNDU2Nzg5QUJDREVGVCEiGQ0BAgMRSxwMEAQLHRIeJ2hub3BxYiAFBg8TFBUaCBYHKCQXGAkKDhsfJSODgn0mKis8PT4/Q0dKTVhZWltcXV5fYGFjZGVmZ2lqa2xyc3R5ent8AAAAAAAAAAAASWxsZWdhbCBieXRlIHNlcXVlbmNlAERvbWFpbiBlcnJvcgBSZXN1bHQgbm90IHJlcHJlc2VudGFibGUATm90IGEgdHR5AFBlcm1pc3Npb24gZGVuaWVkAE9wZXJhdGlvbiBub3QgcGVybWl0dGVkAE5vIHN1Y2ggZmlsZSBvciBkaXJlY3RvcnkATm8gc3VjaCBwcm9jZXNzAEZpbGUgZXhpc3RzAFZhbHVlIHRvbyBsYXJnZSBmb3IgZGF0YSB0eXBlAE5vIHNwYWNlIGxlZnQgb24gZGV2aWNlAE91dCBvZiBtZW1vcnkAUmVzb3VyY2UgYnVzeQBJbnRlcnJ1cHRlZCBzeXN0ZW0gY2FsbABSZXNvdXJjZSB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZQBJbnZhbGlkIHNlZWsAQ3Jvc3MtZGV2aWNlIGxpbmsAUmVhZC1vbmx5IGZpbGUgc3lzdGVtAERpcmVjdG9yeSBub3QgZW1wdHkAQ29ubmVjdGlvbiByZXNldCBieSBwZWVyAE9wZXJhdGlvbiB0aW1lZCBvdXQAQ29ubmVjdGlvbiByZWZ1c2VkAEhvc3QgaXMgZG93bgBIb3N0IGlzIHVucmVhY2hhYmxlAEFkZHJlc3MgaW4gdXNlAEJyb2tlbiBwaXBlAEkvTyBlcnJvcgBObyBzdWNoIGRldmljZSBvciBhZGRyZXNzAEJsb2NrIGRldmljZSByZXF1aXJlZABObyBzdWNoIGRldmljZQBOb3QgYSBkaXJlY3RvcnkASXMgYSBkaXJlY3RvcnkAVGV4dCBmaWxlIGJ1c3kARXhlYyBmb3JtYXQgZXJyb3IASW52YWxpZCBhcmd1bWVudABBcmd1bWVudCBsaXN0IHRvbyBsb25nAFN5bWJvbGljIGxpbmsgbG9vcABGaWxlbmFtZSB0b28gbG9uZwBUb28gbWFueSBvcGVuIGZpbGVzIGluIHN5c3RlbQBObyBmaWxlIGRlc2NyaXB0b3JzIGF2YWlsYWJsZQBCYWQgZmlsZSBkZXNjcmlwdG9yAE5vIGNoaWxkIHByb2Nlc3MAQmFkIGFkZHJlc3MARmlsZSB0b28gbGFyZ2UAVG9vIG1hbnkgbGlua3MATm8gbG9ja3MgYXZhaWxhYmxlAFJlc291cmNlIGRlYWRsb2NrIHdvdWxkIG9jY3VyAFN0YXRlIG5vdCByZWNvdmVyYWJsZQBQcmV2aW91cyBvd25lciBkaWVkAE9wZXJhdGlvbiBjYW5jZWxlZABGdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQATm8gbWVzc2FnZSBvZiBkZXNpcmVkIHR5cGUASWRlbnRpZmllciByZW1vdmVkAERldmljZSBub3QgYSBzdHJlYW0ATm8gZGF0YSBhdmFpbGFibGUARGV2aWNlIHRpbWVvdXQAT3V0IG9mIHN0cmVhbXMgcmVzb3VyY2VzAExpbmsgaGFzIGJlZW4gc2V2ZXJlZABQcm90b2NvbCBlcnJvcgBCYWQgbWVzc2FnZQBGaWxlIGRlc2NyaXB0b3IgaW4gYmFkIHN0YXRlAE5vdCBhIHNvY2tldABEZXN0aW5hdGlvbiBhZGRyZXNzIHJlcXVpcmVkAE1lc3NhZ2UgdG9vIGxhcmdlAFByb3RvY29sIHdyb25nIHR5cGUgZm9yIHNvY2tldABQcm90b2NvbCBub3QgYXZhaWxhYmxlAFByb3RvY29sIG5vdCBzdXBwb3J0ZWQAU29ja2V0IHR5cGUgbm90IHN1cHBvcnRlZABOb3Qgc3VwcG9ydGVkAFByb3RvY29sIGZhbWlseSBub3Qgc3VwcG9ydGVkAEFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWQgYnkgcHJvdG9jb2wAQWRkcmVzcyBub3QgYXZhaWxhYmxlAE5ldHdvcmsgaXMgZG93bgBOZXR3b3JrIHVucmVhY2hhYmxlAENvbm5lY3Rpb24gcmVzZXQgYnkgbmV0d29yawBDb25uZWN0aW9uIGFib3J0ZWQATm8gYnVmZmVyIHNwYWNlIGF2YWlsYWJsZQBTb2NrZXQgaXMgY29ubmVjdGVkAFNvY2tldCBub3QgY29ubmVjdGVkAENhbm5vdCBzZW5kIGFmdGVyIHNvY2tldCBzaHV0ZG93bgBPcGVyYXRpb24gYWxyZWFkeSBpbiBwcm9ncmVzcwBPcGVyYXRpb24gaW4gcHJvZ3Jlc3MAU3RhbGUgZmlsZSBoYW5kbGUAUmVtb3RlIEkvTyBlcnJvcgBRdW90YSBleGNlZWRlZABObyBtZWRpdW0gZm91bmQAV3JvbmcgbWVkaXVtIHR5cGUATm8gZXJyb3IgaW5mb3JtYXRpb24AAAAAAADAgYLIAAAAAAAmb8cAAAAAAHB0RwAAAABr5f7MAAAAAByL6csAAAAAYLXuSwAAAABsIAAAfyIAAAAAAAABAAAA8BoAAAAAAABQIAAAWiIAAAAAAACwGgAAUCAAADQiAAABAAAAsBoAALwfAADdIQAAbCAAAKMiAAAAAAAAAQAAAAgbAAAAAAAAvB8AAM8iAABsIAAAPyMAAAAAAAABAAAASBsAAAAAAABQIAAAGiMAAAAAAAAQGwAAUCAAAPQiAAABAAAAEBsAAGwgAABjIwAAAAAAAAEAAAAIGwAAAAAAAGwgAAAkKQAAAAAAAAEAAAAIHAAAAAAAAGwgAADlKAAAAAAAAAEAAAAIHAAAAAAAAGwgAACAKAAAAAAAAAEAAAAIHAAAAAAAALwfAABhKAAAvB8AAEIoAAC8HwAAIygAALwfAAAEKAAAvB8AAOUnAAC8HwAAxicAALwfAACnJwAAvB8AAIgnAAC8HwAAaScAALwfAABKJwAAvB8AACsnAAC8HwAADCcAALwfAAC/KAAAvB8AACoqAADkHwAAiioAACgcAAAAAAAA5B8AADcqAAA4HAAAAAAAALwfAABYKgAA5B8AAGUqAAAYHAAAAAAAAOQfAABsKwAAEBwAAAAAAADkHwAAfCsAAFAcAAAAAAAA5B8AALErAAAoHAAAAAAAAOQfAACNKwAAcBwAAAAAAADkHwAA0ysAACgcAAAAAAAANCAAAPsrAAA0IAAA/SsAADQgAAAALAAANCAAAAIsAAA0IAAABCwAADQgAAAGLAAANCAAAAgsAABQIAAACiwAAAAAAADQHAAANCAAAA0sAAA0IAAADywAADQgAAARLAAANCAAABMsAAA0IAAAFSwAADQgAAAXLAAANCAAABksAADkHwAAGywAABgcAAAAAAAAAACMQgAAgD9kAAAAAACMQgAAwD8AgDtFAAAAP/AcAADwHAAAoBwAAPAcAADYHAAA8BwAALAaAAAQGwAAEB0AAMgaAACgHAAAyBoAANAcAAAIHQAA2BoAAOgaAACwGgAACB0AACgbAACgHAAAKBsAAPAcAAAIHQAAOBsAAOgaAAAQGwAACB0AALwdAAAFAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAADoYAQAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAD//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPB4AAAUAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAACAAAAmBABAAAEAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAr/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8HgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwFQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAGBwAAAEAAAACAAAAAwAAAAQAAAAEAAAAAQAAAAEAAAABAAAAAAAAAEAcAAABAAAABQAAAAMAAAAEAAAABAAAAAIAAAACAAAAAgAAAAAAAABQHAAABgAAAAcAAAACAAAAAAAAAGAcAAAGAAAACAAAAAIAAAAAAAAAkBwAAAEAAAAJAAAAAwAAAAQAAAAFAAAAAAAAAIAcAAABAAAACgAAAAMAAAAEAAAABgAAAAAAAAAgHQAAAQAAAAsAAAADAAAABAAAAAQAAAADAAAAAwAAAAMAAABDYW5ub3QgY3JlYXRlIGxvd0JpbiBhcnJheQBJbnB1dCBmcmFtZSBzaXplIGlzIHRvbyBsYXJnZSBmb3IgTUYgYW5hbHlzaXMAUG93ZXJFUERfQ3JlYXRlX0pTAGlpaQBQb3dlckVQRF9EZXN0cm95X0pTAHZpAFBvd2VyRVBEX0luaXRWb2ljZV9KUwBQb3dlckVQRF9GcmFtZVByb2NfSlMAaWlpaQBQb3dlckVQRF9HZXREYXRhX0pTAGlpAFBvd2VyRVBEX0dldFBvc19KUwBQb3dlckVQRF9HZXRTTlJfSlMAZmkAUG93ZXJFUERfU2V0UGF1c2VUaHJlc2hvbGRfSlMAdmVjdG9yPGludD4AdmVjdG9yPHNob3J0PgB2AHB1c2hfYmFjawB2aWlpAHJlc2l6ZQB2aWlpaQBzaXplAGdldABzZXQAaWlpaWkATjEwZW1zY3JpcHRlbjN2YWxFAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemUAUEtOU3QzX18yNnZlY3RvcklzTlNfOWFsbG9jYXRvcklzRUVFRQBQTlN0M19fMjZ2ZWN0b3JJc05TXzlhbGxvY2F0b3JJc0VFRUUATlN0M19fMjZ2ZWN0b3JJc05TXzlhbGxvY2F0b3JJc0VFRUUATlN0M19fMjEzX192ZWN0b3JfYmFzZUlzTlNfOWFsbG9jYXRvcklzRUVFRQBOU3QzX18yMjBfX3ZlY3Rvcl9iYXNlX2NvbW1vbklMYjFFRUUAUEtOU3QzX18yNnZlY3RvcklpTlNfOWFsbG9jYXRvcklpRUVFRQBQTlN0M19fMjZ2ZWN0b3JJaU5TXzlhbGxvY2F0b3JJaUVFRUUATlN0M19fMjZ2ZWN0b3JJaU5TXzlhbGxvY2F0b3JJaUVFRUUATlN0M19fMjEzX192ZWN0b3JfYmFzZUlpTlNfOWFsbG9jYXRvcklpRUVFRQBMaWNlbnNlIEluZm86ID4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+CgBSZWFkaW5nR2F0ZSAoT2ZmaWNpYWwpCgBMaWNlbnNlIEluZm86IDw8PDw8PDw8PDw8PDw8PDw8PDw8PAB2b2lkAGJvb2wAY2hhcgBzaWduZWQgY2hhcgB1bnNpZ25lZCBjaGFyAHNob3J0AHVuc2lnbmVkIHNob3J0AGludAB1bnNpZ25lZCBpbnQAbG9uZwB1bnNpZ25lZCBsb25nAGZsb2F0AGRvdWJsZQBzdGQ6OnN0cmluZwBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBzdGQ6OndzdHJpbmcAZW1zY3JpcHRlbjo6dmFsAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZyBkb3VibGU+AE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWVFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SW1FRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWlFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUALSsgICAwWDB4AChudWxsKQAtMFgrMFggMFgtMHgrMHggMHgAaW5mAElORgBuYW4ATkFOAC4AdGVybWluYXRpbmcgd2l0aCAlcyBleGNlcHRpb24gb2YgdHlwZSAlczogJXMAdGVybWluYXRpbmcgd2l0aCAlcyBleGNlcHRpb24gb2YgdHlwZSAlcwB0ZXJtaW5hdGluZyB3aXRoICVzIGZvcmVpZ24gZXhjZXB0aW9uAHRlcm1pbmF0aW5nAHVuY2F1Z2h0AFN0OWV4Y2VwdGlvbgBOMTBfX2N4eGFiaXYxMTZfX3NoaW1fdHlwZV9pbmZvRQBTdDl0eXBlX2luZm8ATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAE4xMF9fY3h4YWJpdjExN19fY2xhc3NfdHlwZV9pbmZvRQBwdGhyZWFkX29uY2UgZmFpbHVyZSBpbiBfX2N4YV9nZXRfZ2xvYmFsc19mYXN0KCkAY2Fubm90IGNyZWF0ZSBwdGhyZWFkIGtleSBmb3IgX19jeGFfZ2V0X2dsb2JhbHMoKQBjYW5ub3QgemVybyBvdXQgdGhyZWFkIHZhbHVlIGZvciBfX2N4YV9nZXRfZ2xvYmFscygpAHRlcm1pbmF0ZV9oYW5kbGVyIHVuZXhwZWN0ZWRseSByZXR1cm5lZABTdDExbG9naWNfZXJyb3IAU3QxMmxlbmd0aF9lcnJvcgBOMTBfX2N4eGFiaXYxMTlfX3BvaW50ZXJfdHlwZV9pbmZvRQBOMTBfX2N4eGFiaXYxMTdfX3BiYXNlX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTIzX19mdW5kYW1lbnRhbF90eXBlX2luZm9FAHYARG4AYgBjAGgAYQBzAFBzAHQAaQBqAGwAbQBmAGQATjEwX19jeHhhYml2MTIxX192bWlfY2xhc3NfdHlwZV9pbmZvRQ=='
		var tempDoublePtr = STATICTOP
		STATICTOP += 16
		assert(tempDoublePtr % 8 == 0)
		function ___cxa_allocate_exception(size) {
			return _malloc(size)
		}
		function __ZSt18uncaught_exceptionv() {
			return !!__ZSt18uncaught_exceptionv.uncaught_exception
		}
		var EXCEPTIONS = {
			last: 0,
			caught: [],
			infos: {},
			deAdjust: function (adjusted) {
				if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted
				for (var key in EXCEPTIONS.infos) {
					var ptr = +key
					var adj = EXCEPTIONS.infos[ptr].adjusted
					var len = adj.length
					for (var i = 0; i < len; i++) {
						if (adj[i] === adjusted) {
							return ptr
						}
					}
				}
				return adjusted
			},
			addRef: function (ptr) {
				if (!ptr) return
				var info = EXCEPTIONS.infos[ptr]
				info.refcount++
			},
			decRef: function (ptr) {
				if (!ptr) return
				var info = EXCEPTIONS.infos[ptr]
				assert(info.refcount > 0)
				info.refcount--
				if (info.refcount === 0 && !info.rethrown) {
					if (info.destructor) {
						Module['dynCall_vi'](info.destructor, ptr)
					}
					delete EXCEPTIONS.infos[ptr]
					___cxa_free_exception(ptr)
				}
			},
			clearRef: function (ptr) {
				if (!ptr) return
				var info = EXCEPTIONS.infos[ptr]
				info.refcount = 0
			},
		}
		function ___cxa_begin_catch(ptr) {
			var info = EXCEPTIONS.infos[ptr]
			if (info && !info.caught) {
				info.caught = true
				__ZSt18uncaught_exceptionv.uncaught_exception--
			}
			if (info) info.rethrown = false
			EXCEPTIONS.caught.push(ptr)
			EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr))
			return ptr
		}
		function ___resumeException(ptr) {
			if (!EXCEPTIONS.last) {
				EXCEPTIONS.last = ptr
			}
			throw (
				ptr +
				' - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.'
			)
		}
		function ___cxa_find_matching_catch() {
			var thrown = EXCEPTIONS.last
			if (!thrown) {
				return (setTempRet0(0), 0) | 0
			}
			var info = EXCEPTIONS.infos[thrown]
			var throwntype = info.type
			if (!throwntype) {
				return (setTempRet0(0), thrown) | 0
			}
			var typeArray = Array.prototype.slice.call(arguments)
			var pointer = Module['___cxa_is_pointer_type'](throwntype)
			if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4)
			HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown
			thrown = ___cxa_find_matching_catch.buffer
			for (var i = 0; i < typeArray.length; i++) {
				if (typeArray[i] && Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
					thrown = HEAP32[thrown >> 2]
					info.adjusted.push(thrown)
					return (setTempRet0(typeArray[i]), thrown) | 0
				}
			}
			thrown = HEAP32[thrown >> 2]
			return (setTempRet0(throwntype), thrown) | 0
		}
		function ___cxa_throw(ptr, type, destructor) {
			EXCEPTIONS.infos[ptr] = {
				ptr: ptr,
				adjusted: [ptr],
				type: type,
				destructor: destructor,
				refcount: 0,
				caught: false,
				rethrown: false,
			}
			EXCEPTIONS.last = ptr
			if (!('uncaught_exception' in __ZSt18uncaught_exceptionv)) {
				__ZSt18uncaught_exceptionv.uncaught_exception = 1
			} else {
				__ZSt18uncaught_exceptionv.uncaught_exception++
			}
			throw (
				ptr +
				' - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.'
			)
		}
		function ___gxx_personality_v0() {}
		function ___lock() {}
		var SYSCALLS = {
			buffers: [null, [], []],
			printChar: function (stream, curr) {
				var buffer = SYSCALLS.buffers[stream]
				assert(buffer)
				if (curr === 0 || curr === 10) {
					;(stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0))
					buffer.length = 0
				} else {
					buffer.push(curr)
				}
			},
			varargs: 0,
			get: function (varargs) {
				SYSCALLS.varargs += 4
				var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2]
				return ret
			},
			getStr: function () {
				var ret = Pointer_stringify(SYSCALLS.get())
				return ret
			},
			get64: function () {
				var low = SYSCALLS.get(),
					high = SYSCALLS.get()
				if (low >= 0) assert(high === 0)
				else assert(high === -1)
				return low
			},
			getZero: function () {
				assert(SYSCALLS.get() === 0)
			},
		}
		function ___syscall140(which, varargs) {
			SYSCALLS.varargs = varargs
			try {
				var stream = SYSCALLS.getStreamFromFD(),
					offset_high = SYSCALLS.get(),
					offset_low = SYSCALLS.get(),
					result = SYSCALLS.get(),
					whence = SYSCALLS.get()
				var offset = offset_low
				FS.llseek(stream, offset, whence)
				HEAP32[result >> 2] = stream.position
				if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null
				return 0
			} catch (e) {
				if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
				return -e.errno
			}
		}
		function flush_NO_FILESYSTEM() {
			var fflush = Module['_fflush']
			if (fflush) fflush(0)
			var buffers = SYSCALLS.buffers
			if (buffers[1].length) SYSCALLS.printChar(1, 10)
			if (buffers[2].length) SYSCALLS.printChar(2, 10)
		}
		function ___syscall146(which, varargs) {
			SYSCALLS.varargs = varargs
			try {
				var stream = SYSCALLS.get(),
					iov = SYSCALLS.get(),
					iovcnt = SYSCALLS.get()
				var ret = 0
				for (var i = 0; i < iovcnt; i++) {
					var ptr = HEAP32[(iov + i * 8) >> 2]
					var len = HEAP32[(iov + (i * 8 + 4)) >> 2]
					for (var j = 0; j < len; j++) {
						SYSCALLS.printChar(stream, HEAPU8[ptr + j])
					}
					ret += len
				}
				return ret
			} catch (e) {
				if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
				return -e.errno
			}
		}
		function ___syscall54(which, varargs) {
			SYSCALLS.varargs = varargs
			try {
				return 0
			} catch (e) {
				if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
				return -e.errno
			}
		}
		function ___syscall6(which, varargs) {
			SYSCALLS.varargs = varargs
			try {
				var stream = SYSCALLS.getStreamFromFD()
				FS.close(stream)
				return 0
			} catch (e) {
				if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
				return -e.errno
			}
		}
		function ___unlock() {}
		function getShiftFromSize(size) {
			switch (size) {
				case 1:
					return 0
				case 2:
					return 1
				case 4:
					return 2
				case 8:
					return 3
				default:
					throw new TypeError('Unknown type size: ' + size)
			}
		}
		function embind_init_charCodes() {
			var codes = new Array(256)
			for (var i = 0; i < 256; ++i) {
				codes[i] = String.fromCharCode(i)
			}
			embind_charCodes = codes
		}
		var embind_charCodes = undefined
		function readLatin1String(ptr) {
			var ret = ''
			var c = ptr
			while (HEAPU8[c]) {
				ret += embind_charCodes[HEAPU8[c++]]
			}
			return ret
		}
		var awaitingDependencies = {}
		var registeredTypes = {}
		var typeDependencies = {}
		var char_0 = 48
		var char_9 = 57
		function makeLegalFunctionName(name) {
			if (undefined === name) {
				return '_unknown'
			}
			name = name.replace(/[^a-zA-Z0-9_]/g, '$')
			var f = name.charCodeAt(0)
			if (f >= char_0 && f <= char_9) {
				return '_' + name
			} else {
				return name
			}
		}
		function createNamedFunction(name, body) {
			name = makeLegalFunctionName(name)
			return new Function(
				'body',
				'return function ' +
					name +
					'() {\n' +
					'    "use strict";' +
					'    return body.apply(this, arguments);\n' +
					'};\n',
			)(body)
		}
		function extendError(baseErrorType, errorName) {
			var errorClass = createNamedFunction(errorName, function (message) {
				this.name = errorName
				this.message = message
				var stack = new Error(message).stack
				if (stack !== undefined) {
					this.stack = this.toString() + '\n' + stack.replace(/^Error(:[^\n]*)?\n/, '')
				}
			})
			errorClass.prototype = Object.create(baseErrorType.prototype)
			errorClass.prototype.constructor = errorClass
			errorClass.prototype.toString = function () {
				if (this.message === undefined) {
					return this.name
				} else {
					return this.name + ': ' + this.message
				}
			}
			return errorClass
		}
		var BindingError = undefined
		function throwBindingError(message) {
			throw new BindingError(message)
		}
		var InternalError = undefined
		function throwInternalError(message) {
			throw new InternalError(message)
		}
		function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
			myTypes.forEach(function (type) {
				typeDependencies[type] = dependentTypes
			})
			function onComplete(typeConverters) {
				var myTypeConverters = getTypeConverters(typeConverters)
				if (myTypeConverters.length !== myTypes.length) {
					throwInternalError('Mismatched type converter count')
				}
				for (var i = 0; i < myTypes.length; ++i) {
					registerType(myTypes[i], myTypeConverters[i])
				}
			}
			var typeConverters = new Array(dependentTypes.length)
			var unregisteredTypes = []
			var registered = 0
			dependentTypes.forEach(function (dt, i) {
				if (registeredTypes.hasOwnProperty(dt)) {
					typeConverters[i] = registeredTypes[dt]
				} else {
					unregisteredTypes.push(dt)
					if (!awaitingDependencies.hasOwnProperty(dt)) {
						awaitingDependencies[dt] = []
					}
					awaitingDependencies[dt].push(function () {
						typeConverters[i] = registeredTypes[dt]
						++registered
						if (registered === unregisteredTypes.length) {
							onComplete(typeConverters)
						}
					})
				}
			})
			if (0 === unregisteredTypes.length) {
				onComplete(typeConverters)
			}
		}
		function registerType(rawType, registeredInstance, options) {
			options = options || {}
			if (!('argPackAdvance' in registeredInstance)) {
				throw new TypeError('registerType registeredInstance requires argPackAdvance')
			}
			var name = registeredInstance.name
			if (!rawType) {
				throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
			}
			if (registeredTypes.hasOwnProperty(rawType)) {
				if (options.ignoreDuplicateRegistrations) {
					return
				} else {
					throwBindingError("Cannot register type '" + name + "' twice")
				}
			}
			registeredTypes[rawType] = registeredInstance
			delete typeDependencies[rawType]
			if (awaitingDependencies.hasOwnProperty(rawType)) {
				var callbacks = awaitingDependencies[rawType]
				delete awaitingDependencies[rawType]
				callbacks.forEach(function (cb) {
					cb()
				})
			}
		}
		function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
			var shift = getShiftFromSize(size)
			name = readLatin1String(name)
			registerType(rawType, {
				name: name,
				fromWireType: function (wt) {
					return !!wt
				},
				toWireType: function (destructors, o) {
					return o ? trueValue : falseValue
				},
				argPackAdvance: 8,
				readValueFromPointer: function (pointer) {
					var heap
					if (size === 1) {
						heap = HEAP8
					} else if (size === 2) {
						heap = HEAP16
					} else if (size === 4) {
						heap = HEAP32
					} else {
						throw new TypeError('Unknown boolean type size: ' + name)
					}
					return this['fromWireType'](heap[pointer >> shift])
				},
				destructorFunction: null,
			})
		}
		function ClassHandle_isAliasOf(other) {
			if (!(this instanceof ClassHandle)) {
				return false
			}
			if (!(other instanceof ClassHandle)) {
				return false
			}
			var leftClass = this.$$.ptrType.registeredClass
			var left = this.$$.ptr
			var rightClass = other.$$.ptrType.registeredClass
			var right = other.$$.ptr
			while (leftClass.baseClass) {
				left = leftClass.upcast(left)
				leftClass = leftClass.baseClass
			}
			while (rightClass.baseClass) {
				right = rightClass.upcast(right)
				rightClass = rightClass.baseClass
			}
			return leftClass === rightClass && left === right
		}
		function shallowCopyInternalPointer(o) {
			return {
				count: o.count,
				deleteScheduled: o.deleteScheduled,
				preservePointerOnDelete: o.preservePointerOnDelete,
				ptr: o.ptr,
				ptrType: o.ptrType,
				smartPtr: o.smartPtr,
				smartPtrType: o.smartPtrType,
			}
		}
		function throwInstanceAlreadyDeleted(obj) {
			function getInstanceTypeName(handle) {
				return handle.$$.ptrType.registeredClass.name
			}
			throwBindingError(getInstanceTypeName(obj) + ' instance already deleted')
		}
		function ClassHandle_clone() {
			if (!this.$$.ptr) {
				throwInstanceAlreadyDeleted(this)
			}
			if (this.$$.preservePointerOnDelete) {
				this.$$.count.value += 1
				return this
			} else {
				var clone = Object.create(Object.getPrototypeOf(this), {
					$$: { value: shallowCopyInternalPointer(this.$$) },
				})
				clone.$$.count.value += 1
				clone.$$.deleteScheduled = false
				return clone
			}
		}
		function runDestructor(handle) {
			var $$ = handle.$$
			if ($$.smartPtr) {
				$$.smartPtrType.rawDestructor($$.smartPtr)
			} else {
				$$.ptrType.registeredClass.rawDestructor($$.ptr)
			}
		}
		function ClassHandle_delete() {
			if (!this.$$.ptr) {
				throwInstanceAlreadyDeleted(this)
			}
			if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
				throwBindingError('Object already scheduled for deletion')
			}
			this.$$.count.value -= 1
			var toDelete = 0 === this.$$.count.value
			if (toDelete) {
				runDestructor(this)
			}
			if (!this.$$.preservePointerOnDelete) {
				this.$$.smartPtr = undefined
				this.$$.ptr = undefined
			}
		}
		function ClassHandle_isDeleted() {
			return !this.$$.ptr
		}
		var delayFunction = undefined
		var deletionQueue = []
		function flushPendingDeletes() {
			while (deletionQueue.length) {
				var obj = deletionQueue.pop()
				obj.$$.deleteScheduled = false
				obj['delete']()
			}
		}
		function ClassHandle_deleteLater() {
			if (!this.$$.ptr) {
				throwInstanceAlreadyDeleted(this)
			}
			if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
				throwBindingError('Object already scheduled for deletion')
			}
			deletionQueue.push(this)
			if (deletionQueue.length === 1 && delayFunction) {
				delayFunction(flushPendingDeletes)
			}
			this.$$.deleteScheduled = true
			return this
		}
		function init_ClassHandle() {
			ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf
			ClassHandle.prototype['clone'] = ClassHandle_clone
			ClassHandle.prototype['delete'] = ClassHandle_delete
			ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted
			ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater
		}
		function ClassHandle() {}
		var registeredPointers = {}
		function ensureOverloadTable(proto, methodName, humanName) {
			if (undefined === proto[methodName].overloadTable) {
				var prevFunc = proto[methodName]
				proto[methodName] = function () {
					if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
						throwBindingError(
							"Function '" +
								humanName +
								"' called with an invalid number of arguments (" +
								arguments.length +
								') - expects one of (' +
								proto[methodName].overloadTable +
								')!',
						)
					}
					return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
				}
				proto[methodName].overloadTable = []
				proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
			}
		}
		function exposePublicSymbol(name, value, numArguments) {
			if (Module.hasOwnProperty(name)) {
				if (
					undefined === numArguments ||
					(undefined !== Module[name].overloadTable &&
						undefined !== Module[name].overloadTable[numArguments])
				) {
					throwBindingError("Cannot register public name '" + name + "' twice")
				}
				ensureOverloadTable(Module, name, name)
				if (Module.hasOwnProperty(numArguments)) {
					throwBindingError(
						'Cannot register multiple overloads of a function with the same number of arguments (' +
							numArguments +
							')!',
					)
				}
				Module[name].overloadTable[numArguments] = value
			} else {
				Module[name] = value
				if (undefined !== numArguments) {
					Module[name].numArguments = numArguments
				}
			}
		}
		function RegisteredClass(
			name,
			constructor,
			instancePrototype,
			rawDestructor,
			baseClass,
			getActualType,
			upcast,
			downcast,
		) {
			this.name = name
			this.constructor = constructor
			this.instancePrototype = instancePrototype
			this.rawDestructor = rawDestructor
			this.baseClass = baseClass
			this.getActualType = getActualType
			this.upcast = upcast
			this.downcast = downcast
			this.pureVirtualFunctions = []
		}
		function upcastPointer(ptr, ptrClass, desiredClass) {
			while (ptrClass !== desiredClass) {
				if (!ptrClass.upcast) {
					throwBindingError(
						'Expected null or instance of ' +
							desiredClass.name +
							', got an instance of ' +
							ptrClass.name,
					)
				}
				ptr = ptrClass.upcast(ptr)
				ptrClass = ptrClass.baseClass
			}
			return ptr
		}
		function constNoSmartPtrRawPointerToWireType(destructors, handle) {
			if (handle === null) {
				if (this.isReference) {
					throwBindingError('null is not a valid ' + this.name)
				}
				return 0
			}
			if (!handle.$$) {
				throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
			}
			if (!handle.$$.ptr) {
				throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name)
			}
			var handleClass = handle.$$.ptrType.registeredClass
			var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass)
			return ptr
		}
		function genericPointerToWireType(destructors, handle) {
			var ptr
			if (handle === null) {
				if (this.isReference) {
					throwBindingError('null is not a valid ' + this.name)
				}
				if (this.isSmartPointer) {
					ptr = this.rawConstructor()
					if (destructors !== null) {
						destructors.push(this.rawDestructor, ptr)
					}
					return ptr
				} else {
					return 0
				}
			}
			if (!handle.$$) {
				throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
			}
			if (!handle.$$.ptr) {
				throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name)
			}
			if (!this.isConst && handle.$$.ptrType.isConst) {
				throwBindingError(
					'Cannot convert argument of type ' +
						(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) +
						' to parameter type ' +
						this.name,
				)
			}
			var handleClass = handle.$$.ptrType.registeredClass
			ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass)
			if (this.isSmartPointer) {
				if (undefined === handle.$$.smartPtr) {
					throwBindingError('Passing raw pointer to smart pointer is illegal')
				}
				switch (this.sharingPolicy) {
					case 0:
						if (handle.$$.smartPtrType === this) {
							ptr = handle.$$.smartPtr
						} else {
							throwBindingError(
								'Cannot convert argument of type ' +
									(handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) +
									' to parameter type ' +
									this.name,
							)
						}
						break
					case 1:
						ptr = handle.$$.smartPtr
						break
					case 2:
						if (handle.$$.smartPtrType === this) {
							ptr = handle.$$.smartPtr
						} else {
							var clonedHandle = handle['clone']()
							ptr = this.rawShare(
								ptr,
								__emval_register(function () {
									clonedHandle['delete']()
								}),
							)
							if (destructors !== null) {
								destructors.push(this.rawDestructor, ptr)
							}
						}
						break
					default:
						throwBindingError('Unsupporting sharing policy')
				}
			}
			return ptr
		}
		function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
			if (handle === null) {
				if (this.isReference) {
					throwBindingError('null is not a valid ' + this.name)
				}
				return 0
			}
			if (!handle.$$) {
				throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
			}
			if (!handle.$$.ptr) {
				throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name)
			}
			if (handle.$$.ptrType.isConst) {
				throwBindingError(
					'Cannot convert argument of type ' +
						handle.$$.ptrType.name +
						' to parameter type ' +
						this.name,
				)
			}
			var handleClass = handle.$$.ptrType.registeredClass
			var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass)
			return ptr
		}
		function simpleReadValueFromPointer(pointer) {
			return this['fromWireType'](HEAPU32[pointer >> 2])
		}
		function RegisteredPointer_getPointee(ptr) {
			if (this.rawGetPointee) {
				ptr = this.rawGetPointee(ptr)
			}
			return ptr
		}
		function RegisteredPointer_destructor(ptr) {
			if (this.rawDestructor) {
				this.rawDestructor(ptr)
			}
		}
		function RegisteredPointer_deleteObject(handle) {
			if (handle !== null) {
				handle['delete']()
			}
		}
		function downcastPointer(ptr, ptrClass, desiredClass) {
			if (ptrClass === desiredClass) {
				return ptr
			}
			if (undefined === desiredClass.baseClass) {
				return null
			}
			var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass)
			if (rv === null) {
				return null
			}
			return desiredClass.downcast(rv)
		}
		function getInheritedInstanceCount() {
			return Object.keys(registeredInstances).length
		}
		function getLiveInheritedInstances() {
			var rv = []
			for (var k in registeredInstances) {
				if (registeredInstances.hasOwnProperty(k)) {
					rv.push(registeredInstances[k])
				}
			}
			return rv
		}
		function setDelayFunction(fn) {
			delayFunction = fn
			if (deletionQueue.length && delayFunction) {
				delayFunction(flushPendingDeletes)
			}
		}
		function init_embind() {
			Module['getInheritedInstanceCount'] = getInheritedInstanceCount
			Module['getLiveInheritedInstances'] = getLiveInheritedInstances
			Module['flushPendingDeletes'] = flushPendingDeletes
			Module['setDelayFunction'] = setDelayFunction
		}
		var registeredInstances = {}
		function getBasestPointer(class_, ptr) {
			if (ptr === undefined) {
				throwBindingError('ptr should not be undefined')
			}
			while (class_.baseClass) {
				ptr = class_.upcast(ptr)
				class_ = class_.baseClass
			}
			return ptr
		}
		function getInheritedInstance(class_, ptr) {
			ptr = getBasestPointer(class_, ptr)
			return registeredInstances[ptr]
		}
		function makeClassHandle(prototype, record) {
			if (!record.ptrType || !record.ptr) {
				throwInternalError('makeClassHandle requires ptr and ptrType')
			}
			var hasSmartPtrType = !!record.smartPtrType
			var hasSmartPtr = !!record.smartPtr
			if (hasSmartPtrType !== hasSmartPtr) {
				throwInternalError('Both smartPtrType and smartPtr must be specified')
			}
			record.count = { value: 1 }
			return Object.create(prototype, { $$: { value: record } })
		}
		function RegisteredPointer_fromWireType(ptr) {
			var rawPointer = this.getPointee(ptr)
			if (!rawPointer) {
				this.destructor(ptr)
				return null
			}
			var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer)
			if (undefined !== registeredInstance) {
				if (0 === registeredInstance.$$.count.value) {
					registeredInstance.$$.ptr = rawPointer
					registeredInstance.$$.smartPtr = ptr
					return registeredInstance['clone']()
				} else {
					var rv = registeredInstance['clone']()
					this.destructor(ptr)
					return rv
				}
			}
			function makeDefaultHandle() {
				if (this.isSmartPointer) {
					return makeClassHandle(this.registeredClass.instancePrototype, {
						ptrType: this.pointeeType,
						ptr: rawPointer,
						smartPtrType: this,
						smartPtr: ptr,
					})
				} else {
					return makeClassHandle(this.registeredClass.instancePrototype, {
						ptrType: this,
						ptr: ptr,
					})
				}
			}
			var actualType = this.registeredClass.getActualType(rawPointer)
			var registeredPointerRecord = registeredPointers[actualType]
			if (!registeredPointerRecord) {
				return makeDefaultHandle.call(this)
			}
			var toType
			if (this.isConst) {
				toType = registeredPointerRecord.constPointerType
			} else {
				toType = registeredPointerRecord.pointerType
			}
			var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass)
			if (dp === null) {
				return makeDefaultHandle.call(this)
			}
			if (this.isSmartPointer) {
				return makeClassHandle(toType.registeredClass.instancePrototype, {
					ptrType: toType,
					ptr: dp,
					smartPtrType: this,
					smartPtr: ptr,
				})
			} else {
				return makeClassHandle(toType.registeredClass.instancePrototype, {
					ptrType: toType,
					ptr: dp,
				})
			}
		}
		function init_RegisteredPointer() {
			RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee
			RegisteredPointer.prototype.destructor = RegisteredPointer_destructor
			RegisteredPointer.prototype['argPackAdvance'] = 8
			RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer
			RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject
			RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType
		}
		function RegisteredPointer(
			name,
			registeredClass,
			isReference,
			isConst,
			isSmartPointer,
			pointeeType,
			sharingPolicy,
			rawGetPointee,
			rawConstructor,
			rawShare,
			rawDestructor,
		) {
			this.name = name
			this.registeredClass = registeredClass
			this.isReference = isReference
			this.isConst = isConst
			this.isSmartPointer = isSmartPointer
			this.pointeeType = pointeeType
			this.sharingPolicy = sharingPolicy
			this.rawGetPointee = rawGetPointee
			this.rawConstructor = rawConstructor
			this.rawShare = rawShare
			this.rawDestructor = rawDestructor
			if (!isSmartPointer && registeredClass.baseClass === undefined) {
				if (isConst) {
					this['toWireType'] = constNoSmartPtrRawPointerToWireType
					this.destructorFunction = null
				} else {
					this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType
					this.destructorFunction = null
				}
			} else {
				this['toWireType'] = genericPointerToWireType
			}
		}
		function replacePublicSymbol(name, value, numArguments) {
			if (!Module.hasOwnProperty(name)) {
				throwInternalError('Replacing nonexistant public symbol')
			}
			if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
				Module[name].overloadTable[numArguments] = value
			} else {
				Module[name] = value
				Module[name].argCount = numArguments
			}
		}
		function embind__requireFunction(signature, rawFunction) {
			signature = readLatin1String(signature)
			function makeDynCaller(dynCall) {
				var args = []
				for (var i = 1; i < signature.length; ++i) {
					args.push('a' + i)
				}
				var name = 'dynCall_' + signature + '_' + rawFunction
				var body = 'return function ' + name + '(' + args.join(', ') + ') {\n'
				body +=
					'    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n'
				body += '};\n'
				return new Function('dynCall', 'rawFunction', body)(dynCall, rawFunction)
			}
			var fp
			if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
				fp = Module['FUNCTION_TABLE_' + signature][rawFunction]
			} else if (typeof FUNCTION_TABLE !== 'undefined') {
				fp = FUNCTION_TABLE[rawFunction]
			} else {
				var dc = Module['dynCall_' + signature]
				if (dc === undefined) {
					dc = Module['dynCall_' + signature.replace(/f/g, 'd')]
					if (dc === undefined) {
						throwBindingError('No dynCall invoker for signature: ' + signature)
					}
				}
				fp = makeDynCaller(dc)
			}
			if (typeof fp !== 'function') {
				throwBindingError(
					'unknown function pointer with signature ' + signature + ': ' + rawFunction,
				)
			}
			return fp
		}
		var UnboundTypeError = undefined
		function getTypeName(type) {
			var ptr = ___getTypeName(type)
			var rv = readLatin1String(ptr)
			_free(ptr)
			return rv
		}
		function throwUnboundTypeError(message, types) {
			var unboundTypes = []
			var seen = {}
			function visit(type) {
				if (seen[type]) {
					return
				}
				if (registeredTypes[type]) {
					return
				}
				if (typeDependencies[type]) {
					typeDependencies[type].forEach(visit)
					return
				}
				unboundTypes.push(type)
				seen[type] = true
			}
			types.forEach(visit)
			throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']))
		}
		function __embind_register_class(
			rawType,
			rawPointerType,
			rawConstPointerType,
			baseClassRawType,
			getActualTypeSignature,
			getActualType,
			upcastSignature,
			upcast,
			downcastSignature,
			downcast,
			name,
			destructorSignature,
			rawDestructor,
		) {
			name = readLatin1String(name)
			getActualType = embind__requireFunction(getActualTypeSignature, getActualType)
			if (upcast) {
				upcast = embind__requireFunction(upcastSignature, upcast)
			}
			if (downcast) {
				downcast = embind__requireFunction(downcastSignature, downcast)
			}
			rawDestructor = embind__requireFunction(destructorSignature, rawDestructor)
			var legalFunctionName = makeLegalFunctionName(name)
			exposePublicSymbol(legalFunctionName, function () {
				throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [
					baseClassRawType,
				])
			})
			whenDependentTypesAreResolved(
				[rawType, rawPointerType, rawConstPointerType],
				baseClassRawType ? [baseClassRawType] : [],
				function (base) {
					base = base[0]
					var baseClass
					var basePrototype
					if (baseClassRawType) {
						baseClass = base.registeredClass
						basePrototype = baseClass.instancePrototype
					} else {
						basePrototype = ClassHandle.prototype
					}
					var constructor = createNamedFunction(legalFunctionName, function () {
						if (Object.getPrototypeOf(this) !== instancePrototype) {
							throw new BindingError("Use 'new' to construct " + name)
						}
						if (undefined === registeredClass.constructor_body) {
							throw new BindingError(name + ' has no accessible constructor')
						}
						var body = registeredClass.constructor_body[arguments.length]
						if (undefined === body) {
							throw new BindingError(
								'Tried to invoke ctor of ' +
									name +
									' with invalid number of parameters (' +
									arguments.length +
									') - expected (' +
									Object.keys(registeredClass.constructor_body).toString() +
									') parameters instead!',
							)
						}
						return body.apply(this, arguments)
					})
					var instancePrototype = Object.create(basePrototype, {
						constructor: { value: constructor },
					})
					constructor.prototype = instancePrototype
					var registeredClass = new RegisteredClass(
						name,
						constructor,
						instancePrototype,
						rawDestructor,
						baseClass,
						getActualType,
						upcast,
						downcast,
					)
					var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false)
					var pointerConverter = new RegisteredPointer(
						name + '*',
						registeredClass,
						false,
						false,
						false,
					)
					var constPointerConverter = new RegisteredPointer(
						name + ' const*',
						registeredClass,
						false,
						true,
						false,
					)
					registeredPointers[rawType] = {
						pointerType: pointerConverter,
						constPointerType: constPointerConverter,
					}
					replacePublicSymbol(legalFunctionName, constructor)
					return [referenceConverter, pointerConverter, constPointerConverter]
				},
			)
		}
		function heap32VectorToArray(count, firstElement) {
			var array = []
			for (var i = 0; i < count; i++) {
				array.push(HEAP32[(firstElement >> 2) + i])
			}
			return array
		}
		function runDestructors(destructors) {
			while (destructors.length) {
				var ptr = destructors.pop()
				var del = destructors.pop()
				del(ptr)
			}
		}
		function __embind_register_class_constructor(
			rawClassType,
			argCount,
			rawArgTypesAddr,
			invokerSignature,
			invoker,
			rawConstructor,
		) {
			var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr)
			invoker = embind__requireFunction(invokerSignature, invoker)
			whenDependentTypesAreResolved([], [rawClassType], function (classType) {
				classType = classType[0]
				var humanName = 'constructor ' + classType.name
				if (undefined === classType.registeredClass.constructor_body) {
					classType.registeredClass.constructor_body = []
				}
				if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
					throw new BindingError(
						'Cannot register multiple constructors with identical number of parameters (' +
							(argCount - 1) +
							") for class '" +
							classType.name +
							"'! Overload resolution is currently only performed using the parameter count, not actual type info!",
					)
				}
				classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
					throwUnboundTypeError(
						'Cannot construct ' + classType.name + ' due to unbound types',
						rawArgTypes,
					)
				}
				whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
					classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
						if (arguments.length !== argCount - 1) {
							throwBindingError(
								humanName +
									' called with ' +
									arguments.length +
									' arguments, expected ' +
									(argCount - 1),
							)
						}
						var destructors = []
						var args = new Array(argCount)
						args[0] = rawConstructor
						for (var i = 1; i < argCount; ++i) {
							args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1])
						}
						var ptr = invoker.apply(null, args)
						runDestructors(destructors)
						return argTypes[0]['fromWireType'](ptr)
					}
					return []
				})
				return []
			})
		}
		function new_(constructor, argumentList) {
			if (!(constructor instanceof Function)) {
				throw new TypeError(
					'new_ called with constructor type ' + typeof constructor + ' which is not a function',
				)
			}
			var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function () {})
			dummy.prototype = constructor.prototype
			var obj = new dummy()
			var r = constructor.apply(obj, argumentList)
			return r instanceof Object ? r : obj
		}
		function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
			var argCount = argTypes.length
			if (argCount < 2) {
				throwBindingError(
					"argTypes array size mismatch! Must at least get return value and 'this' types!",
				)
			}
			var isClassMethodFunc = argTypes[1] !== null && classType !== null
			var needsDestructorStack = false
			for (var i = 1; i < argTypes.length; ++i) {
				if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
					needsDestructorStack = true
					break
				}
			}
			var returns = argTypes[0].name !== 'void'
			var argsList = ''
			var argsListWired = ''
			for (var i = 0; i < argCount - 2; ++i) {
				argsList += (i !== 0 ? ', ' : '') + 'arg' + i
				argsListWired += (i !== 0 ? ', ' : '') + 'arg' + i + 'Wired'
			}
			var invokerFnBody =
				'return function ' +
				makeLegalFunctionName(humanName) +
				'(' +
				argsList +
				') {\n' +
				'if (arguments.length !== ' +
				(argCount - 2) +
				') {\n' +
				"throwBindingError('function " +
				humanName +
				" called with ' + arguments.length + ' arguments, expected " +
				(argCount - 2) +
				" args!');\n" +
				'}\n'
			if (needsDestructorStack) {
				invokerFnBody += 'var destructors = [];\n'
			}
			var dtorStack = needsDestructorStack ? 'destructors' : 'null'
			var args1 = ['throwBindingError', 'invoker', 'fn', 'runDestructors', 'retType', 'classParam']
			var args2 = [
				throwBindingError,
				cppInvokerFunc,
				cppTargetFunc,
				runDestructors,
				argTypes[0],
				argTypes[1],
			]
			if (isClassMethodFunc) {
				invokerFnBody += 'var thisWired = classParam.toWireType(' + dtorStack + ', this);\n'
			}
			for (var i = 0; i < argCount - 2; ++i) {
				invokerFnBody +=
					'var arg' +
					i +
					'Wired = argType' +
					i +
					'.toWireType(' +
					dtorStack +
					', arg' +
					i +
					'); // ' +
					argTypes[i + 2].name +
					'\n'
				args1.push('argType' + i)
				args2.push(argTypes[i + 2])
			}
			if (isClassMethodFunc) {
				argsListWired = 'thisWired' + (argsListWired.length > 0 ? ', ' : '') + argsListWired
			}
			invokerFnBody +=
				(returns ? 'var rv = ' : '') +
				'invoker(fn' +
				(argsListWired.length > 0 ? ', ' : '') +
				argsListWired +
				');\n'
			if (needsDestructorStack) {
				invokerFnBody += 'runDestructors(destructors);\n'
			} else {
				for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
					var paramName = i === 1 ? 'thisWired' : 'arg' + (i - 2) + 'Wired'
					if (argTypes[i].destructorFunction !== null) {
						invokerFnBody += paramName + '_dtor(' + paramName + '); // ' + argTypes[i].name + '\n'
						args1.push(paramName + '_dtor')
						args2.push(argTypes[i].destructorFunction)
					}
				}
			}
			if (returns) {
				invokerFnBody += 'var ret = retType.fromWireType(rv);\n' + 'return ret;\n'
			} else {
			}
			invokerFnBody += '}\n'
			args1.push(invokerFnBody)
			var invokerFunction = new_(Function, args1).apply(null, args2)
			return invokerFunction
		}
		function __embind_register_class_function(
			rawClassType,
			methodName,
			argCount,
			rawArgTypesAddr,
			invokerSignature,
			rawInvoker,
			context,
			isPureVirtual,
		) {
			var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr)
			methodName = readLatin1String(methodName)
			rawInvoker = embind__requireFunction(invokerSignature, rawInvoker)
			whenDependentTypesAreResolved([], [rawClassType], function (classType) {
				classType = classType[0]
				var humanName = classType.name + '.' + methodName
				if (isPureVirtual) {
					classType.registeredClass.pureVirtualFunctions.push(methodName)
				}
				function unboundTypesHandler() {
					throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes)
				}
				var proto = classType.registeredClass.instancePrototype
				var method = proto[methodName]
				if (
					undefined === method ||
					(undefined === method.overloadTable &&
						method.className !== classType.name &&
						method.argCount === argCount - 2)
				) {
					unboundTypesHandler.argCount = argCount - 2
					unboundTypesHandler.className = classType.name
					proto[methodName] = unboundTypesHandler
				} else {
					ensureOverloadTable(proto, methodName, humanName)
					proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
				}
				whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
					var memberFunction = craftInvokerFunction(
						humanName,
						argTypes,
						classType,
						rawInvoker,
						context,
					)
					if (undefined === proto[methodName].overloadTable) {
						memberFunction.argCount = argCount - 2
						proto[methodName] = memberFunction
					} else {
						proto[methodName].overloadTable[argCount - 2] = memberFunction
					}
					return []
				})
				return []
			})
		}
		var emval_free_list = []
		var emval_handle_array = [
			{},
			{ value: undefined },
			{ value: null },
			{ value: true },
			{ value: false },
		]
		function __emval_decref(handle) {
			if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
				emval_handle_array[handle] = undefined
				emval_free_list.push(handle)
			}
		}
		function count_emval_handles() {
			var count = 0
			for (var i = 5; i < emval_handle_array.length; ++i) {
				if (emval_handle_array[i] !== undefined) {
					++count
				}
			}
			return count
		}
		function get_first_emval() {
			for (var i = 5; i < emval_handle_array.length; ++i) {
				if (emval_handle_array[i] !== undefined) {
					return emval_handle_array[i]
				}
			}
			return null
		}
		function init_emval() {
			Module['count_emval_handles'] = count_emval_handles
			Module['get_first_emval'] = get_first_emval
		}
		function __emval_register(value) {
			switch (value) {
				case undefined: {
					return 1
				}
				case null: {
					return 2
				}
				case true: {
					return 3
				}
				case false: {
					return 4
				}
				default: {
					var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length
					emval_handle_array[handle] = { refcount: 1, value: value }
					return handle
				}
			}
		}
		function __embind_register_emval(rawType, name) {
			name = readLatin1String(name)
			registerType(rawType, {
				name: name,
				fromWireType: function (handle) {
					var rv = emval_handle_array[handle].value
					__emval_decref(handle)
					return rv
				},
				toWireType: function (destructors, value) {
					return __emval_register(value)
				},
				argPackAdvance: 8,
				readValueFromPointer: simpleReadValueFromPointer,
				destructorFunction: null,
			})
		}
		function _embind_repr(v) {
			if (v === null) {
				return 'null'
			}
			var t = typeof v
			if (t === 'object' || t === 'array' || t === 'function') {
				return v.toString()
			} else {
				return '' + v
			}
		}
		function floatReadValueFromPointer(name, shift) {
			switch (shift) {
				case 2:
					return function (pointer) {
						return this['fromWireType'](HEAPF32[pointer >> 2])
					}
				case 3:
					return function (pointer) {
						return this['fromWireType'](HEAPF64[pointer >> 3])
					}
				default:
					throw new TypeError('Unknown float type: ' + name)
			}
		}
		function __embind_register_float(rawType, name, size) {
			var shift = getShiftFromSize(size)
			name = readLatin1String(name)
			registerType(rawType, {
				name: name,
				fromWireType: function (value) {
					return value
				},
				toWireType: function (destructors, value) {
					if (typeof value !== 'number' && typeof value !== 'boolean') {
						throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
					}
					return value
				},
				argPackAdvance: 8,
				readValueFromPointer: floatReadValueFromPointer(name, shift),
				destructorFunction: null,
			})
		}
		function __embind_register_function(
			name,
			argCount,
			rawArgTypesAddr,
			signature,
			rawInvoker,
			fn,
		) {
			var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr)
			name = readLatin1String(name)
			rawInvoker = embind__requireFunction(signature, rawInvoker)
			exposePublicSymbol(
				name,
				function () {
					throwUnboundTypeError('Cannot call ' + name + ' due to unbound types', argTypes)
				},
				argCount - 1,
			)
			whenDependentTypesAreResolved([], argTypes, function (argTypes) {
				var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1))
				replacePublicSymbol(
					name,
					craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn),
					argCount - 1,
				)
				return []
			})
		}
		function integerReadValueFromPointer(name, shift, signed) {
			switch (shift) {
				case 0:
					return signed
						? function readS8FromPointer(pointer) {
								return HEAP8[pointer]
							}
						: function readU8FromPointer(pointer) {
								return HEAPU8[pointer]
							}
				case 1:
					return signed
						? function readS16FromPointer(pointer) {
								return HEAP16[pointer >> 1]
							}
						: function readU16FromPointer(pointer) {
								return HEAPU16[pointer >> 1]
							}
				case 2:
					return signed
						? function readS32FromPointer(pointer) {
								return HEAP32[pointer >> 2]
							}
						: function readU32FromPointer(pointer) {
								return HEAPU32[pointer >> 2]
							}
				default:
					throw new TypeError('Unknown integer type: ' + name)
			}
		}
		function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
			name = readLatin1String(name)
			if (maxRange === -1) {
				maxRange = 4294967295
			}
			var shift = getShiftFromSize(size)
			var fromWireType = function (value) {
				return value
			}
			if (minRange === 0) {
				var bitshift = 32 - 8 * size
				fromWireType = function (value) {
					return (value << bitshift) >>> bitshift
				}
			}
			var isUnsignedType = name.indexOf('unsigned') != -1
			registerType(primitiveType, {
				name: name,
				fromWireType: fromWireType,
				toWireType: function (destructors, value) {
					if (typeof value !== 'number' && typeof value !== 'boolean') {
						throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
					}
					if (value < minRange || value > maxRange) {
						throw new TypeError(
							'Passing a number "' +
								_embind_repr(value) +
								'" from JS side to C/C++ side to an argument of type "' +
								name +
								'", which is outside the valid range [' +
								minRange +
								', ' +
								maxRange +
								']!',
						)
					}
					return isUnsignedType ? value >>> 0 : value | 0
				},
				argPackAdvance: 8,
				readValueFromPointer: integerReadValueFromPointer(name, shift, minRange !== 0),
				destructorFunction: null,
			})
		}
		function __embind_register_memory_view(rawType, dataTypeIndex, name) {
			var typeMapping = [
				Int8Array,
				Uint8Array,
				Int16Array,
				Uint16Array,
				Int32Array,
				Uint32Array,
				Float32Array,
				Float64Array,
			]
			var TA = typeMapping[dataTypeIndex]
			function decodeMemoryView(handle) {
				handle = handle >> 2
				var heap = HEAPU32
				var size = heap[handle]
				var data = heap[handle + 1]
				return new TA(heap['buffer'], data, size)
			}
			name = readLatin1String(name)
			registerType(
				rawType,
				{
					name: name,
					fromWireType: decodeMemoryView,
					argPackAdvance: 8,
					readValueFromPointer: decodeMemoryView,
				},
				{ ignoreDuplicateRegistrations: true },
			)
		}
		function __embind_register_std_string(rawType, name) {
			name = readLatin1String(name)
			var stdStringIsUTF8 = name === 'std::string'
			registerType(rawType, {
				name: name,
				fromWireType: function (value) {
					var length = HEAPU32[value >> 2]
					var str
					if (stdStringIsUTF8) {
						var endChar = HEAPU8[value + 4 + length]
						var endCharSwap = 0
						if (endChar != 0) {
							endCharSwap = endChar
							HEAPU8[value + 4 + length] = 0
						}
						var decodeStartPtr = value + 4
						for (var i = 0; i <= length; ++i) {
							var currentBytePtr = value + 4 + i
							if (HEAPU8[currentBytePtr] == 0) {
								var stringSegment = UTF8ToString(decodeStartPtr)
								if (str === undefined) str = stringSegment
								else {
									str += String.fromCharCode(0)
									str += stringSegment
								}
								decodeStartPtr = currentBytePtr + 1
							}
						}
						if (endCharSwap != 0) HEAPU8[value + 4 + length] = endCharSwap
					} else {
						var a = new Array(length)
						for (var i = 0; i < length; ++i) {
							a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
						}
						str = a.join('')
					}
					_free(value)
					return str
				},
				toWireType: function (destructors, value) {
					if (value instanceof ArrayBuffer) {
						value = new Uint8Array(value)
					}
					var getLength
					var valueIsOfTypeString = typeof value === 'string'
					if (
						!(
							valueIsOfTypeString ||
							value instanceof Uint8Array ||
							value instanceof Uint8ClampedArray ||
							value instanceof Int8Array
						)
					) {
						throwBindingError('Cannot pass non-string to std::string')
					}
					if (stdStringIsUTF8 && valueIsOfTypeString) {
						getLength = function () {
							return lengthBytesUTF8(value)
						}
					} else {
						getLength = function () {
							return value.length
						}
					}
					var length = getLength()
					var ptr = _malloc(4 + length + 1)
					HEAPU32[ptr >> 2] = length
					if (stdStringIsUTF8 && valueIsOfTypeString) {
						stringToUTF8(value, ptr + 4, length + 1)
					} else {
						if (valueIsOfTypeString) {
							for (var i = 0; i < length; ++i) {
								var charCode = value.charCodeAt(i)
								if (charCode > 255) {
									_free(ptr)
									throwBindingError('String has UTF-16 code units that do not fit in 8 bits')
								}
								HEAPU8[ptr + 4 + i] = charCode
							}
						} else {
							for (var i = 0; i < length; ++i) {
								HEAPU8[ptr + 4 + i] = value[i]
							}
						}
					}
					if (destructors !== null) {
						destructors.push(_free, ptr)
					}
					return ptr
				},
				argPackAdvance: 8,
				readValueFromPointer: simpleReadValueFromPointer,
				destructorFunction: function (ptr) {
					_free(ptr)
				},
			})
		}
		function __embind_register_std_wstring(rawType, charSize, name) {
			name = readLatin1String(name)
			var getHeap, shift
			if (charSize === 2) {
				getHeap = function () {
					return HEAPU16
				}
				shift = 1
			} else if (charSize === 4) {
				getHeap = function () {
					return HEAPU32
				}
				shift = 2
			}
			registerType(rawType, {
				name: name,
				fromWireType: function (value) {
					var HEAP = getHeap()
					var length = HEAPU32[value >> 2]
					var a = new Array(length)
					var start = (value + 4) >> shift
					for (var i = 0; i < length; ++i) {
						a[i] = String.fromCharCode(HEAP[start + i])
					}
					_free(value)
					return a.join('')
				},
				toWireType: function (destructors, value) {
					var HEAP = getHeap()
					var length = value.length
					var ptr = _malloc(4 + length * charSize)
					HEAPU32[ptr >> 2] = length
					var start = (ptr + 4) >> shift
					for (var i = 0; i < length; ++i) {
						HEAP[start + i] = value.charCodeAt(i)
					}
					if (destructors !== null) {
						destructors.push(_free, ptr)
					}
					return ptr
				},
				argPackAdvance: 8,
				readValueFromPointer: simpleReadValueFromPointer,
				destructorFunction: function (ptr) {
					_free(ptr)
				},
			})
		}
		function __embind_register_void(rawType, name) {
			name = readLatin1String(name)
			registerType(rawType, {
				isVoid: true,
				name: name,
				argPackAdvance: 0,
				fromWireType: function () {
					return undefined
				},
				toWireType: function (destructors, o) {
					return undefined
				},
			})
		}
		function __emval_incref(handle) {
			if (handle > 4) {
				emval_handle_array[handle].refcount += 1
			}
		}
		function requireRegisteredType(rawType, humanName) {
			var impl = registeredTypes[rawType]
			if (undefined === impl) {
				throwBindingError(humanName + ' has unknown type ' + getTypeName(rawType))
			}
			return impl
		}
		function __emval_take_value(type, argv) {
			type = requireRegisteredType(type, '_emval_take_value')
			var v = type['readValueFromPointer'](argv)
			return __emval_register(v)
		}
		function _abort() {
			Module['abort']()
		}
		function _llvm_log10_f32(x) {
			return Math.log(x) / Math.LN10
		}
		function _llvm_log10_f64() {
			return _llvm_log10_f32.apply(null, arguments)
		}
		function _emscripten_memcpy_big(dest, src, num) {
			HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
			return dest
		}
		var PTHREAD_SPECIFIC = {}
		function _pthread_getspecific(key) {
			return PTHREAD_SPECIFIC[key] || 0
		}
		var PTHREAD_SPECIFIC_NEXT_KEY = 1
		var ERRNO_CODES = {
			EPERM: 1,
			ENOENT: 2,
			ESRCH: 3,
			EINTR: 4,
			EIO: 5,
			ENXIO: 6,
			E2BIG: 7,
			ENOEXEC: 8,
			EBADF: 9,
			ECHILD: 10,
			EAGAIN: 11,
			EWOULDBLOCK: 11,
			ENOMEM: 12,
			EACCES: 13,
			EFAULT: 14,
			ENOTBLK: 15,
			EBUSY: 16,
			EEXIST: 17,
			EXDEV: 18,
			ENODEV: 19,
			ENOTDIR: 20,
			EISDIR: 21,
			EINVAL: 22,
			ENFILE: 23,
			EMFILE: 24,
			ENOTTY: 25,
			ETXTBSY: 26,
			EFBIG: 27,
			ENOSPC: 28,
			ESPIPE: 29,
			EROFS: 30,
			EMLINK: 31,
			EPIPE: 32,
			EDOM: 33,
			ERANGE: 34,
			ENOMSG: 42,
			EIDRM: 43,
			ECHRNG: 44,
			EL2NSYNC: 45,
			EL3HLT: 46,
			EL3RST: 47,
			ELNRNG: 48,
			EUNATCH: 49,
			ENOCSI: 50,
			EL2HLT: 51,
			EDEADLK: 35,
			ENOLCK: 37,
			EBADE: 52,
			EBADR: 53,
			EXFULL: 54,
			ENOANO: 55,
			EBADRQC: 56,
			EBADSLT: 57,
			EDEADLOCK: 35,
			EBFONT: 59,
			ENOSTR: 60,
			ENODATA: 61,
			ETIME: 62,
			ENOSR: 63,
			ENONET: 64,
			ENOPKG: 65,
			EREMOTE: 66,
			ENOLINK: 67,
			EADV: 68,
			ESRMNT: 69,
			ECOMM: 70,
			EPROTO: 71,
			EMULTIHOP: 72,
			EDOTDOT: 73,
			EBADMSG: 74,
			ENOTUNIQ: 76,
			EBADFD: 77,
			EREMCHG: 78,
			ELIBACC: 79,
			ELIBBAD: 80,
			ELIBSCN: 81,
			ELIBMAX: 82,
			ELIBEXEC: 83,
			ENOSYS: 38,
			ENOTEMPTY: 39,
			ENAMETOOLONG: 36,
			ELOOP: 40,
			EOPNOTSUPP: 95,
			EPFNOSUPPORT: 96,
			ECONNRESET: 104,
			ENOBUFS: 105,
			EAFNOSUPPORT: 97,
			EPROTOTYPE: 91,
			ENOTSOCK: 88,
			ENOPROTOOPT: 92,
			ESHUTDOWN: 108,
			ECONNREFUSED: 111,
			EADDRINUSE: 98,
			ECONNABORTED: 103,
			ENETUNREACH: 101,
			ENETDOWN: 100,
			ETIMEDOUT: 110,
			EHOSTDOWN: 112,
			EHOSTUNREACH: 113,
			EINPROGRESS: 115,
			EALREADY: 114,
			EDESTADDRREQ: 89,
			EMSGSIZE: 90,
			EPROTONOSUPPORT: 93,
			ESOCKTNOSUPPORT: 94,
			EADDRNOTAVAIL: 99,
			ENETRESET: 102,
			EISCONN: 106,
			ENOTCONN: 107,
			ETOOMANYREFS: 109,
			EUSERS: 87,
			EDQUOT: 122,
			ESTALE: 116,
			ENOTSUP: 95,
			ENOMEDIUM: 123,
			EILSEQ: 84,
			EOVERFLOW: 75,
			ECANCELED: 125,
			ENOTRECOVERABLE: 131,
			EOWNERDEAD: 130,
			ESTRPIPE: 86,
		}
		function _pthread_key_create(key, destructor) {
			if (key == 0) {
				return ERRNO_CODES.EINVAL
			}
			HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY
			PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0
			PTHREAD_SPECIFIC_NEXT_KEY++
			return 0
		}
		function _pthread_once(ptr, func) {
			if (!_pthread_once.seen) _pthread_once.seen = {}
			if (ptr in _pthread_once.seen) return
			Module['dynCall_v'](func)
			_pthread_once.seen[ptr] = 1
		}
		function _pthread_setspecific(key, value) {
			if (!(key in PTHREAD_SPECIFIC)) {
				return ERRNO_CODES.EINVAL
			}
			PTHREAD_SPECIFIC[key] = value
			return 0
		}
		function ___setErrNo(value) {
			if (Module['___errno_location']) HEAP32[Module['___errno_location']() >> 2] = value
			else err('failed to set errno from JS')
			return value
		}
		embind_init_charCodes()
		BindingError = Module['BindingError'] = extendError(Error, 'BindingError')
		InternalError = Module['InternalError'] = extendError(Error, 'InternalError')
		init_ClassHandle()
		init_RegisteredPointer()
		init_embind()
		UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError')
		init_emval()
		DYNAMICTOP_PTR = staticAlloc(4)
		STACK_BASE = STACKTOP = alignMemory(STATICTOP)
		STACK_MAX = STACK_BASE + TOTAL_STACK
		DYNAMIC_BASE = alignMemory(STACK_MAX)
		HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE
		staticSealed = true
		assert(DYNAMIC_BASE < TOTAL_MEMORY, 'TOTAL_MEMORY not big enough for stack')
		var ASSERTIONS = true
		function intArrayToString(array) {
			var ret = []
			for (var i = 0; i < array.length; i++) {
				var chr = array[i]
				if (chr > 255) {
					if (ASSERTIONS) {
						assert(
							false,
							'Character code ' +
								chr +
								' (' +
								String.fromCharCode(chr) +
								')  at offset ' +
								i +
								' not in 0x00-0xFF.',
						)
					}
					chr &= 255
				}
				ret.push(String.fromCharCode(chr))
			}
			return ret.join('')
		}
		var decodeBase64 =
			typeof atob === 'function'
				? atob
				: function (input) {
						var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
						var output = ''
						var chr1, chr2, chr3
						var enc1, enc2, enc3, enc4
						var i = 0
						input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '')
						do {
							enc1 = keyStr.indexOf(input.charAt(i++))
							enc2 = keyStr.indexOf(input.charAt(i++))
							enc3 = keyStr.indexOf(input.charAt(i++))
							enc4 = keyStr.indexOf(input.charAt(i++))
							chr1 = (enc1 << 2) | (enc2 >> 4)
							chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
							chr3 = ((enc3 & 3) << 6) | enc4
							output = output + String.fromCharCode(chr1)
							if (enc3 !== 64) {
								output = output + String.fromCharCode(chr2)
							}
							if (enc4 !== 64) {
								output = output + String.fromCharCode(chr3)
							}
						} while (i < input.length)
						return output
					}
		function intArrayFromBase64(s) {
			if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
				var buf
				try {
					buf = Buffer.from(s, 'base64')
				} catch (_) {
					buf = new Buffer(s, 'base64')
				}
				return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
			}
			try {
				var decoded = decodeBase64(s)
				var bytes = new Uint8Array(decoded.length)
				for (var i = 0; i < decoded.length; ++i) {
					bytes[i] = decoded.charCodeAt(i)
				}
				return bytes
			} catch (_) {
				throw new Error('Converting base64 string to bytes failed.')
			}
		}
		function tryParseAsDataURI(filename) {
			if (!isDataURI(filename)) {
				return
			}
			return intArrayFromBase64(filename.slice(dataURIPrefix.length))
		}
		var debug_table_d = ['0', '_PowerEPD_GetSNR_JS']
		var debug_table_di = ['0', '__ZN10emscripten8internal7InvokerIfJEE6invokeEPFfvE']
		var debug_table_i = [
			'0',
			'__ZN10emscripten8internal12operator_newINSt3__26vectorIiNS2_9allocatorIiEEEEJEEEPT_DpOT0_',
			'__ZN10emscripten8internal12operator_newINSt3__26vectorIsNS2_9allocatorIsEEEEJEEEPT_DpOT0_',
			'0',
		]
		var debug_table_ii = [
			'0',
			'___stdio_close',
			'__ZNKSt11logic_error4whatEv',
			'_PowerEPD_Create_JS',
			'_PowerEPD_InitVoice_JS',
			'__ZN10emscripten8internal7InvokerINSt3__26vectorIsNS2_9allocatorIsEEEEJEE6invokeEPFS6_vE',
			'__ZN10emscripten8internal7InvokerINSt3__26vectorIiNS2_9allocatorIiEEEEJEE6invokeEPFS6_vE',
			'_PowerEPD_SetPauseThreshold_JS',
			'__ZN10emscripten8internal13getActualTypeINSt3__26vectorIiNS2_9allocatorIiEEEEEEPKvPT_',
			'__ZN10emscripten8internal7InvokerIPNSt3__26vectorIiNS2_9allocatorIiEEEEJEE6invokeEPFS7_vE',
			'__ZNKSt3__26vectorIiNS_9allocatorIiEEE4sizeEv',
			'__ZN10emscripten8internal13getActualTypeINSt3__26vectorIsNS2_9allocatorIsEEEEEEPKvPT_',
			'__ZN10emscripten8internal7InvokerIPNSt3__26vectorIsNS2_9allocatorIsEEEEJEE6invokeEPFS7_vE',
			'__ZNKSt3__26vectorIsNS_9allocatorIsEEE4sizeEv',
			'0',
			'0',
		]
		var debug_table_iii = [
			'0',
			'__EPD_compare_value',
			'__ZN10emscripten8internal7InvokerIiJiEE6invokeEPFiiEi',
			'_PowerEPD_FrameProc_JS',
			'__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIiNS2_9allocatorIiEEEEKFmvEmPKS6_JEE6invokeERKS8_SA_',
			'__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIsNS2_9allocatorIsEEEEKFmvEmPKS6_JEE6invokeERKS8_SA_',
			'0',
			'0',
		]
		var debug_table_iiii = [
			'0',
			'___stdio_write',
			'___stdio_seek',
			'___stdout_write',
			'__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv',
			'__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv',
			'__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv',
			'__ZN10emscripten8internal7InvokerIiJPsiEE6invokeEPFiS2_iES2_i',
			'__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__26vectorIiNS3_9allocatorIiEEEEmES2_S9_JmEE6invokeEPSB_PS7_m',
			'__ZN10emscripten8internal12VectorAccessINSt3__26vectorIiNS2_9allocatorIiEEEEE3setERS6_mRKi',
			'__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__26vectorIsNS3_9allocatorIsEEEEmES2_S9_JmEE6invokeEPSB_PS7_m',
			'__ZN10emscripten8internal12VectorAccessINSt3__26vectorIsNS2_9allocatorIsEEEEE3setERS6_mRKs',
			'0',
			'0',
			'0',
			'0',
		]
		var debug_table_iiiii = [
			'0',
			'__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__26vectorIiNS2_9allocatorIiEEEEmRKiEbS7_JmS9_EE6invokeEPSB_PS6_mi',
			'__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__26vectorIsNS2_9allocatorIsEEEEmRKsEbS7_JmS9_EE6invokeEPSB_PS6_ms',
			'0',
		]
		var debug_table_v = [
			'0',
			'__ZL25default_terminate_handlerv',
			'_PowerEPD_Destroy_JS',
			'__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev',
		]
		var debug_table_vi = [
			'0',
			'__ZN10__cxxabiv116__shim_type_infoD2Ev',
			'__ZN10__cxxabiv117__class_type_infoD0Ev',
			'__ZNK10__cxxabiv116__shim_type_info5noop1Ev',
			'__ZNK10__cxxabiv116__shim_type_info5noop2Ev',
			'__ZN10__cxxabiv120__si_class_type_infoD0Ev',
			'__ZNSt11logic_errorD2Ev',
			'__ZNSt11logic_errorD0Ev',
			'__ZNSt12length_errorD0Ev',
			'__ZN10__cxxabiv123__fundamental_type_infoD0Ev',
			'__ZN10__cxxabiv119__pointer_type_infoD0Ev',
			'__ZN10__cxxabiv121__vmi_class_type_infoD0Ev',
			'__ZN10emscripten8internal7InvokerIvJEE6invokeEPFvvE',
			'__Z19PowerEPD_GetData_JSv',
			'__Z18PowerEPD_GetPos_JSv',
			'__ZN10emscripten8internal14raw_destructorINSt3__26vectorIiNS2_9allocatorIiEEEEEEvPT_',
			'__ZN10emscripten8internal14raw_destructorINSt3__26vectorIsNS2_9allocatorIsEEEEEEvPT_',
			'__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
			'0',
		]
		var debug_table_vii = [
			'0',
			'__ZNSt3__26vectorIiNS_9allocatorIiEEE9push_backERKi',
			'__ZNSt3__26vectorIsNS_9allocatorIsEEE9push_backERKs',
			'0',
		]
		var debug_table_viii = [
			'0',
			'__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIiNS2_9allocatorIiEEEEFvRKiEvPS6_JS8_EE6invokeERKSA_SB_i',
			'__ZNSt3__26vectorIiNS_9allocatorIiEEE6resizeEmRKi',
			'__ZN10emscripten8internal12VectorAccessINSt3__26vectorIiNS2_9allocatorIiEEEEE3getERKS6_m',
			'__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIsNS2_9allocatorIsEEEEFvRKsEvPS6_JS8_EE6invokeERKSA_SB_s',
			'__ZNSt3__26vectorIsNS_9allocatorIsEEE6resizeEmRKs',
			'__ZN10emscripten8internal12VectorAccessINSt3__26vectorIsNS2_9allocatorIsEEEEE3getERKS6_m',
			'0',
		]
		var debug_table_viiii = [
			'0',
			'__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi',
			'__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi',
			'__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi',
			'__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIiNS2_9allocatorIiEEEEFvmRKiEvPS6_JmS8_EE6invokeERKSA_SB_mi',
			'__ZN10emscripten8internal13MethodInvokerIMNSt3__26vectorIsNS2_9allocatorIsEEEEFvmRKsEvPS6_JmS8_EE6invokeERKSA_SB_ms',
			'0',
			'0',
		]
		var debug_table_viiiii = [
			'0',
			'__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib',
			'__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib',
			'__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib',
		]
		var debug_table_viiiiii = [
			'0',
			'__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib',
			'__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib',
			'__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib',
		]
		function nullFunc_d(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: di: ' +
					debug_table_di[x] +
					'  i: ' +
					debug_table_i[x] +
					'  v: ' +
					debug_table_v[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_di(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'di'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: d: ' +
					debug_table_d[x] +
					'  i: ' +
					debug_table_i[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  v: ' +
					debug_table_v[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_i(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: ii: ' +
					debug_table_ii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  d: ' +
					debug_table_d[x] +
					'  v: ' +
					debug_table_v[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_ii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: i: ' +
					debug_table_i[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  v: ' +
					debug_table_v[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_iii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: ii: ' +
					debug_table_ii[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  i: ' +
					debug_table_i[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  v: ' +
					debug_table_v[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_iiii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: iii: ' +
					debug_table_iii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  i: ' +
					debug_table_i[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  v: ' +
					debug_table_v[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_iiiii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: iiii: ' +
					debug_table_iiii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  i: ' +
					debug_table_i[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  v: ' +
					debug_table_v[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_v(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: vi: ' +
					debug_table_vi[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  i: ' +
					debug_table_i[x] +
					'  di: ' +
					debug_table_di[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_vi(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: v: ' +
					debug_table_v[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  i: ' +
					debug_table_i[x] +
					'  di: ' +
					debug_table_di[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_vii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: vi: ' +
					debug_table_vi[x] +
					'  viii: ' +
					debug_table_viii[x] +
					'  v: ' +
					debug_table_v[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  i: ' +
					debug_table_i[x] +
					'  di: ' +
					debug_table_di[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  d: ' +
					debug_table_d[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_viii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: vii: ' +
					debug_table_vii[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  v: ' +
					debug_table_v[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  i: ' +
					debug_table_i[x] +
					'  d: ' +
					debug_table_d[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_viiii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: viii: ' +
					debug_table_viii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  v: ' +
					debug_table_v[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  i: ' +
					debug_table_i[x] +
					'  d: ' +
					debug_table_d[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_viiiii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: viii: ' +
					debug_table_viii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  viiiiii: ' +
					debug_table_viiiiii[x] +
					'  v: ' +
					debug_table_v[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  i: ' +
					debug_table_i[x] +
					'  d: ' +
					debug_table_d[x] +
					'  ',
			)
			abort(x)
		}
		function nullFunc_viiiiii(x) {
			err(
				"Invalid function pointer '" +
					x +
					"' called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)",
			)
			err(
				'This pointer might make sense in another type signature: viii: ' +
					debug_table_viii[x] +
					'  viiii: ' +
					debug_table_viiii[x] +
					'  viiiii: ' +
					debug_table_viiiii[x] +
					'  vii: ' +
					debug_table_vii[x] +
					'  vi: ' +
					debug_table_vi[x] +
					'  v: ' +
					debug_table_v[x] +
					'  iiii: ' +
					debug_table_iiii[x] +
					'  iiiii: ' +
					debug_table_iiiii[x] +
					'  iii: ' +
					debug_table_iii[x] +
					'  ii: ' +
					debug_table_ii[x] +
					'  di: ' +
					debug_table_di[x] +
					'  i: ' +
					debug_table_i[x] +
					'  d: ' +
					debug_table_d[x] +
					'  ',
			)
			abort(x)
		}
		Module.asmGlobalArg = {
			Math: Math,
			Int8Array: Int8Array,
			Int16Array: Int16Array,
			Int32Array: Int32Array,
			Uint8Array: Uint8Array,
			Uint16Array: Uint16Array,
			Uint32Array: Uint32Array,
			Float32Array: Float32Array,
			Float64Array: Float64Array,
			NaN: NaN,
			Infinity: Infinity,
			byteLength: byteLength,
		}
		Module.asmLibraryArg = {
			a: abort,
			b: assert,
			c: enlargeMemory,
			d: getTotalMemory,
			e: setTempRet0,
			f: getTempRet0,
			g: abortOnCannotGrowMemory,
			h: abortStackOverflow,
			i: nullFunc_d,
			j: nullFunc_di,
			k: nullFunc_i,
			l: nullFunc_ii,
			m: nullFunc_iii,
			n: nullFunc_iiii,
			o: nullFunc_iiiii,
			p: nullFunc_v,
			q: nullFunc_vi,
			r: nullFunc_vii,
			s: nullFunc_viii,
			t: nullFunc_viiii,
			u: nullFunc_viiiii,
			v: nullFunc_viiiiii,
			w: ClassHandle,
			x: ClassHandle_clone,
			y: ClassHandle_delete,
			z: ClassHandle_deleteLater,
			A: ClassHandle_isAliasOf,
			B: ClassHandle_isDeleted,
			C: RegisteredClass,
			D: RegisteredPointer,
			E: RegisteredPointer_deleteObject,
			F: RegisteredPointer_destructor,
			G: RegisteredPointer_fromWireType,
			H: RegisteredPointer_getPointee,
			I: __ZSt18uncaught_exceptionv,
			J: ___cxa_allocate_exception,
			K: ___cxa_begin_catch,
			L: ___cxa_find_matching_catch,
			M: ___cxa_throw,
			N: ___gxx_personality_v0,
			O: ___lock,
			P: ___resumeException,
			Q: ___setErrNo,
			R: ___syscall140,
			S: ___syscall146,
			T: ___syscall54,
			U: ___syscall6,
			V: ___unlock,
			W: __embind_register_bool,
			X: __embind_register_class,
			Y: __embind_register_class_constructor,
			Z: __embind_register_class_function,
			_: __embind_register_emval,
			$: __embind_register_float,
			aa: __embind_register_function,
			ab: __embind_register_integer,
			ac: __embind_register_memory_view,
			ad: __embind_register_std_string,
			ae: __embind_register_std_wstring,
			af: __embind_register_void,
			ag: __emval_decref,
			ah: __emval_incref,
			ai: __emval_register,
			aj: __emval_take_value,
			ak: _abort,
			al: _embind_repr,
			am: _emscripten_memcpy_big,
			an: _llvm_log10_f32,
			ao: _llvm_log10_f64,
			ap: _pthread_getspecific,
			aq: _pthread_key_create,
			ar: _pthread_once,
			as: _pthread_setspecific,
			at: constNoSmartPtrRawPointerToWireType,
			au: count_emval_handles,
			av: craftInvokerFunction,
			aw: createNamedFunction,
			ax: downcastPointer,
			ay: embind__requireFunction,
			az: embind_init_charCodes,
			aA: ensureOverloadTable,
			aB: exposePublicSymbol,
			aC: extendError,
			aD: floatReadValueFromPointer,
			aE: flushPendingDeletes,
			aF: flush_NO_FILESYSTEM,
			aG: genericPointerToWireType,
			aH: getBasestPointer,
			aI: getInheritedInstance,
			aJ: getInheritedInstanceCount,
			aK: getLiveInheritedInstances,
			aL: getShiftFromSize,
			aM: getTypeName,
			aN: get_first_emval,
			aO: heap32VectorToArray,
			aP: init_ClassHandle,
			aQ: init_RegisteredPointer,
			aR: init_embind,
			aS: init_emval,
			aT: integerReadValueFromPointer,
			aU: makeClassHandle,
			aV: makeLegalFunctionName,
			aW: new_,
			aX: nonConstNoSmartPtrRawPointerToWireType,
			aY: readLatin1String,
			aZ: registerType,
			a_: replacePublicSymbol,
			a$: requireRegisteredType,
			ba: runDestructor,
			bb: runDestructors,
			bc: setDelayFunction,
			bd: shallowCopyInternalPointer,
			be: simpleReadValueFromPointer,
			bf: throwBindingError,
			bg: throwInstanceAlreadyDeleted,
			bh: throwInternalError,
			bi: throwUnboundTypeError,
			bj: upcastPointer,
			bk: whenDependentTypesAreResolved,
			bl: DYNAMICTOP_PTR,
			bm: tempDoublePtr,
			bn: STACKTOP,
			bo: STACK_MAX,
		} // EMSCRIPTEN_START_ASM
		var asm = /** @suppress {uselessCode} */ (function (global, env, buffer) {
			'almost asm'
			var a = global.Int8Array
			var b = new a(buffer)
			var c = global.Int16Array
			var d = new c(buffer)
			var e = global.Int32Array
			var f = new e(buffer)
			var g = global.Uint8Array
			var h = new g(buffer)
			var i = global.Uint16Array
			var j = new i(buffer)
			var k = global.Uint32Array
			var l = new k(buffer)
			var m = global.Float32Array
			var n = new m(buffer)
			var o = global.Float64Array
			var p = new o(buffer)
			var q = global.byteLength
			var r = env.bl | 0
			var s = env.bm | 0
			var t = env.bn | 0
			var u = env.bo | 0
			var v = 0
			var w = 0
			var x = 0
			var y = 0
			var z = global.NaN,
				A = global.Infinity
			var B = 0,
				C = 0,
				D = 0,
				E = 0,
				F = 0.0
			var G = global.Math.floor
			var H = global.Math.abs
			var I = global.Math.sqrt
			var J = global.Math.pow
			var K = global.Math.cos
			var L = global.Math.sin
			var M = global.Math.tan
			var N = global.Math.acos
			var O = global.Math.asin
			var P = global.Math.atan
			var Q = global.Math.atan2
			var R = global.Math.exp
			var S = global.Math.log
			var T = global.Math.ceil
			var U = global.Math.imul
			var V = global.Math.min
			var W = global.Math.max
			var X = global.Math.clz32
			var Y = env.a
			var Z = env.b
			var _ = env.c
			var $ = env.d
			var aa = env.e
			var ba = env.f
			var ca = env.g
			var da = env.h
			var ea = env.i
			var fa = env.j
			var ga = env.k
			var ha = env.l
			var ia = env.m
			var ja = env.n
			var ka = env.o
			var la = env.p
			var ma = env.q
			var na = env.r
			var oa = env.s
			var pa = env.t
			var qa = env.u
			var ra = env.v
			var sa = env.w
			var ta = env.x
			var ua = env.y
			var va = env.z
			var wa = env.A
			var xa = env.B
			var ya = env.C
			var za = env.D
			var Aa = env.E
			var Ba = env.F
			var Ca = env.G
			var Da = env.H
			var Ea = env.I
			var Fa = env.J
			var Ga = env.K
			var Ha = env.L
			var Ia = env.M
			var Ja = env.N
			var Ka = env.O
			var La = env.P
			var Ma = env.Q
			var Na = env.R
			var Oa = env.S
			var Pa = env.T
			var Qa = env.U
			var Ra = env.V
			var Sa = env.W
			var Ta = env.X
			var Ua = env.Y
			var Va = env.Z
			var Wa = env._
			var Xa = env.$
			var Ya = env.aa
			var Za = env.ab
			var _a = env.ac
			var $a = env.ad
			var ab = env.ae
			var bb = env.af
			var cb = env.ag
			var db = env.ah
			var eb = env.ai
			var fb = env.aj
			var gb = env.ak
			var hb = env.al
			var ib = env.am
			var jb = env.an
			var kb = env.ao
			var lb = env.ap
			var mb = env.aq
			var nb = env.ar
			var ob = env.as
			var pb = env.at
			var qb = env.au
			var rb = env.av
			var sb = env.aw
			var tb = env.ax
			var ub = env.ay
			var vb = env.az
			var wb = env.aA
			var xb = env.aB
			var yb = env.aC
			var zb = env.aD
			var Ab = env.aE
			var Bb = env.aF
			var Cb = env.aG
			var Db = env.aH
			var Eb = env.aI
			var Fb = env.aJ
			var Gb = env.aK
			var Hb = env.aL
			var Ib = env.aM
			var Jb = env.aN
			var Kb = env.aO
			var Lb = env.aP
			var Mb = env.aQ
			var Nb = env.aR
			var Ob = env.aS
			var Pb = env.aT
			var Qb = env.aU
			var Rb = env.aV
			var Sb = env.aW
			var Tb = env.aX
			var Ub = env.aY
			var Vb = env.aZ
			var Wb = env.a_
			var Xb = env.a$
			var Yb = env.ba
			var Zb = env.bb
			var _b = env.bc
			var $b = env.bd
			var ac = env.be
			var bc = env.bf
			var cc = env.bg
			var dc = env.bh
			var ec = env.bi
			var fc = env.bj
			var gc = env.bk
			var hc = 0.0
			function ic(newBuffer) {
				if (q(newBuffer) & 16777215 || q(newBuffer) <= 16777215 || q(newBuffer) > 2147483648)
					return false
				b = new a(newBuffer)
				d = new c(newBuffer)
				f = new e(newBuffer)
				h = new g(newBuffer)
				j = new i(newBuffer)
				l = new k(newBuffer)
				n = new m(newBuffer)
				p = new o(newBuffer)
				buffer = newBuffer
				return true
			}
			// EMSCRIPTEN_START_FUNCS
			function xc(a) {
				a = a | 0
				var b = 0
				b = t
				t = (t + a) | 0
				t = (t + 15) & -16
				if ((t | 0) >= (u | 0)) da(a | 0)
				return b | 0
			}
			function yc() {
				return t | 0
			}
			function zc(a) {
				a = a | 0
				t = a
			}
			function Ac(a, b) {
				a = a | 0
				b = b | 0
				t = a
				u = b
			}
			function Bc(a, b) {
				a = a | 0
				b = b | 0
				if (!v) {
					v = a
					w = b
				}
			}
			function Cc(a) {
				a = a | 0
				return (a & 65535) | 0
			}
			function Dc(a, b) {
				a = a | 0
				b = b | 0
				a = (((b << 16) >> 16) + ((a << 16) >> 16)) | 0
				if ((a | 0) > 32767) return 32767
				else return ((a | 0) < -32768 ? -32768 : a & 65535) | 0
				return 0
			}
			function Ec(a, b) {
				a = a | 0
				b = b | 0
				a = (((a << 16) >> 16) - ((b << 16) >> 16)) | 0
				if ((a | 0) > 32767) return 32767
				else return ((a | 0) < -32768 ? -32768 : a & 65535) | 0
				return 0
			}
			function Fc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = (b << 16) >> 16
				a: do
					if ((b << 16) >> 16 < 0) {
						while (1) {
							b = (0 - c) | 0
							c = b & 65535
							b = b << 16
							b = 16 ? b >> 16 : b
							if ((c << 16) >> 16 >= 0) break
							c = (0 - b) | 0
							b = c & 65535
							c = c << 16
							c = 16 ? c >> 16 : c
							if ((b << 16) >> 16 >= 0) break a
						}
						if ((c << 16) >> 16 > 14) {
							a = 15 ? ((a << 16) >> 16) >> 15 : (a << 16) >> 16
							return a | 0
						} else {
							a = (a << 16) >> 16
							a = (b ? a >> b : a) & 65535
							return a | 0
						}
					}
				while (0)
				c = ((a << 16) >> 16) << c
				if (
					((a << 16) >> 16 == 0) | ((b << 16) >> 16 < 16)
						? ((b = c << 16), (c | 0) == ((16 ? b >> 16 : b) | 0))
						: 0
				) {
					a = c & 65535
					return a | 0
				}
				a = (a << 16) >> 16 > 0 ? 32767 : -32768
				return a | 0
			}
			function Gc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = (b << 16) >> 16
				if ((b << 16) >> 16 < 0) {
					c = Fc(a, (0 - c) & 65535) | 0
					return c | 0
				}
				if ((b << 16) >> 16 > 14) {
					c = 15 ? ((a << 16) >> 16) >> 15 : (a << 16) >> 16
					return c | 0
				} else {
					b = (a << 16) >> 16
					c = (c ? b >> c : b) & 65535
					return c | 0
				}
				return 0
			}
			function Hc(a, b) {
				a = a | 0
				b = b | 0
				b = U((b << 16) >> 16, (a << 16) >> 16) | 0
				return ((b | 0) == 1073741824 ? 2147483647 : b << 1) | 0
			}
			function Ic(a) {
				a = a | 0
				return ((a << 16) >> 16 == -32768 ? 32767 : (0 - (a & 65535)) & 65535) | 0
			}
			function Jc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = (b + a) | 0
				return (
					((((b ^ a) | 0) > -1) & (((c ^ a) | 0) < 0)
						? ((31 ? a >>> 31 : a) + 2147483647) | 0
						: c) | 0
				)
			}
			function Kc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				a: do
					if ((b << 16) >> 16 < 1) {
						while (1) {
							c = (0 - (b & 65535)) | 0
							b = c & 65535
							c = c << 16
							c = 16 ? c >> 16 : c
							if ((b << 16) >> 16 >= 0) break
							b = (0 - c) & 65535
							if ((b << 16) >> 16 >= 1) break a
						}
						if ((b << 16) >> 16 > 30) {
							c = 31 ? a >> 31 : a
							return c | 0
						} else {
							c = c ? a >> c : a
							return c | 0
						}
					}
				while (0)
				while (1) {
					if ((a | 0) > 1073741823) {
						a = 2147483647
						b = 12
						break
					}
					if ((a | 0) < -1073741824) {
						a = -2147483648
						b = 12
						break
					}
					a = a << 1
					if ((b << 16) >> 16 > 1) b = ((b + -1) << 16) >> 16
					else {
						b = 12
						break
					}
				}
				if ((b | 0) == 12) return a | 0
				return 0
			}
			function Lc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = (b << 16) >> 16
				if ((b << 16) >> 16 < 0) {
					c = Kc(a, (0 - c) & 65535) | 0
					return c | 0
				}
				if ((b << 16) >> 16 > 30) {
					c = 31 ? a >> 31 : a
					return c | 0
				} else {
					c = c ? a >> c : a
					return c | 0
				}
				return 0
			}
			function Mc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					f = 0
				c = b & 65535
				if ((b << 16) >> 16 > -1) {
					c = ((a << 16) >> 16) << ((b << 16) >> 16)
					if (
						((a << 16) >> 16 == 0) | ((b << 16) >> 16 < 16)
							? ((f = c << 16), (c | 0) == ((16 ? f >> 16 : f) | 0))
							: 0
					) {
						a = c & 65535
						return a | 0
					}
					a = (a << 16) >> 16 > 0 ? 32767 : -32768
					return a | 0
				}
				if ((b << 16) >> 16 < -15) {
					a = 0
					return a | 0
				}
				c = (c + 1) | 0
				d = c & 65535
				c = c << 16
				c = 16 ? c >> 16 : c
				a: do
					if ((d << 16) >> 16 < 0) {
						while (1) {
							d = (0 - c) | 0
							c = d & 65535
							d = d << 16
							d = 16 ? d >> 16 : d
							if ((c << 16) >> 16 >= 0) break
							c = (0 - d) | 0
							d = c & 65535
							c = c << 16
							c = 16 ? c >> 16 : c
							if ((d << 16) >> 16 >= 0) {
								f = 14
								break a
							}
						}
						if ((c << 16) >> 16 > 14) {
							c = 15 ? ((a << 16) >> 16) >> 15 : (a << 16) >> 16
							break
						} else {
							c = (a << 16) >> 16
							c = (d ? c >> d : c) & 65535
							break
						}
					} else f = 14
				while (0)
				do
					if ((f | 0) == 14) {
						c = ((a << 16) >> 16) << c
						if (
							((a << 16) >> 16 == 0) | ((d << 16) >> 16 < 16)
								? ((e = c << 16), (c | 0) == ((16 ? e >> 16 : e) | 0))
								: 0
						) {
							c = c & 65535
							break
						}
						c = (a << 16) >> 16 > 0 ? 32767 : -32768
					}
				while (0)
				e = c & 1
				c = (b << 16) >> 16
				b: do
					if ((b << 16) >> 16 < 0) {
						while (1) {
							d = (0 - c) | 0
							c = d & 65535
							d = d << 16
							d = 16 ? d >> 16 : d
							if ((c << 16) >> 16 >= 0) break
							c = (0 - d) | 0
							d = c & 65535
							c = c << 16
							c = 16 ? c >> 16 : c
							if ((d << 16) >> 16 >= 0) {
								f = 25
								break b
							}
						}
						if ((c << 16) >> 16 > 14) {
							c = 15 ? ((a << 16) >> 16) >> 15 : (a << 16) >> 16
							break
						} else {
							c = (a << 16) >> 16
							c = (d ? c >> d : c) & 65535
							break
						}
					} else {
						d = b
						f = 25
					}
				while (0)
				do
					if ((f | 0) == 25) {
						c = ((a << 16) >> 16) << c
						if (
							((a << 16) >> 16 == 0) | ((d << 16) >> 16 < 16)
								? ((f = c << 16), (c | 0) == ((16 ? f >> 16 : f) | 0))
								: 0
						) {
							c = c & 65535
							break
						}
						c = (a << 16) >> 16 > 0 ? 32767 : -32768
					}
				while (0)
				c = (((c << 16) >> 16) + (e & 65535)) | 0
				if ((c | 0) > 32767) {
					a = 32767
					return a | 0
				} else return ((c | 0) < -32768 ? -32768 : c & 65535) | 0
				return 0
			}
			function Nc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					f = 0
				if (!((a << 16) >> 16)) {
					f = 0
					return f | 0
				}
				if ((a << 16) >> 16 == (b << 16) >> 16) {
					f = 32767
					return f | 0
				}
				f = (b << 16) >> 16
				d = (a << 16) >> 16
				e = 0
				b = 0
				while (1) {
					b = (b << 16) >> 16
					c = d << 1
					if ((c | 0) >= (f | 0)) {
						a = (c - f) | 0
						if ((((a ^ c) & (c ^ f)) | 0) < 0) a = (((30 ? d >>> 30 : d) & 1) + 2147483647) | 0
						b = b << 17
						b = (16 ? b >> 16 : b) | 1
						if ((b | 0) > 32767) b = 32767
						else b = (b | 0) < -32768 ? -32768 : b & 65535
					} else {
						b = (b << 1) & 65535
						a = c
					}
					e = ((e + 1) << 16) >> 16
					if ((e & 65535) >= 15) break
					else d = a
				}
				return b | 0
			}
			function Oc(a) {
				a = a | 0
				var b = 0
				switch (a | 0) {
					case 0: {
						a = 0
						break
					}
					case -1: {
						a = 31
						break
					}
					default: {
						b = (31 ? a >> 31 : a) ^ a
						if ((b | 0) < 1073741824) {
							a = 0
							do {
								b = b << 1
								a = ((a + 1) << 16) >> 16
							} while ((b | 0) < 1073741824)
						} else a = 0
					}
				}
				return a | 0
			}
			function Pc(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0
				d = (c << 16) >> 16
				c = U(d, (a << 16) >> 16) | 0
				c = (c | 0) == 1073741824 ? 2147483647 : c << 1
				b = U(d, (b << 16) >> 16) | 0
				a = 15 ? b >> 15 : b
				a = (b | 0) < 0 ? a | -65536 : a
				if ((a | 0) <= 32767)
					if ((a | 0) < -32768) a = -65536
					else {
						a = a << 16
						a = 15 ? a >> 15 : a
					}
				else a = 65534
				d = (a + c) | 0
				return (
					((((a ^ c) | 0) > -1) & (((d ^ c) | 0) < 0)
						? ((31 ? c >>> 31 : c) + 2147483647) | 0
						: d) | 0
				)
			}
			function Qc(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var e = 0
				d[b >> 1] = 16 ? a >>> 16 : a
				e = 1 ? a >> 1 : a
				a = (16 ? a >> 16 : a) << 15
				b = (e - a) | 0
				d[c >> 1] = (((b ^ e) & (a ^ e)) | 0) < 0 ? ((31 ? e >>> 31 : e) + 65535) | 0 : b
				return
			}
			function Rc(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0,
					f = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0
				h = d[a >> 1] | 0
				f = d[(a + 2) >> 1] | 0
				g = (h << 16) >> 16 < 1
				if (!g) {
					c = (f << 16) >> 16
					c = (c | 0) > -1 ? c : (0 - c) | 0
					e = c << 16
					c = ((16 ? e >> 16 : e) | 0) > (((f << 16) >> 16) | 0) ? c & 65535 : f
					if ((h << 16) >> 16 != 1) {
						e = 2
						do {
							i = d[(a + (((e << 16) >> 16) << 1)) >> 1] | 0
							i = (i | 0) > -1 ? i : (0 - i) | 0
							j = i << 16
							c = ((16 ? j >> 16 : j) | 0) > (((c << 16) >> 16) | 0) ? i & 65535 : c
							e = ((e + 1) << 16) >> 16
						} while ((e << 16) >> 16 <= (h << 16) >> 16)
					}
				} else c = f
				switch ((c << 16) >> 16) {
					case 0:
						break
					case -1: {
						c = 15
						break
					}
					default: {
						e = (15 ? ((c << 16) >> 16) >> 15 : (c << 16) >> 16) ^ c
						if ((e << 16) >> 16 < 16384) {
							c = 0
							do {
								e = (((e << 16) >> 16) << 1) & 65535
								c = ((c + 1) << 16) >> 16
							} while ((e << 16) >> 16 < 16384)
						} else c = 0
					}
				}
				e = ((c & 65535) - (b & 65535)) & 65535
				if (g) return e | 0
				j = Mc(f, e) | 0
				d[(a + 2) >> 1] = j
				if ((h << 16) >> 16 == 1) return e | 0
				c = 2
				do {
					j = Mc(d[(a + (((c << 16) >> 16) << 1)) >> 1] | 0, e) | 0
					d[(a + (((c << 16) >> 16) << 1)) >> 1] = j
					c = ((c + 1) << 16) >> 16
				} while ((c << 16) >> 16 <= (h << 16) >> 16)
				return e | 0
			}
			function Sc(a) {
				a = a | 0
				var b = 0,
					c = 0,
					d = 0
				c = (a | 0) < 268435456 ? 0 : 16384
				b = c | 8192
				d = b & 65535
				d = (U(d, d) | 0) > (a | 0)
				b = d ? c : b
				c = b | 4096
				d = c & 65535
				d = (U(d, d) | 0) > (a | 0)
				c = d ? b : c
				b = c | 2048
				d = b & 65535
				d = (U(d, d) | 0) > (a | 0)
				b = d ? c : b
				c = ((b & 65535) + 1024) | 0
				d = c << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				c = d ? b : c & 65535
				b = ((c & 65535) + 512) | 0
				d = b << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				b = d ? c : b & 65535
				c = ((b & 65535) + 256) | 0
				d = c << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				c = d ? b : c & 65535
				b = ((c & 65535) + 128) | 0
				d = b << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				b = d ? c : b & 65535
				c = ((b & 65535) + 64) | 0
				d = c << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				c = d ? b : c & 65535
				b = ((c & 65535) + 32) | 0
				d = b << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				b = d ? c : b & 65535
				c = ((b & 65535) + 16) | 0
				d = c << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				c = d ? b : c & 65535
				b = ((c & 65535) + 8) | 0
				d = b << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				b = d ? c : b & 65535
				c = ((b & 65535) + 4) | 0
				d = c << 16
				d = 16 ? d >> 16 : d
				d = (U(d, d) | 0) > (a | 0)
				c = d ? b : c & 65535
				b = ((c & 65535) + 2) | 0
				d = b << 16
				d = 16 ? d >> 16 : d
				a = (U(d, d) | 0) > (a | 0)
				return (a ? c : b & 65535) | 0
			}
			function Tc(a) {
				a = a | 0
				return
			}
			function Uc(a, b) {
				a = a | 0
				b = b | 0
				if (!a) return 0
				else return Of(a, b) | 0
				return 0
			}
			function Vc(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0
				e = U(b, a) | 0
				if (!e) {
					a = 0
					return a | 0
				}
				g = Of(e, c) | 0
				if (!g) {
					a = 0
					return a | 0
				}
				if (a | 0 ? ((d = Of(a, 4) | 0), d | 0) : 0) {
					if ((a | 0) <= 0) {
						a = d
						return a | 0
					}
					b = U(c, b) | 0
					e = 0
					do {
						c = (g + (U(b, e) | 0)) | 0
						f[(d + (e << 2)) >> 2] = c
						e = (e + 1) | 0
					} while ((e | 0) != (a | 0))
					return d | 0
				}
				Nf(g)
				a = 0
				return a | 0
			}
			function Wc(a) {
				a = a | 0
				var b = 0
				if (!a) return
				b = f[a >> 2] | 0
				if (b | 0) Nf(b)
				Nf(a)
				return
			}
			function Xc() {
				var a = 0
				wd()
				a = Uc(1, 6) | 0
				f[17734] = a
				if (!a) {
					a = 0
					return a | 0
				}
				d[a >> 1] = 3e4
				d[35854] = 3
				d[35855] = 10
				return a | 0
			}
			function Yc(a) {
				a = a | 0
				if (!a) return 1
				a = f[17734] | 0
				if (!a) return 1
				Nf(a)
				f[17734] = 0
				return 1
			}
			function Zc(a, b) {
				a = a | 0
				b = b | 0
				f[17747] = -1
				n[17749] = 0.0
				n[17750] = 0.0
				d[35856] = 0
				f[17748] = 2
				f[17751] = 0
				d[35857] = 35
				d[35858] = 30
				d[35853] = f[1870]
				d[35859] = 12
				d[35860] = 10
				d[35861] = 3
				f[1868] = f[1871]
				f[1869] = f[1872]
				d[35854] = 3
				d[35855] = 10
				f[2836] = 0
				f[2837] = 0
				f[2838] = 0
				f[2839] = 0
				f[2840] = 0
				f[2841] = 0
				f[2842] = 0
				d[35850] = 0
				f[2844] = 0
				f[2845] = 0
				f[2846] = 0
				f[2847] = 0
				f[2848] = 0
				f[2849] = 0
				f[2850] = 0
				d[35852] = 0
				f[2852] = 0
				f[2853] = 0
				f[2854] = 0
				f[2855] = 0
				f[2856] = 0
				f[2857] = 0
				f[2858] = 0
				n[17738] = 0.0
				n[17739] = 0.0
				n[17740] = 0.0
				n[17741] = 0.0
				n[17742] = 0.0
				f[17743] = 0
				f[17744] = 0
				f[17745] = 0
				n[17746] = 0.0
				f[17752] = 0
				f[17753] = 0
				f[17756] = 0
				f[17758] = 0
				f[17754] = 0
				f[17759] = 0
				b = f[17734] | 0
				d[(b + 4) >> 1] = 0
				d[(b + 2) >> 1] = 0
				f[17760] = -1
				f[17761] = -1
				f[17757] = 0
				f[17767] = 0
				xd()
				return 1
			}
			function _c(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				yd(b)
				yd((b + 160) | 0)
				f[17747] = (f[17747] | 0) + 1
				n[17735] = 0.0
				n[17736] = 0.0
				n[17737] = 0.0
				return 1
			}
			function $c(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				ad(b, c)
				switch (bd(0, 0) | 0) {
					case 2: {
						c = f[17748] | 0
						c = (c | 0) == 1 ? -2 : (c | 0) == 0 ? -3 : 1
						return c | 0
					}
					case 1: {
						c = 0
						return c | 0
					}
					default: {
						c = -1
						return c | 0
					}
				}
				return 0
			}
			function ad(a, b) {
				a = a | 0
				b = b | 0
				var c = 0.0,
					e = 0,
					g = 0.0,
					h = 0,
					i = 0.0,
					k = 0.0,
					l = 0,
					m = 0.0,
					o = 0,
					p = 0,
					q = 0
				p = t
				t = (t + 32) | 0
				if ((t | 0) >= (u | 0)) da(32)
				o = p
				l = f[17747] | 0
				n[(11440 + (l << 2)) >> 2] = 0.0
				n[(23440 + (l << 2)) >> 2] = 0.0
				if ((b | 0) > 1) {
					e = 1
					c = 0.0
					h = d[a >> 1] | 0
					do {
						q = h
						h = d[(a + (e << 1)) >> 1] | 0
						q = ((h & 65535) - (~~(+((q << 16) >> 16) * 0.5) & 65535)) << 16
						q = 16 ? q >> 16 : q
						c = c + +(U(q, q) | 0)
						e = (e + 1) | 0
					} while ((e | 0) != (b | 0))
				} else c = 0.0
				g = c / +((b * 100) | 0)
				if ((l | 0) > 9) {
					e = ((j[35860] | 0) + (j[35861] | 0)) | 0
					if ((l | 0) < (e | 0)) {
						n[17740] = g + +n[17740]
						n[17738] = +n[17738] + 1.0
					}
					if ((l | 0) == ((e + -1) | 0)) {
						m = +n[17740] / +n[17738]
						n[17739] = m > 1.0000000474974513e-3 ? m : 1.0000000474974513e-3
					}
				}
				e = d[35850] | 0
				if ((e << 16) >> 16 > 6) {
					d[35850] = 0
					e = 0
				}
				d[35850] = ((e + 1) << 16) >> 16
				n[(11344 + (((e << 16) >> 16) << 2)) >> 2] = g
				f[o >> 2] = f[2836]
				f[(o + 4) >> 2] = f[2837]
				f[(o + 8) >> 2] = f[2838]
				f[(o + 12) >> 2] = f[2839]
				f[(o + 16) >> 2] = f[2840]
				f[(o + 20) >> 2] = f[2841]
				f[(o + 24) >> 2] = f[2842]
				tf(o, 7, 4, 1)
				a = (o + 12) | 0
				f[(23440 + (f[17747] << 2)) >> 2] = f[a >> 2]
				e = d[35851] | 0
				if ((e << 16) >> 16 > 6) {
					d[35851] = 0
					e = 0
				}
				q = f[17735] | 0
				d[35851] = ((e + 1) << 16) >> 16
				f[(11376 + (((e << 16) >> 16) << 2)) >> 2] = q
				f[o >> 2] = f[2844]
				f[(o + 4) >> 2] = f[2845]
				f[(o + 8) >> 2] = f[2846]
				f[(o + 12) >> 2] = f[2847]
				f[(o + 16) >> 2] = f[2848]
				f[(o + 20) >> 2] = f[2849]
				f[(o + 24) >> 2] = f[2850]
				tf(o, 7, 4, 1)
				f[(35440 + (f[17747] << 2)) >> 2] = f[a >> 2]
				e = d[35852] | 0
				if ((e << 16) >> 16 > 6) {
					d[35852] = 0
					e = 0
				}
				q = f[17736] | 0
				d[35852] = ((e + 1) << 16) >> 16
				f[(11408 + (((e << 16) >> 16) << 2)) >> 2] = q
				f[o >> 2] = f[2852]
				f[(o + 4) >> 2] = f[2853]
				f[(o + 8) >> 2] = f[2854]
				f[(o + 12) >> 2] = f[2855]
				f[(o + 16) >> 2] = f[2856]
				f[(o + 20) >> 2] = f[2857]
				f[(o + 24) >> 2] = f[2858]
				tf(o, 7, 4, 1)
				i = +n[a >> 2]
				a = f[17747] | 0
				n[(47440 + (a << 2)) >> 2] = i
				e = ((j[35860] | 0) + (j[35861] | 0)) | 0
				if ((a | 0) < (e | 0)) {
					t = p
					return
				}
				if ((a | 0) == (e | 0)) {
					n[17741] = +n[17741] + 1.0
					f[17742] = f[17735]
				}
				c = +n[17737] - +n[17736]
				do
					if (!(c < 0.0))
						if (c < 1.25) {
							m = g * 1.2000000476837158 + +n[17740]
							n[17740] = m
							c = +n[17738] + 1.2000000476837158
							n[17738] = c
							c = m / c
							n[17739] = c
							m = +n[17742] + +n[17735] * 1.2000000476837158
							n[17742] = m
							g = +n[17741] + 1.2000000476837158
							n[17741] = g
							g = m / g
							break
						} else {
							m = +n[17742] + +n[17735] * 0.10000000149011612
							n[17742] = m
							g = +n[17741] + 0.10000000149011612
							n[17741] = g
							c = +n[17739]
							g = m / g
							break
						}
					else {
						m = g * 1.2999999523162842 + +n[17740]
						n[17740] = m
						c = +n[17738] + 1.2999999523162842
						n[17738] = c
						c = m / c
						n[17739] = c
						m = +n[17742] + +n[17735] * 1.2999999523162842
						n[17742] = m
						g = +n[17741] + 1.2999999523162842
						n[17741] = g
						g = m / g
					}
				while (0)
				k = c > 1.0000000474974513e-3 ? c : 1.0000000474974513e-3
				n[17739] = k
				m = g < 1.2 ? 1.2000000476837158 : g
				if (!(i < 30.0))
					if (!(i < 40.0))
						if (!(i < 50.0))
							if (i < 70.0) {
								c = 12.5
								g = 10.5
							} else {
								q = i < 80.0
								c = q ? 11.0 : 7.5
								g = q ? 9.5 : 6.0
							}
						else {
							c = 13.0
							g = 11.0
						}
					else {
						c = 14.0
						g = 12.0
					}
				else {
					c = 2.4000000953674316
					g = 0.800000011920929
				}
				n[17750] = g
				n[17749] = c
				do
					if (!(k < 30.0))
						if (!(k < 100.0)) {
							if (k < 500.0) {
								g = k / 2.5 + 100.0
								break
							}
							if (k < 1.0e3) {
								g = k / 3.34 + 300.0
								break
							} else {
								g = (k > 1.0e4 ? 1.0e4 : k) / 25.0 + 600.0
								break
							}
						} else g = k
					else g = 30.0
				while (0)
				q = f[(35440 + (a << 2)) >> 2] | 0
				e = (11440 + (a << 2)) | 0
				f[e >> 2] = q
				i = ((f[s >> 2] = q), +n[s >> 2])
				do
					if (k < 100.0) {
						c = +n[(23440 + (a << 2)) >> 2] - k
						if (c > g * 25.0) {
							c = i + 6.0
							break
						}
						if (c > g) c = i + 3.5
						else c = 0.0
					} else {
						c = +n[(23440 + (a << 2)) >> 2] - k
						if (!(k < 1.0e3)) {
							if (c > g * 35.0) {
								c = i + 6.0
								break
							}
							if (!(c > g * 4.0)) {
								c = 0.0
								break
							}
							c = i + 3.5
							break
						}
						if (c > g * 60.0) {
							c = i + 9.0
							break
						}
						if (c > g * 30.0) {
							c = i + 6.0
							break
						}
						if (c > g * 2.0) c = i + 3.5
						else c = 0.0
					}
				while (0)
				c = c - m
				n[e >> 2] = c
				if (c < 0.0) {
					n[e >> 2] = 0.0
					t = p
					return
				}
				if (c > 30.0) f[17743] = (f[17743] | 0) + 1
				if (c > 40.0) f[17744] = (f[17744] | 0) + 1
				if (!(c > 50.0)) {
					t = p
					return
				}
				f[17745] = (f[17745] | 0) + 1
				t = p
				return
			}
			function bd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0.0,
					e = 0.0,
					g = 0,
					h = 0.0,
					i = 0,
					k = 0,
					l = 0.0,
					m = 0.0,
					o = 0,
					p = 0,
					q = 0,
					r = 0,
					s = 0,
					t = 0.0,
					u = 0.0,
					v = 0,
					w = 0
				w = f[17747] | 0
				if ((w | 0) > 2989) {
					w = 3
					return w | 0
				}
				if ((w | 0) >= (((f[1873] | 0) + -10) | 0)) {
					w = 3
					return w | 0
				}
				a = f[17752] | 0
				p = f[17753] | 0
				k = (p | a | 0) == 0
				if (((w | 0) > 1e3) & k) {
					w = 3
					return w | 0
				}
				o = (p | 0) == 0
				q = f[17754] | 0
				i = (a | 0) == 1
				if (o & (i & (((w - q) | 0) > 1e3))) {
					w = 3
					return w | 0
				}
				if (!w) {
					f[17755] = 0
					b = j[35861] | 0
					a = d[35860] | 0
					g = j[35857] | 0
					if ((((a & 65535) + b) | 0) >>> 0 < g >>> 0) {
						a = (g - b) & 65535
						d[35860] = a
					}
				} else {
					b = j[35861] | 0
					a = d[35860] | 0
				}
				a = (b + (a & 65535)) | 0
				if ((w | 0) < (a | 0)) {
					w = 1
					return w | 0
				}
				if ((w | 0) == (a | 0)) {
					if (f[17755] | 0) {
						w = 1
						return w | 0
					}
					f[17755] = 1
					w = 1
					return w | 0
				}
				if (k) {
					a = (w + -2) | 0
					e = +n[17750]
					c = +n[(11440 + (a << 2)) >> 2]
					if (
						(!(c < e) ? ((r = (w + -1) | 0), (l = +n[(11440 + (r << 2)) >> 2]), !(l < e)) : 0)
							? ((m = +n[(11440 + (w << 2)) >> 2]), !(m < e))
							: 0
					) {
						h = +n[17749]
						if (c >= e) {
							b = f[17761] | 0
							if ((b | 0) == -1) f[17761] = a
							else a = b
							if (!(c >= h)) v = 21
						} else v = 21
						do
							if ((v | 0) == 21) {
								if (l >= e) {
									a = f[17761] | 0
									if ((a | 0) == -1) {
										f[17761] = r
										a = r
									}
									if (l >= h) break
								}
								if (!(m >= e)) {
									w = 1
									return w | 0
								}
								a = f[17761] | 0
								if ((a | 0) == -1) {
									f[17761] = w
									a = w
								}
								if (!(m >= h)) {
									w = 1
									return w | 0
								}
							}
						while (0)
						if (!a) {
							w = 1
							return w | 0
						}
						f[17752] = 1
						f[17756] = w + 1 - a
						f[17754] = a
						f[17767] = 1
						w = 1
						return w | 0
					}
					f[17761] = -1
					w = 1
					return w | 0
				}
				if (i & o) {
					f[17767] = 1
					b = (w + -2) | 0
					v = (11440 + (b << 2)) | 0
					c = +n[v >> 2]
					h = +n[(v + 4) >> 2]
					l = +n[(11440 + (w << 2)) >> 2]
					m = +n[17749]
					e = +n[17750]
					do
						if (!(c >= m))
							if (c < m)
								if ((f[17760] | 0) != -1)
									if (c < e) {
										a = 0
										v = 52
										break
									} else {
										v = 39
										break
									}
								else {
									f[17760] = 1
									v = 39
									break
								}
							else v = 39
						else {
							f[17760] = -1
							v = 39
						}
					while (0)
					a: do
						if ((v | 0) == 39) {
							do
								if (!(h >= m)) {
									if (h < m)
										if ((f[17760] | 0) != -1)
											if (h < e) {
												a = 1
												v = 52
												break a
											} else break
										else {
											f[17760] = 1
											break
										}
								} else f[17760] = -1
							while (0)
							do
								if (!(l >= m)) {
									if (l < m)
										if ((f[17760] | 0) != -1)
											if (l < e) {
												a = 2
												v = 52
												break a
											} else break
										else {
											f[17760] = 1
											break
										}
								} else f[17760] = -1
							while (0)
							b = f[17756] | 0
						}
					while (0)
					if ((v | 0) == 52) {
						f[17760] = -1
						a = (a + b) | 0
						b = f[17756] | 0
						if (a) {
							if ((b | 0) < (j[35855] | 0 | 0) ? (f[17757] | 0) < (j[35854] | 0 | 0) : 0)
								if (!(f[17758] | 0)) {
									f[17752] = 0
									f[17753] = 0
									f[17756] = 0
									f[17758] = 0
									f[17754] = 0
									f[17759] = 0
									w = f[17734] | 0
									d[(w + 4) >> 1] = 0
									d[(w + 2) >> 1] = 0
									f[17760] = -1
									f[17761] = -1
									f[17757] = 0
									f[17767] = 0
									w = 1
									return w | 0
								} else {
									f[17752] = 1
									f[17753] = 1
									f[17756] = 0
									w = 1
									return w | 0
								}
							f[17758] = 1
							f[17759] = a
							f[17751] = 0
							f[17756] = 0
							f[17753] = 1
							w = 1
							return w | 0
						}
					}
					f[17756] = b + 1
					a = f[17757] | 0
					if ((a | 0) >= (j[35854] | 0 | 0)) {
						w = 1
						return w | 0
					}
					if (l > m) {
						f[17757] = a + 1
						w = 1
						return w | 0
					} else {
						f[17757] = 0
						w = 1
						return w | 0
					}
				}
				if (!(i & ((p | 0) == 1))) {
					w = 1
					return w | 0
				}
				f[17767] = 0
				g = f[17758] | 0
				a = f[17751] | 0
				if (g) {
					a = (a + 1) | 0
					f[17751] = a
				}
				if ((a | 0) > (j[35853] | 0 | 0)) {
					g = j[35857] | 0
					i = (q - g) | 0
					i = (i | 0) > 0 ? i : 0
					b = i & 65535
					v = f[17734] | 0
					d[(v + 2) >> 1] = b
					w = f[17759] | 0
					k = j[35858] | 0
					s = (w + k) | 0
					a = j[v >> 1] | 0
					i = i & 65535
					a = (((s | 0) < (a | 0) ? s : a) - i) | 0
					d[(v + 4) >> 1] = a
					if (((w - q) | 0) < (j[35859] | 0 | 0)) {
						f[17751] = 0
						f[17753] = 0
						w = 1
						return w | 0
					}
					d[35856] = b
					o = ((a & 65535) + i) | 0
					d[35862] = o
					o = o & 65535
					c = +n[(23440 + (i << 2)) >> 2]
					if (c <= 40.0)
						if (!(c <= 1.0)) h = c + 0.0
						else h = 1.100000023841858
					else h = 15.0
					a = (i + g) | 0
					b = (o - k) | 0
					if ((a | 0) < (b | 0)) {
						g = 0
						e = 0.0
						do {
							u = +n[(23440 + (a << 2)) >> 2]
							w = u > 1.0
							g = (g + (w & 1)) | 0
							e = w ? e + u : e
							a = (a + 1) | 0
						} while ((a | 0) != (b | 0))
						c = +(g | 0)
					} else {
						e = 0.0
						c = 0.0
					}
					u = +n[(23440 + ((o + -1) << 2)) >> 2]
					c =
						+kb(
							+(e / c / ((h + (!(u <= 40.0) ? 15.0 : !(u <= 1.0) ? u : 1.100000023841858)) * 0.5)),
						) * 10.0
					n[17746] = c
					if (+n[1869] > c) a = 1
					else a = +n[1868] < c ? 0 : 2
					f[17748] = a
					f[17752] = 0
					f[17753] = 0
					w = 2
					return w | 0
				}
				a = (w + -2) | 0
				e = +n[17750]
				c = +n[(11440 + (a << 2)) >> 2]
				if (
					(!(c < e) ? ((s = (w + -1) | 0), (t = +n[(11440 + (s << 2)) >> 2]), !(t < e)) : 0)
						? ((u = +n[(11440 + (w << 2)) >> 2]), !(u < e))
						: 0
				) {
					h = +n[17749]
					if (c >= e) {
						b = f[17761] | 0
						if ((b | 0) == -1) f[17761] = a
						else a = b
						if (!(c >= h)) v = 86
					} else v = 86
					do
						if ((v | 0) == 86) {
							if (t >= e) {
								a = f[17761] | 0
								if ((a | 0) == -1) {
									f[17761] = s
									a = s
								}
								if (t >= h) break
							}
							if (!(u >= e)) {
								w = 1
								return w | 0
							}
							a = f[17761] | 0
							if ((a | 0) == -1) {
								f[17761] = w
								a = w
							}
							if (!(u >= h)) a = 1
							else break
							return a | 0
						}
					while (0)
					if (!a) {
						w = 1
						return w | 0
					}
					f[17753] = 0
					f[17756] = w + 1 - a
					if ((g | 0) != 1) {
						f[17754] = a
						f[17751] = 0
					}
					f[17757] = 0
					f[17767] = 1
					w = 1
					return w | 0
				}
				f[17761] = -1
				w = 1
				return w | 0
			}
			function cd(a, b) {
				a = a | 0
				b = b | 0
				a = f[a >> 2] | 0
				b = f[b >> 2] | 0
				return ((a | 0) > (b | 0) ? 1 : (((a | 0) < (b | 0)) << 31) >> 31) | 0
			}
			function dd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0.0
				c = ((f[17747] | 0) - (d[(a + 20) >> 1] << 2)) | 0
				if ((f[(a + 16) >> 2] | 0) == 1) ed(a, b)
				b = (b + 28) | 0
				fd(f[((f[b >> 2] | 0) + (c << 2)) >> 2] | 0)
				c = ((f[((f[b >> 2] | 0) + (c << 2)) >> 2] | 0) + 48) | 0
				e = +(f[c >> 2] | 0) / 32767.0
				f[c >> 2] = ~~(
					(((e < 9.237074851989746 ? 9.237074851989746 : e) + -20.75) * 0.1 + 1.0) *
					32767.0
				)
				return
			}
			function ed(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0
				e = d[(a + 20) >> 1] | 0
				n = e << 1
				g = ((f[17747] | 0) - n) | 0
				l = g << 16
				l = 16 ? l >> 16 : l
				c = (l - e) | 0
				h = (l - n) | 0
				m = ((j[(a + 2) >> 1] << 16) + 65536) | 0
				o = 16 ? m >> 16 : m
				if ((m | 0) <= 0) return
				a = f[(b + 28) >> 2] | 0
				m = (((c & 32768) | 0) == 0 ? c : g) << 16
				m = f[(a + ((16 ? m >> 16 : m) << 2)) >> 2] | 0
				i = (l + e) << 16
				i = f[(a + ((16 ? i >> 16 : i) << 2)) >> 2] | 0
				k = f[(a + (l << 2)) >> 2] | 0
				e = (((h & 32768) | 0) == 0 ? h : g) << 16
				e = f[(a + ((16 ? e >> 16 : e) << 2)) >> 2] | 0
				b = (l + n) << 16
				b = f[(a + ((16 ? b >> 16 : b) << 2)) >> 2] | 0
				a = 0
				c = 0
				do {
					f[(k + ((c + 13) << 2)) >> 2] =
						(f[(m + (c << 2)) >> 2] | 0) - (f[(i + (c << 2)) >> 2] | 0)
					f[(k + ((c + 26) << 2)) >> 2] =
						(f[(e + (c << 2)) >> 2] | 0) -
						(f[(k + (c << 2)) >> 2] << 1) +
						(f[(b + (c << 2)) >> 2] | 0)
					a = ((a + 1) << 16) >> 16
					c = (a << 16) >> 16
				} while ((o | 0) > (c | 0))
				return
			}
			function fd(a) {
				a = a | 0
				var b = 0.0,
					c = 0,
					d = 0.0,
					e = 0,
					g = 0.0,
					h = 0,
					i = 0.0,
					j = 0,
					k = 0.0,
					l = 0,
					m = 0.0,
					o = 0,
					p = 0.0,
					q = 0,
					r = 0.0,
					s = 0,
					t = 0.0,
					u = 0,
					v = 0.0,
					w = 0,
					x = 0.0,
					y = 0,
					z = 0
				if (!(f[17767] | 0)) {
					y = (a + 4) | 0
					e = (a + 8) | 0
					h = (a + 12) | 0
					j = (a + 16) | 0
					l = (a + 20) | 0
					o = (a + 24) | 0
					q = (a + 28) | 0
					s = (a + 32) | 0
					u = (a + 36) | 0
					w = (a + 40) | 0
					z = (a + 44) | 0
					b = +(f[y >> 2] | 0)
					c = e
					d = +(f[e >> 2] | 0)
					e = h
					g = +(f[h >> 2] | 0)
					h = j
					i = +(f[j >> 2] | 0)
					j = l
					k = +(f[l >> 2] | 0)
					l = o
					m = +(f[o >> 2] | 0)
					o = q
					p = +(f[q >> 2] | 0)
					q = s
					r = +(f[s >> 2] | 0)
					s = u
					t = +(f[u >> 2] | 0)
					u = w
					v = +(f[w >> 2] | 0)
					w = z
					x = +(f[z >> 2] | 0)
				} else {
					n[15408] = +n[15408] + +(f[a >> 2] | 0)
					y = (a + 4) | 0
					b = +(f[y >> 2] | 0)
					n[15409] = +n[15409] + b
					c = (a + 8) | 0
					d = +(f[c >> 2] | 0)
					n[15410] = +n[15410] + d
					e = (a + 12) | 0
					g = +(f[e >> 2] | 0)
					n[15411] = +n[15411] + g
					h = (a + 16) | 0
					i = +(f[h >> 2] | 0)
					n[15412] = +n[15412] + i
					j = (a + 20) | 0
					k = +(f[j >> 2] | 0)
					n[15413] = +n[15413] + k
					l = (a + 24) | 0
					m = +(f[l >> 2] | 0)
					n[15414] = +n[15414] + m
					o = (a + 28) | 0
					p = +(f[o >> 2] | 0)
					n[15415] = +n[15415] + p
					q = (a + 32) | 0
					r = +(f[q >> 2] | 0)
					n[15416] = +n[15416] + r
					s = (a + 36) | 0
					t = +(f[s >> 2] | 0)
					n[15417] = +n[15417] + t
					u = (a + 40) | 0
					v = +(f[u >> 2] | 0)
					n[15418] = +n[15418] + v
					w = (a + 44) | 0
					x = +(f[w >> 2] | 0)
					n[15419] = +n[15419] + x
					f[17768] = (f[17768] | 0) + 1
				}
				f[a >> 2] = ~~(+(f[a >> 2] | 0) - +n[868])
				f[y >> 2] = ~~(b - +n[872])
				f[c >> 2] = ~~(d - +n[1696])
				f[e >> 2] = ~~(g - +n[876])
				f[h >> 2] = ~~(i - +n[880])
				f[j >> 2] = ~~(k - +n[884])
				f[l >> 2] = ~~(m - +n[1698])
				f[o >> 2] = ~~(p - +n[888])
				f[q >> 2] = ~~(r - +n[892])
				f[s >> 2] = ~~(t - +n[896])
				f[u >> 2] = ~~(v - +n[1700])
				f[w >> 2] = ~~(x - +n[900])
				return
			}
			function gd(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0
				k = (a + 1046) | 0
				j = d[k >> 1] | 0
				h = (j << 16) >> 16
				if ((j << 16) >> 16 <= 0) return 1
				e = 0
				g = 0
				do {
					g = (g + (((d[(c + (e << 1)) >> 1] | 0) != 0) & 1)) | 0
					e = (e + 1) | 0
				} while ((e | 0) < (h | 0))
				if (!g) return 1
				i = (b + 12) | 0
				j = (a + 1044) | 0
				$g(((f[i >> 2] | 0) + (((d[j >> 1] | 0) - h) << 1)) | 0, c | 0, (h << 1) | 0) | 0
				g = d[k >> 1] | 0
				e = (g << 16) >> 16
				c = (b + 24) | 0
				h = ((f[c >> 2] | 0) + e) | 0
				f[c >> 2] = h
				c = d[j >> 1] | 0
				if ((h | 0) < (((c << 16) >> 16) | 0)) {
					if ((c << 16) >> 16 <= (g << 16) >> 16) return 1
					c = f[i >> 2] | 0
					g = 0
					do {
						d[(c + (g << 1)) >> 1] = d[(c + ((e + g) << 1)) >> 1] | 0
						g = (g + 1) | 0
						e = d[k >> 1] | 0
					} while ((g | 0) < (((d[j >> 1] | 0) - e) | 0))
					return 1
				}
				if ((c << 16) >> 16 > 0) {
					g = f[i >> 2] | 0
					c = f[(b + 8) >> 2] | 0
					e = 0
					do {
						h = e
						e = (e + 1) | 0
						d[(c + (e << 1)) >> 1] = d[(g + (h << 1)) >> 1] | 0
					} while ((e | 0) < (d[j >> 1] | 0))
				}
				hd(a, b)
				e = d[k >> 1] | 0
				if ((d[j >> 1] | 0) <= (e << 16) >> 16) return 1
				c = f[i >> 2] | 0
				g = 0
				e = (e << 16) >> 16
				do {
					d[(c + (g << 1)) >> 1] = d[(c + ((e + g) << 1)) >> 1] | 0
					g = (g + 1) | 0
					e = d[k >> 1] | 0
				} while ((g | 0) < (((d[j >> 1] | 0) - e) | 0))
				return 1
			}
			function hd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0,
					g = 0,
					h = 0.0,
					i = 0.0,
					k = 0.0,
					l = 0,
					m = 0,
					o = 0,
					p = 0,
					q = 0,
					r = 0,
					s = 0,
					v = 0,
					w = 0,
					x = 0.0,
					y = 0.0,
					z = 0.0,
					A = 0.0,
					B = 0.0,
					C = 0.0,
					D = 0.0,
					E = 0.0,
					F = 0.0,
					G = 0.0,
					H = 0.0,
					I = 0.0,
					J = 0.0,
					K = 0.0,
					L = 0.0,
					M = 0.0,
					N = 0.0,
					O = 0.0,
					P = 0,
					Q = 0,
					R = 0,
					T = 0,
					V = 0.0,
					W = 0.0,
					X = 0.0,
					Y = 0.0,
					Z = 0.0
				T = t
				t = (t + 2016) | 0
				if ((t | 0) >= (u | 0)) da(2016)
				c = (T + 1040) | 0
				v = T
				n[17736] = 0.0
				n[17735] = 0.0
				n[17737] = 0.0
				bh(v | 0, 0, 1028) | 0
				p = f[(b + 8) >> 2] | 0
				r = Rc(p, 0) | 0
				e = (r << 16) >> 16
				g = 1
				do {
					R = d[(p + (g << 1)) >> 1] | 0
					d[(c + (g << 1)) >> 1] = e ? R >> e : R
					g = (g + 1) | 0
				} while ((g | 0) != 481)
				R = id(c, 480) | 0
				o = d[(a + 6) >> 1] | 0
				if ((o << 16) >> 16 > 0) {
					c = d[p >> 1] | 0
					if ((c << 16) >> 16 > 1) {
						l = (c << 16) >> 16
						e = ((o << 16) >> 16) << 1
						g = d[(p + (l << 1)) >> 1] | 0
						do {
							m = l
							l = (l + -1) | 0
							Q = g
							g = d[(p + (l << 1)) >> 1] | 0
							c = ((U(e, (g << 16) >> 16) | 0) + 32768) | 0
							c = (((Q << 16) >> 16) - (16 ? c >> 16 : c)) | 0
							if ((c | 0) > 32767) c = 32767
							else c = ((c | 0) > -32768 ? c : -32768) & 65535
							d[(p + (m << 1)) >> 1] = c
						} while ((m | 0) > 2)
					}
					Q = (p + 2) | 0
					P = (2147418112 - ((o & 65535) << 16)) | 0
					P = ((U(16 ? P >> 16 : P, d[Q >> 1] | 0) | 0) + 16384) | 0
					d[Q >> 1] = 15 ? P >>> 15 : P
				}
				if (f[(a + 12) >> 2] | 0 ? ((q = d[p >> 1] | 0), (q << 16) >> 16 >= 1) : 0) {
					e = 1
					c = 1
					while (1) {
						Q = (p + (c << 1)) | 0
						c = ((U(d[(a + 26 + (c << 1)) >> 1] | 0, d[Q >> 1] | 0) | 0) + 16384) | 0
						d[Q >> 1] = 15 ? c >>> 15 : c
						c = ((e + 1) << 16) >> 16
						if ((c << 16) >> 16 > (q << 16) >> 16) break
						else {
							e = c
							c = (c << 16) >> 16
						}
					}
				}
				s = (a + 1044) | 0
				$g(((f[b >> 2] | 0) + 2) | 0, (p + 2) | 0, (d[s >> 1] << 1) | 0) | 0
				s = d[s >> 1] | 0
				$g(
					((f[b >> 2] | 0) + ((s + 1) << 1)) | 0,
					((f[17762] | 0) + 2) | 0,
					(((d[(a + 1014) >> 1] | 0) - s) << 1) | 0,
				) | 0
				jd(a, f[b >> 2] | 0)
				s = (((Rc(f[b >> 2] | 0, 0) | 0) & 65535) + (r & 65535)) | 0
				r = s & 65535
				Q = (b + 4) | 0
				o = f[Q >> 2] | 0
				$g((o + 4) | 0, ((f[17763] | 0) + 4) | 0, (f[o >> 2] << 2) | 0) | 0
				o = (a + 1036) | 0
				if ((d[o >> 1] | 0) < 2) p = a
				else {
					p = (a + 1032) | 0
					q = (a + 1028) | 0
					m = 2
					c = 2
					while (1) {
						e = f[b >> 2] | 0
						l = c << 1
						g = d[(e + ((l + -1) << 1)) >> 1] | 0
						l = d[(e + (l << 1)) >> 1] | 0
						g = Sc(((U(l, l) | 0) + (U(g, g) | 0)) | 0) | 0
						l = d[((f[p >> 2] | 0) + (c << 1)) >> 1] | 0
						e = f[((f[q >> 2] | 0) + (c << 2)) >> 2] | 0
						c = (g << 16) >> 16
						c =
							Sg(
								e | 0,
								((((e | 0) < 0) << 31) >> 31) | 0,
								c | 0,
								((((c | 0) < 0) << 31) >> 31) | 0,
							) | 0
						c = Yg(c | 0, ba() | 0, 15) | 0
						ba() | 0
						e = (l << 16) >> 16
						if ((l << 16) >> 16 > 0) {
							P = ((f[Q >> 2] | 0) + (e << 2)) | 0
							f[P >> 2] = (f[P >> 2] | 0) + c
						}
						if ((l << 16) >> 16 < (d[a >> 1] | 0)) {
							P = ((f[Q >> 2] | 0) + ((e + 1) << 2)) | 0
							f[P >> 2] = ((g << 16) >> 16) - c + (f[P >> 2] | 0)
						}
						c = ((m + 1) << 16) >> 16
						if ((c << 16) >> 16 > (d[o >> 1] | 0)) {
							p = a
							break
						} else {
							m = c
							c = (c << 16) >> 16
						}
					}
				}
				o = Kc(1, r) | 0
				c = d[p >> 1] | 0
				if ((c << 16) >> 16 < 1) P = c
				else {
					l = (30 - s) | 0
					g = 1
					m = f[Q >> 2] | 0
					c = 1
					while (1) {
						w = f[(m + (c << 2)) >> 2] | 0
						w = (w | 0) < (o | 0) ? o : w
						w = (w | 0) == 0 ? 1 : w
						e = ((Oc(w) | 0) << 16) >> 16
						P = (l - e) << 16
						e =
							(3616 + ((((Cc(((Lc(w, (23 - e) & 65535) | 0) + -128) | 0) | 0) << 16) >> 16) << 2)) |
							0
						e = ((((16 ? P >> 16 : P) * 22713) | 0) + (f[e >> 2] | 0)) | 0
						m = f[Q >> 2] | 0
						f[(m + (c << 2)) >> 2] = e
						if ((g << 16) >> 16 < 21) {
							O = +((12 ? e >> 12 : e) | 0) / +(d[(576 + (c << 1)) >> 1] | 0)
							N = +n[(624 + (c << 2)) >> 2] + 0.5
							N = N < O ? O : N
							O = +n[(720 + (c << 2)) >> 2] + -0.5
							O = O > N ? N : O
							n[(59440 + (c << 2)) >> 2] = O
							n[17737] = +n[17737] + O
						}
						e = ((g + 1) << 16) >> 16
						c = d[p >> 1] | 0
						if ((e << 16) >> 16 > (c << 16) >> 16) {
							P = c
							break
						} else {
							g = e
							c = (e << 16) >> 16
						}
					}
				}
				e = f[17747] | 0
				c = j[35861] | 0
				do
					if ((e | 0) > (c | 0)) {
						c = ((j[35860] | 0) + c) | 0
						i = +n[17737]
						if ((e | 0) < (c | 0)) {
							h = i + +n[17765]
							n[17765] = h
							i = +n[17766] + 1.0
							n[17766] = i
							k = +n[14862] + +n[15150]
							n[15150] = k
							x = +n[14863] + +n[15151]
							n[15151] = x
							y = +n[14864] + +n[15152]
							n[15152] = y
							z = +n[14865] + +n[15153]
							n[15153] = z
							A = +n[14866] + +n[15154]
							n[15154] = A
							B = +n[14867] + +n[15155]
							n[15155] = B
							C = +n[14868] + +n[15156]
							n[15156] = C
							D = +n[14869] + +n[15157]
							n[15157] = D
							E = +n[14870] + +n[15158]
							n[15158] = E
							F = +n[14871] + +n[15159]
							n[15159] = F
							G = +n[14872] + +n[15160]
							n[15160] = G
							H = +n[14873] + +n[15161]
							n[15161] = H
							I = +n[14874] + +n[15162]
							n[15162] = I
							J = +n[14875] + +n[15163]
							n[15163] = J
							K = +n[14876] + +n[15164]
							n[15164] = K
							L = +n[14877] + +n[15165]
							n[15165] = L
							M = +n[14878] + +n[15166]
							n[15166] = M
							if ((e | 0) != ((c + -1) | 0)) break
							O = h / i
							O = O > 3.0 ? O : 3.0
							n[17764] = O < 100.0 ? O : 100.0
							n[14890] = k / i
							n[14891] = x / i
							n[14892] = y / i
							n[14893] = z / i
							n[14894] = A / i
							n[14895] = B / i
							n[14896] = C / i
							n[14897] = D / i
							n[14898] = E / i
							n[14899] = F / i
							n[14900] = G / i
							n[14901] = H / i
							n[14902] = I / i
							n[14903] = J / i
							n[14904] = K / i
							n[14905] = L / i
							n[14906] = M / i
							break
						}
						h = i - +n[17764]
						do
							if (h < 0.0) {
								i = i * 1.2999999523162842 + +n[17765]
								n[17765] = i
								h = +n[17766] + 1.2999999523162842
								n[17766] = h
								i = i / h
								i = i > 3.0 ? i : 3.0
								n[17764] = i < 100.0 ? i : 100.0
								i = +n[15150] + +n[14862] * 1.2999999523162842
								n[15150] = i
								n[14890] = i / h
								i = +n[15151] + +n[14863] * 1.2999999523162842
								n[15151] = i
								n[14891] = i / h
								i = +n[15152] + +n[14864] * 1.2999999523162842
								n[15152] = i
								n[14892] = i / h
								i = +n[14865]
								k = +n[15153] + i * 1.2999999523162842
								n[15153] = k
								k = k / h
								n[14893] = k
								x = +n[14866]
								y = +n[15154] + x * 1.2999999523162842
								n[15154] = y
								y = y / h
								n[14894] = y
								z = +n[14867]
								A = +n[15155] + z * 1.2999999523162842
								n[15155] = A
								A = A / h
								n[14895] = A
								B = +n[14868]
								C = +n[15156] + B * 1.2999999523162842
								n[15156] = C
								C = C / h
								n[14896] = C
								D = +n[14869]
								E = +n[15157] + D * 1.2999999523162842
								n[15157] = E
								E = E / h
								n[14897] = E
								F = +n[14870]
								G = +n[15158] + F * 1.2999999523162842
								n[15158] = G
								G = G / h
								n[14898] = G
								H = +n[14871]
								I = +n[15159] + H * 1.2999999523162842
								n[15159] = I
								I = I / h
								n[14899] = I
								J = +n[14872]
								K = +n[15160] + J * 1.2999999523162842
								n[15160] = K
								K = K / h
								n[14900] = K
								L = +n[14873]
								M = +n[15161] + L * 1.2999999523162842
								n[15161] = M
								M = M / h
								n[14901] = M
								N = +n[14874]
								O = +n[15162] + N * 1.2999999523162842
								n[15162] = O
								O = O / h
								n[14902] = O
								V = +n[15163] + +n[14875] * 1.2999999523162842
								n[15163] = V
								n[14903] = V / h
								V = +n[15164] + +n[14876] * 1.2999999523162842
								n[15164] = V
								n[14904] = V / h
								V = +n[15165] + +n[14877] * 1.2999999523162842
								n[15165] = V
								n[14905] = V / h
								V = +n[15166] + +n[14878] * 1.2999999523162842
								n[15166] = V
								h = V / h
							} else {
								if (h < 1.25) {
									i = i * 1.2000000476837158 + +n[17765]
									n[17765] = i
									h = +n[17766] + 1.2000000476837158
									n[17766] = h
									i = i / h
									i = i > 3.0 ? i : 3.0
									n[17764] = i < 100.0 ? i : 100.0
									i = +n[15150] + +n[14862] * 1.2000000476837158
									n[15150] = i
									n[14890] = i / h
									i = +n[15151] + +n[14863] * 1.2000000476837158
									n[15151] = i
									n[14891] = i / h
									i = +n[15152] + +n[14864] * 1.2000000476837158
									n[15152] = i
									n[14892] = i / h
									i = +n[14865]
									k = +n[15153] + i * 1.2000000476837158
									n[15153] = k
									k = k / h
									n[14893] = k
									x = +n[14866]
									y = +n[15154] + x * 1.2000000476837158
									n[15154] = y
									y = y / h
									n[14894] = y
									z = +n[14867]
									A = +n[15155] + z * 1.2000000476837158
									n[15155] = A
									A = A / h
									n[14895] = A
									B = +n[14868]
									C = +n[15156] + B * 1.2000000476837158
									n[15156] = C
									C = C / h
									n[14896] = C
									D = +n[14869]
									E = +n[15157] + D * 1.2000000476837158
									n[15157] = E
									E = E / h
									n[14897] = E
									F = +n[14870]
									G = +n[15158] + F * 1.2000000476837158
									n[15158] = G
									G = G / h
									n[14898] = G
									H = +n[14871]
									I = +n[15159] + H * 1.2000000476837158
									n[15159] = I
									I = I / h
									n[14899] = I
									J = +n[14872]
									K = +n[15160] + J * 1.2000000476837158
									n[15160] = K
									K = K / h
									n[14900] = K
									L = +n[14873]
									M = +n[15161] + L * 1.2000000476837158
									n[15161] = M
									M = M / h
									n[14901] = M
									N = +n[14874]
									O = +n[15162] + N * 1.2000000476837158
									n[15162] = O
									O = O / h
									n[14902] = O
									V = +n[15163] + +n[14875] * 1.2000000476837158
									n[15163] = V
									n[14903] = V / h
									V = +n[15164] + +n[14876] * 1.2000000476837158
									n[15164] = V
									n[14904] = V / h
									V = +n[15165] + +n[14877] * 1.2000000476837158
									n[15165] = V
									n[14905] = V / h
									V = +n[15166] + +n[14878] * 1.2000000476837158
									n[15166] = V
									h = V / h
									break
								}
								if (h < 2.5) {
									i = i * 1.100000023841858 + +n[17765]
									n[17765] = i
									h = +n[17766] + 1.100000023841858
									n[17766] = h
									i = i / h
									i = i > 3.0 ? i : 3.0
									n[17764] = i < 100.0 ? i : 100.0
									i = +n[15150] + +n[14862] * 1.100000023841858
									n[15150] = i
									n[14890] = i / h
									i = +n[15151] + +n[14863] * 1.100000023841858
									n[15151] = i
									n[14891] = i / h
									i = +n[15152] + +n[14864] * 1.100000023841858
									n[15152] = i
									n[14892] = i / h
									i = +n[14865]
									k = +n[15153] + i * 1.100000023841858
									n[15153] = k
									k = k / h
									n[14893] = k
									x = +n[14866]
									y = +n[15154] + x * 1.100000023841858
									n[15154] = y
									y = y / h
									n[14894] = y
									z = +n[14867]
									A = +n[15155] + z * 1.100000023841858
									n[15155] = A
									A = A / h
									n[14895] = A
									B = +n[14868]
									C = +n[15156] + B * 1.100000023841858
									n[15156] = C
									C = C / h
									n[14896] = C
									D = +n[14869]
									E = +n[15157] + D * 1.100000023841858
									n[15157] = E
									E = E / h
									n[14897] = E
									F = +n[14870]
									G = +n[15158] + F * 1.100000023841858
									n[15158] = G
									G = G / h
									n[14898] = G
									H = +n[14871]
									I = +n[15159] + H * 1.100000023841858
									n[15159] = I
									I = I / h
									n[14899] = I
									J = +n[14872]
									K = +n[15160] + J * 1.100000023841858
									n[15160] = K
									K = K / h
									n[14900] = K
									L = +n[14873]
									M = +n[15161] + L * 1.100000023841858
									n[15161] = M
									M = M / h
									n[14901] = M
									N = +n[14874]
									O = +n[15162] + N * 1.100000023841858
									n[15162] = O
									O = O / h
									n[14902] = O
									V = +n[15163] + +n[14875] * 1.100000023841858
									n[15163] = V
									n[14903] = V / h
									V = +n[15164] + +n[14876] * 1.100000023841858
									n[15164] = V
									n[14904] = V / h
									V = +n[15165] + +n[14877] * 1.100000023841858
									n[15165] = V
									n[14905] = V / h
									V = +n[15166] + +n[14878] * 1.100000023841858
									n[15166] = V
									h = V / h
									break
								}
								h = +n[(47440 + ((e + -1) << 2)) >> 2]
								if (!(h > 80.0))
									if (!(h > 70.0))
										if (!(h > 60.0))
											if (!(h > 50.0))
												if (h > 40.0) h = 0.2199999988079071
												else h = h > 30.0 ? 0.10000000149011612 : 0.019999999552965164
											else h = 0.30000001192092896
										else h = 0.20999999344348907
									else h = 0.20000000298023224
								else h = 0.15000000596046448
								i = +n[17765] + i * h
								n[17765] = i
								V = h + +n[17766]
								n[17766] = V
								i = i / V
								i = i > 3.0 ? i : 3.0
								n[17764] = i < 100.0 ? i : 100.0
								i = +n[15150] + h * +n[14862]
								n[15150] = i
								n[14890] = i / V
								i = +n[15151] + h * +n[14863]
								n[15151] = i
								n[14891] = i / V
								i = +n[15152] + h * +n[14864]
								n[15152] = i
								n[14892] = i / V
								i = +n[14865]
								k = +n[15153] + h * i
								n[15153] = k
								k = k / V
								n[14893] = k
								x = +n[14866]
								y = +n[15154] + h * x
								n[15154] = y
								y = y / V
								n[14894] = y
								z = +n[14867]
								A = +n[15155] + h * z
								n[15155] = A
								A = A / V
								n[14895] = A
								B = +n[14868]
								C = +n[15156] + h * B
								n[15156] = C
								C = C / V
								n[14896] = C
								D = +n[14869]
								E = +n[15157] + h * D
								n[15157] = E
								E = E / V
								n[14897] = E
								F = +n[14870]
								G = +n[15158] + h * F
								n[15158] = G
								G = G / V
								n[14898] = G
								H = +n[14871]
								I = +n[15159] + h * H
								n[15159] = I
								I = I / V
								n[14899] = I
								J = +n[14872]
								K = +n[15160] + h * J
								n[15160] = K
								K = K / V
								n[14900] = K
								L = +n[14873]
								M = +n[15161] + h * L
								n[15161] = M
								M = M / V
								n[14901] = M
								N = +n[14874]
								O = +n[15162] + h * N
								n[15162] = O
								O = O / V
								n[14902] = O
								W = +n[15163] + h * +n[14875]
								n[15163] = W
								n[14903] = W / V
								W = +n[15164] + h * +n[14876]
								n[15164] = W
								n[14904] = W / V
								W = +n[15165] + h * +n[14877]
								n[15165] = W
								n[14905] = W / V
								h = +n[15166] + h * +n[14878]
								n[15166] = h
								h = h / V
							}
						while (0)
						n[14906] = h
						Z = +n[14862] - +n[14890]
						Z = !(Z <= 0.0) ? Z : 9.999999747378752e-5
						n[(v + 8) >> 2] = Z
						Y = +n[14863] - +n[14891]
						Y = !(Y <= 0.0) ? Y : 9.999999747378752e-5
						n[(v + 12) >> 2] = Y
						X = +n[14864] - +n[14892]
						X = !(X <= 0.0) ? X : 9.999999747378752e-5
						n[(v + 16) >> 2] = X
						h = i - k
						h = !(h <= 0.0) ? h : 9.999999747378752e-5
						n[(v + 20) >> 2] = h
						y = x - y
						y = !(y <= 0.0) ? y : 9.999999747378752e-5
						n[(v + 24) >> 2] = y
						A = z - A
						A = !(A <= 0.0) ? A : 9.999999747378752e-5
						n[(v + 28) >> 2] = A
						C = B - C
						C = !(C <= 0.0) ? C : 9.999999747378752e-5
						n[(v + 32) >> 2] = C
						E = D - E
						E = !(E <= 0.0) ? E : 9.999999747378752e-5
						n[(v + 36) >> 2] = E
						G = F - G
						G = !(G <= 0.0) ? G : 9.999999747378752e-5
						n[(v + 40) >> 2] = G
						I = H - I
						I = !(I <= 0.0) ? I : 9.999999747378752e-5
						n[(v + 44) >> 2] = I
						K = J - K
						K = !(K <= 0.0) ? K : 9.999999747378752e-5
						n[(v + 48) >> 2] = K
						M = L - M
						M = !(M <= 0.0) ? M : 9.999999747378752e-5
						n[(v + 52) >> 2] = M
						O = N - O
						O = !(O <= 0.0) ? O : 9.999999747378752e-5
						n[(v + 56) >> 2] = O
						V = +n[14875] - +n[14903]
						V = !(V <= 0.0) ? V : 9.999999747378752e-5
						n[(v + 60) >> 2] = V
						W = +n[14876] - +n[14904]
						W = !(W <= 0.0) ? W : 9.999999747378752e-5
						n[(v + 64) >> 2] = W
						i = +n[14877] - +n[14905]
						i = !(i <= 0.0) ? i : 9.999999747378752e-5
						n[(v + 68) >> 2] = i
						k = +n[14878] - +n[14906]
						k = !(k <= 0.0) ? k : 9.999999747378752e-5
						n[(v + 72) >> 2] = k
						k = Z + 0.0 + Y + X + h + y + A + C + E + G + I + K + M + O + V + W + i + k
						i = 0.0
						c = 2
						do {
							h = k - +n[(v + (c << 2)) >> 2]
							h = h > 9.999999747378752e-5 ? h : 9.999999747378752e-5
							h = +S(+h) * h
							if (c >>> 0 < 11) h = h * 3.0
							else h = h / 10.0
							i = i - h
							c = (c + 1) | 0
						} while ((c | 0) != 19)
						Z = 1.0 - i / 2.8332133293151855
						n[17735] = (Z > 100.0 ? Z : 100.0) / 100.0 + -1.0
						f[17736] = f[17764]
					}
				while (0)
				w = d[(a + 2) >> 1] | 0
				v = (w << 16) >> 16 < 1
				a: do
					if (!v) {
						q = d[(a + 1020) >> 1] | 0
						r = (((q | 0) < 0) << 31) >> 31
						s = f[(b + 16) >> 2] | 0
						if ((P << 16) >> 16 < 1) {
							e = 1
							c = 1
							while (1) {
								f[(s + (c << 2)) >> 2] = 0
								c = ((e + 1) << 16) >> 16
								if ((c << 16) >> 16 > (w << 16) >> 16) break a
								else {
									e = c
									c = (c << 16) >> 16
								}
							}
						}
						p = f[Q >> 2] | 0
						o = 1
						m = 1
						while (1) {
							l = (m + -1) | 0
							e = 1
							g = 0
							c = 1
							while (1) {
								Q = f[(p + (c << 2)) >> 2] | 0
								c = d[(16 + ((l * 46) | 0) + ((c + -1) << 1)) >> 1] | 0
								c =
									Sg(
										c | 0,
										((((c | 0) < 0) << 31) >> 31) | 0,
										Q | 0,
										((((Q | 0) < 0) << 31) >> 31) | 0,
									) | 0
								c = Yg(c | 0, ba() | 0, 15) | 0
								ba() | 0
								g = (g + c) | 0
								c = ((e + 1) << 16) >> 16
								if ((c << 16) >> 16 > (P << 16) >> 16) break
								else {
									e = c
									c = (c << 16) >> 16
								}
							}
							c = Sg(q | 0, r | 0, g | 0, ((((g | 0) < 0) << 31) >> 31) | 0) | 0
							c = Yg(c | 0, ba() | 0, 14) | 0
							ba() | 0
							f[(s + (m << 2)) >> 2] = c
							c = ((o + 1) << 16) >> 16
							if ((c << 16) >> 16 > (w << 16) >> 16) break
							else {
								o = c
								m = (c << 16) >> 16
							}
						}
					}
				while (0)
				e = f[(b + 16) >> 2] | 0
				if (((d[(a + 8) >> 1] | 0) < 1) | v) {
					g = ((w + 1) << 16) >> 16
					g = (g << 16) >> 16
					g = (e + (g << 2)) | 0
					f[g >> 2] = R
					g = (b + 28) | 0
					g = f[g >> 2] | 0
					c = f[17747] | 0
					c = (g + (c << 2)) | 0
					c = f[c >> 2] | 0
					e = (e + 4) | 0
					g = (c + 52) | 0
					do {
						f[c >> 2] = f[e >> 2]
						c = (c + 4) | 0
						e = (e + 4) | 0
					} while ((c | 0) < (g | 0))
					t = T
					return
				}
				c = 1
				do {
					v = (c << 16) >> 16
					Q = (e + (v << 2)) | 0
					P = f[Q >> 2] | 0
					v = d[(a + 988 + (v << 1)) >> 1] | 0
					P =
						Sg(v | 0, ((((v | 0) < 0) << 31) >> 31) | 0, P | 0, ((((P | 0) < 0) << 31) >> 31) | 0) |
						0
					P = Yg(P | 0, ba() | 0, 11) | 0
					ba() | 0
					f[Q >> 2] = P
					c = ((c + 1) << 16) >> 16
				} while ((c << 16) >> 16 <= (w << 16) >> 16)
				g = ((w + 1) << 16) >> 16
				g = (g << 16) >> 16
				g = (e + (g << 2)) | 0
				f[g >> 2] = R
				g = (b + 28) | 0
				g = f[g >> 2] | 0
				c = f[17747] | 0
				c = (g + (c << 2)) | 0
				c = f[c >> 2] | 0
				e = (e + 4) | 0
				g = (c + 52) | 0
				do {
					f[c >> 2] = f[e >> 2]
					c = (c + 4) | 0
					e = (e + 4) | 0
				} while ((c | 0) < (g | 0))
				t = T
				return
			}
			function id(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0
				e = (b << 16) >> 16
				if ((b << 16) >> 16 >= 1) {
					b = 0
					c = 1
					do {
						i = d[(a + (c << 1)) >> 1] | 0
						i = U(i, i) | 0
						j = d[(a + ((c + 1) << 1)) >> 1] | 0
						j = Lc(Jc(i, U(j, j) | 0) | 0, 1) | 0
						i = d[(a + ((c + 2) << 1)) >> 1] | 0
						i = U(i, i) | 0
						k = d[(a + ((c + 3) << 1)) >> 1] | 0
						k = Jc(j, Lc(Jc(i, U(k, k) | 0) | 0, 1) | 0) | 0
						i = d[(a + ((c + 4) << 1)) >> 1] | 0
						i = U(i, i) | 0
						j = d[(a + ((c + 5) << 1)) >> 1] | 0
						j = Lc(Jc(i, U(j, j) | 0) | 0, 1) | 0
						i = d[(a + ((c + 6) << 1)) >> 1] | 0
						i = U(i, i) | 0
						h = d[(a + ((c + 7) << 1)) >> 1] | 0
						b = Jc(b, Lc(Jc(k, Jc(j, Lc(Jc(i, U(h, h) | 0) | 0, 1) | 0) | 0) | 0, 5) | 0) | 0
						h = ((c << 16) + 524288) | 0
						c = 16 ? h >> 16 : h
					} while ((c | 0) <= (e | 0))
					if (!b) g = 5
				} else g = 5
				if ((g | 0) == 5) b = 1
				k = ((Oc(b) | 0) << 16) >> 16
				j = (2359296 - (k << 16)) | 0
				k = (3616 + ((((Cc(((Lc(b, (23 - k) & 65535) | 0) + -128) | 0) | 0) << 16) >> 16) << 2)) | 0
				return ((((16 ? j >> 16 : j) * 22713) | 0) + (f[k >> 2] | 0)) | 0
			}
			function jd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0,
					q = 0,
					r = 0,
					s = 0,
					t = 0,
					u = 0,
					v = 0,
					w = 0,
					x = 0,
					y = 0,
					z = 0
				x = d[b >> 1] | 0
				y = Gc(x, 1) | 0
				z = (x << 16) >> 16
				e = (x << 16) >> 16 > 2
				if (e) {
					l = 0
					c = 131072
					do {
						l = ((l & 65535) + 1) | 0
						c = c << 1
					} while (((16 ? c >> 16 : c) | 0) < (z | 0))
					j = l & 65535
					c = (b + 2) | 0
					w = 1 ? z >> 1 : z
					k = (z + -2) | 0
					if (e) {
						e = 0
						i = 0
						while (1) {
							e = e << 16
							e = 16 ? e >> 16 : e
							if ((i | 0) < (e | 0)) {
								v = (c + (i << 1)) | 0
								u = d[v >> 1] | 0
								t = (c + (e << 1)) | 0
								d[v >> 1] = d[t >> 1] | 0
								d[t >> 1] = u
								t = (c + ((i + 1) << 1)) | 0
								u = d[t >> 1] | 0
								v = (c + ((e + 1) << 1)) | 0
								d[t >> 1] = d[v >> 1] | 0
								d[v >> 1] = u
							}
							if ((w | 0) > (e | 0)) g = w
							else {
								h = w
								while (1) {
									g = 1 ? h >> 1 : h
									e = (e - h) << 16
									e = 16 ? e >> 16 : e
									if ((g | 0) > (e | 0)) break
									else h = g
								}
							}
							v = ((i << 16) + 131072) | 0
							i = 16 ? v >> 16 : v
							if ((i | 0) >= (k | 0)) break
							else e = (e + g) | 0
						}
					}
					if ((j << 16) >> 16 > 0) {
						v = (a + 1040) | 0
						u = l & 65535
						t = 0
						do {
							e = 131072 << t
							r = 16 ? e >> 16 : e
							if ((e | 0) > 0) {
								s = (t ? w >> t : w) << 16
								p = 15 ? e >>> 15 : e
								e = 0
								q = 0
								while (1) {
									if ((e << 16) >> 16 < (x << 16) >> 16) {
										j = f[v >> 2] | 0
										o = U(s, q) | 0
										o = 16 ? o >> 16 : o
										n = (j + (o << 1)) | 0
										o = (j + ((o + 1) << 1)) | 0
										j = (e << 16) >> 16
										while (1) {
											k = (j + r) << 16
											k = 16 ? k >> 16 : k
											g = (c + (k << 1)) | 0
											e = d[g >> 1] | 0
											h = d[n >> 1] | 0
											m = U(h, e) | 0
											k = (c + ((k + 1) << 1)) | 0
											l = d[k >> 1] | 0
											i = d[o >> 1] | 0
											m = (m - (U(i, l) | 0)) | 0
											h = ((U(i, e) | 0) + (U(l, h) | 0)) | 0
											l = (c + (j << 1)) | 0
											m = ((m << 1) + 32768) | 0
											m = 16 ? m >> 16 : m
											e = ((d[l >> 1] | 0) - m) | 0
											if ((e | 0) <= 32767)
												if ((e | 0) < -32768) e = -16384
												else e = (1 ? e >>> 1 : e) & 65535
											else e = 16383
											d[g >> 1] = e
											i = (c + ((j + 1) << 1)) | 0
											g = ((h << 1) + 32768) | 0
											g = 16 ? g >> 16 : g
											e = ((d[i >> 1] | 0) - g) | 0
											if ((e | 0) <= 32767)
												if ((e | 0) < -32768) e = -16384
												else e = (1 ? e >>> 1 : e) & 65535
											else e = 16383
											d[k >> 1] = e
											m = (m + (d[l >> 1] | 0)) | 0
											d[l >> 1] = 1 ? m >>> 1 : m
											m = (g + (d[i >> 1] | 0)) | 0
											d[i >> 1] = 1 ? m >>> 1 : m
											m = (j + p) | 0
											e = m << 16
											if ((x << 16) >> 16 > ((m & 65535) << 16) >> 16) j = 16 ? e >> 16 : e
											else break
										}
									}
									e = (q + 2) | 0
									o = e << 16
									q = 16 ? o >> 16 : o
									if ((r | 0) <= (q | 0)) break
									else e = e & 65535
								}
							}
							t = (t + 1) | 0
						} while ((t | 0) != (u | 0))
					}
				} else c = (b + 2) | 0
				l = (b + 4) | 0
				w = d[c >> 1] | 0
				x = d[l >> 1] | 0
				d[c >> 1] = x + w
				d[l >> 1] = w - x
				l = (y << 16) >> 16
				if ((y << 16) >> 16 < 2) return
				h = f[(a + 1040) >> 2] | 0
				i = (b + 2) | 0
				j = (b + 2) | 0
				k = (b + 2) | 0
				g = (b + 2) | 0
				e = (z + 65534) | 0
				c = 2
				while (1) {
					p = (g + (c << 1)) | 0
					s = d[p >> 1] | 0
					w = e << 16
					w = 16 ? w >> 16 : w
					u = (k + (w << 1)) | 0
					n = d[u >> 1] | 0
					q = (c + 1) | 0
					t = (j + (q << 1)) | 0
					x = d[t >> 1] | 0
					y = (w + 1) | 0
					b = (i + (y << 1)) | 0
					v = d[b >> 1] | 0
					a = (x - v) << 16
					x = (v + x) << 16
					x = 16 ? x >> 16 : x
					v = (n - s) << 16
					v = 16 ? v >> 16 : v
					r = (h + (c << 1)) | 0
					o = U(x, d[r >> 1] | 0) | 0
					q = (h + (q << 1)) | 0
					s = (((n + s) << 16) + 65536) | 0
					o = (s + ((o - (U(v, d[q >> 1] | 0) | 0)) << 1)) | 0
					d[p >> 1] = 17 ? o >> 17 : o
					r = U(v, d[r >> 1] | 0) | 0
					r = (a + 65536 + (((U(x, d[q >> 1] | 0) | 0) + r) << 1)) | 0
					d[t >> 1] = 17 ? r >> 17 : r
					w = (h + (w << 1)) | 0
					t = U(x, d[w >> 1] | 0) | 0
					y = (h + (y << 1)) | 0
					t = (s + (((U(v, d[y >> 1] | 0) | 0) + t) << 1)) | 0
					d[u >> 1] = 17 ? t >> 17 : t
					w = U(v, d[w >> 1] | 0) | 0
					y = (((w | 0) == -2147483648 ? 2147483647 : (0 - w) | 0) + (U(x, d[y >> 1] | 0) | 0)) << 1
					y = (((a | 0) == -2147483648 ? -2147418113 : (65536 - a) | 0) + y) | 0
					d[b >> 1] = 17 ? y >> 17 : y
					c = ((c << 16) + 131072) | 0
					c = 16 ? c >> 16 : c
					if ((c | 0) > (l | 0)) break
					else e = (z - c) | 0
				}
				return
			}
			function kd() {
				var a = 0,
					b = 0,
					c = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					k = 0
				a = Uc(1, 1048) | 0
				if (!a) {
					k = 0
					return k | 0
				}
				d[(a + 4) >> 1] = 16
				d[a >> 1] = 23
				d[(a + 2) >> 1] = 12
				d[(a + 6) >> 1] = 31784
				i = (a + 8) | 0
				d[i >> 1] = 22
				f[(a + 12) >> 2] = 1
				f[(a + 16) >> 2] = 1
				d[(a + 20) >> 1] = 2
				d[(a + 1044) >> 1] = 480
				d[(a + 1046) >> 1] = 160
				if (!(ld(a) | 0)) {
					Nf(a)
					k = 0
					return k | 0
				}
				k = (a + 1014) | 0
				b = Gc(d[k >> 1] | 0, 1) | 0
				h = (a + 1036) | 0
				d[h >> 1] = b
				b = Gc(12867, 6) | 0
				b = Nc(b, Fc(d[a >> 1] | 0, 6) | 0) | 0
				d[(a + 1018) >> 1] = b
				b = Sc(Kc(((Nc(2, d[a >> 1] | 0) | 0) << 16) >> 16, 13) | 0) | 0
				d[(a + 1020) >> 1] = b
				b = (((j[a >> 1] | 0) << 16) + 65536) | 0
				e = 16 ? b >> 16 : b
				g = Uc((e + 1) | 0, 4) | 0
				if (!g) {
					f[(a + 1024) >> 2] = 0
					k = 0
					return k | 0
				}
				f[g >> 2] = e
				if ((b | 0) >= 65536) {
					b = 1
					c = 1
					do {
						f[(g + (c << 2)) >> 2] = f[(2384 + (c << 2)) >> 2]
						b = ((b + 1) << 16) >> 16
						c = (b << 16) >> 16
					} while ((e | 0) >= (c | 0))
				}
				f[(a + 1024) >> 2] = g
				e = d[h >> 1] | 0
				g = Uc((((e << 16) >> 16) + 1) | 0, 2) | 0
				if (!g) {
					f[(a + 1032) >> 2] = 0
					k = 0
					return k | 0
				}
				if ((e << 16) >> 16 >= 1) {
					c = 1
					b = 1
					while (1) {
						d[(g + (b << 1)) >> 1] = d[(816 + (b << 1)) >> 1] | 0
						b = ((c + 1) << 16) >> 16
						if ((b << 16) >> 16 > (e << 16) >> 16) break
						else {
							c = b
							b = (b << 16) >> 16
						}
					}
				}
				f[(a + 1032) >> 2] = g
				e = d[h >> 1] | 0
				b = (e << 16) >> 16
				g = Uc((b + 1) | 0, 4) | 0
				if (!g) {
					f[(a + 1028) >> 2] = 0
					k = 0
					return k | 0
				}
				f[g >> 2] = b
				if ((e << 16) >> 16 >= 1) {
					c = 1
					b = 1
					while (1) {
						f[(g + (b << 2)) >> 2] = f[(1344 + (b << 2)) >> 2]
						b = ((c + 1) << 16) >> 16
						if ((b << 16) >> 16 > (e << 16) >> 16) break
						else {
							c = b
							b = (b << 16) >> 16
						}
					}
				}
				f[(a + 1028) >> 2] = g
				b = 1
				do {
					d[(a + 26 + (b << 1)) >> 1] = d[(2496 + (b << 1)) >> 1] | 0
					b = (b + 1) | 0
				} while ((b | 0) != 481)
				d[(a + 24) >> 1] = 480
				c = d[i >> 1] | 0
				d[(a + 990) >> 1] = 5254
				d[(a + 992) >> 1] = 8394
				d[(a + 994) >> 1] = 11406
				d[(a + 996) >> 1] = 14227
				d[(a + 998) >> 1] = 16800
				d[(a + 1e3) >> 1] = 19073
				d[(a + 1002) >> 1] = 20999
				d[(a + 1004) >> 1] = 22540
				d[(a + 1006) >> 1] = 23663
				d[(a + 1008) >> 1] = 24346
				d[(a + 1010) >> 1] = 24576
				d[(a + 1012) >> 1] = 24346
				d[(a + 986) >> 1] = c
				c = d[k >> 1] | 0
				e = Uc((((c << 16) >> 16) + 1) | 0, 2) | 0
				if (!e) {
					f[17762] = 0
					k = 0
					return k | 0
				}
				d[e >> 1] = c
				f[17762] = e
				if ((c << 16) >> 16 >= 1) {
					b = 1
					do {
						d[(e + (((b << 16) >> 16) << 1)) >> 1] = 0
						b = ((b + 1) << 16) >> 16
					} while ((b << 16) >> 16 <= (c << 16) >> 16)
				}
				e = d[k >> 1] | 0
				b = (e << 16) >> 16
				g = Uc((b + 1) | 0, 4) | 0
				if (!g) {
					f[17763] = 0
					k = 0
					return k | 0
				}
				f[g >> 2] = b
				f[17763] = g
				if ((e << 16) >> 16 < 1) {
					k = a
					return k | 0
				}
				c = 1
				b = 1
				while (1) {
					f[(g + (b << 2)) >> 2] = 0
					b = ((c + 1) << 16) >> 16
					if ((e << 16) >> 16 < (b << 16) >> 16) break
					else {
						c = b
						b = (b << 16) >> 16
					}
				}
				return a | 0
			}
			function ld(a) {
				a = a | 0
				var b = 0,
					c = 0,
					e = 0,
					f = 0,
					g = 0,
					h = 0
				h = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				f = (h + 2) | 0
				g = h
				c = (a + 1044) | 0
				if ((d[c >> 1] | 0) > 2) {
					b = 2
					do {
						b = Fc(b, 1) | 0
						e = (d[c >> 1] | 0) > (b << 16) >> 16
					} while (((b << 16) >> 16 < 2049) & e)
				} else b = 2
				d[(a + 1014) >> 1] = b
				Qc(46811, f, g)
				e = Nc(d[(a + 4) >> 1] | 0, b) | 0
				g = Cc(Pc(d[f >> 1] | 0, d[g >> 1] | 0, e) | 0) | 0
				d[(a + 1016) >> 1] = g
				g = md(a) | 0
				t = h
				return g | 0
			}
			function md(a) {
				a = a | 0
				var b = 0,
					c = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0
				c = d[(a + 1014) >> 1] | 0
				e = Gc(c, 1) | 0
				c = Uc((c << 16) >> 16, 2) | 0
				a = (a + 1040) | 0
				f[a >> 2] = c
				if (!c) {
					e = 0
					return e | 0
				}
				if ((e << 16) >> 16 <= 0) {
					e = 1
					return e | 0
				}
				c = e & 65535
				b = 0
				do {
					h = Lc(Hc(180, Nc(b & 65535, e) | 0) | 0, 1) | 0
					i = nd(h, 0) | 0
					g = b << 1
					d[((f[a >> 2] | 0) + (g << 1)) >> 1] = i
					h = Ic(nd(h, 1) | 0) | 0
					d[((f[a >> 2] | 0) + ((g | 1) << 1)) >> 1] = h
					b = (b + 1) | 0
				} while ((b | 0) != (c | 0))
				a = 1
				return a | 0
			}
			function nd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0
				i = ~a
				i = (((i | 0) > -11796480 ? i : -11796480) + a + 11796480) | 0
				a = (((i >>> 0) % 11796480 | 0) - i + a) | 0
				if (((a + -2949121) | 0) >>> 0 < 5898240) {
					a = (5898240 - a) | 0
					i = 1
				} else {
					a = ((a + -8847361) | 0) >>> 0 < 2949120 ? (a + -11796480) | 0 : a
					i = 0
				}
				c = 0
				d = 19898
				h = 0
				do {
					e = h & 65535
					g = Gc(c, e) | 0
					if ((a | 0) > 0) {
						g = Ec(d, g) | 0
						c = Dc(c, Gc(d, e) | 0) | 0
						d = g
						a = (a - (f[(4128 + (h << 2)) >> 2] | 0)) | 0
					} else {
						g = Dc(d, g) | 0
						c = Ec(c, Gc(d, e) | 0) | 0
						d = g
						a = ((f[(4128 + (h << 2)) >> 2] | 0) + a) | 0
					}
					h = (h + 1) | 0
				} while ((h | 0) != 13)
				if ((b << 16) >> 16) {
					b = c
					return b | 0
				}
				if (!((i << 16) >> 16)) {
					b = d
					return b | 0
				}
				b = (0 - (d & 65535)) & 65535
				return b | 0
			}
			function od(a) {
				a = a | 0
				var b = 0,
					c = 0
				Nf(f[17762] | 0)
				f[17762] = 0
				Nf(f[17763] | 0)
				f[17763] = 0
				if (!a) return 1
				b = (a + 1024) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = (a + 1032) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = (a + 1028) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = f[(a + 1040) >> 2] | 0
				if (b | 0) Nf(b)
				Nf(a)
				return 1
			}
			function pd(a) {
				a = a | 0
				var b = 0,
					c = 0,
					e = 0
				e = Uc(1, 36) | 0
				if (!e) {
					e = 0
					return e | 0
				}
				b = d[(a + 1014) >> 1] | 0
				c = Uc((((b << 16) >> 16) + 1) | 0, 2) | 0
				if (!c) {
					f[e >> 2] = 0
					e = 0
					return e | 0
				}
				d[c >> 1] = b
				f[e >> 2] = c
				b = d[a >> 1] | 0
				c = Uc((b + 1) | 0, 4) | 0
				if (!c) {
					f[(e + 4) >> 2] = 0
					e = 0
					return e | 0
				}
				f[c >> 2] = b
				f[(e + 4) >> 2] = c
				b = (a + 1044) | 0
				c = d[b >> 1] | 0
				a = Uc((((c << 16) >> 16) + 1) | 0, 2) | 0
				if (!a) {
					f[(e + 8) >> 2] = 0
					e = 0
					return e | 0
				}
				d[a >> 1] = c
				f[(e + 8) >> 2] = a
				a = Uc(d[b >> 1] | 0, 2) | 0
				f[(e + 12) >> 2] = a
				if (!a) {
					e = 0
					return e | 0
				}
				f[(e + 24) >> 2] = 0
				f[(e + 20) >> 2] = 0
				b = Uc(14, 4) | 0
				if (!b) {
					f[(e + 16) >> 2] = 0
					e = 0
					return e | 0
				}
				f[b >> 2] = 13
				f[(e + 16) >> 2] = b
				a = Vc(3e3, 39, 4) | 0
				f[(e + 28) >> 2] = a
				if (!a) {
					e = 0
					return e | 0
				}
				a = Vc(3e3, 39, 1) | 0
				f[(e + 32) >> 2] = a
				e = (a | 0) == 0 ? 0 : e
				return e | 0
			}
			function qd(a) {
				a = a | 0
				var b = 0,
					c = 0
				if (!a) {
					a = 0
					return a | 0
				}
				b = f[a >> 2] | 0
				if (b | 0) {
					Nf(b)
					f[a >> 2] = 0
				}
				b = (a + 4) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = (a + 8) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = (a + 16) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = (a + 12) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Nf(c)
					f[b >> 2] = 0
				}
				b = (a + 28) | 0
				c = f[b >> 2] | 0
				if (c | 0) {
					Wc(c)
					f[b >> 2] = 0
				}
				b = f[(a + 32) >> 2] | 0
				if (b | 0) Wc(b)
				Nf(a)
				a = 1
				return a | 0
			}
			function rd(a, b) {
				a = a | 0
				b = b | 0
				f[(b + 24) >> 2] = 0
				f[(b + 20) >> 2] = 0
				bh(f[(b + 12) >> 2] | 0, 0, (d[(a + 1046) >> 1] << 1) | 0) | 0
				f[17767] = 0
				n[17764] = 0.0
				n[17765] = 0.0
				n[17766] = 0.0
				bh(59552, 0, 1028) | 0
				bh(60592, 0, 1028) | 0
				sd()
				return
			}
			function sd() {
				var a = 0,
					b = 0,
					c = 0.0,
					d = 0.0,
					e = 0.0,
					g = 0.0,
					h = 0.0,
					i = 0.0,
					j = 0.0,
					k = 0.0,
					l = 0.0,
					m = 0.0,
					o = 0.0,
					p = 0.0,
					q = 0.0
				i = 1.0 / 500.0
				m = +n[1048]
				n[868] = m * i
				o = +n[1052]
				n[872] = o * i
				p = +n[1702]
				n[1696] = p * i
				q = +n[1056]
				n[876] = q * i
				c = +n[1060]
				n[880] = c * i
				d = +n[1064]
				n[884] = d * i
				e = +n[1704]
				n[1698] = e * i
				g = +n[1068]
				n[888] = g * i
				h = +n[1072]
				n[892] = h * i
				j = +n[1076]
				n[896] = j * i
				k = +n[1706]
				n[1700] = k * i
				l = +n[1080]
				n[900] = l * i
				if (500 <= 800) {
					a = 61632
					b = (a + 48) | 0
					do {
						f[a >> 2] = 0
						a = (a + 4) | 0
					} while ((a | 0) < (b | 0))
					f[17768] = 0
					return
				}
				i = i * 500.0
				n[1048] = i * m
				n[1052] = i * o
				n[1702] = i * p
				n[1056] = i * q
				n[1060] = i * c
				n[1064] = i * d
				n[1704] = i * e
				n[1068] = i * g
				n[1072] = i * h
				n[1076] = i * j
				n[1706] = i * k
				n[1080] = i * l
				a = 61632
				b = (a + 48) | 0
				do {
					f[a >> 2] = 0
					a = (a + 4) | 0
				} while ((a | 0) < (b | 0))
				f[17768] = 0
				return
			}
			function td(a) {
				a = a | 0
				var b = 0,
					c = 0.0,
					e = 0,
					f = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0
				j = t
				t = (t + 640) | 0
				if ((t | 0) >= (u | 0)) da(640)
				i = j
				bh(i | 0, 0, 640) | 0
				g = 0
				do {
					c = +(d[(a + (g << 1)) >> 1] | 0) * 0.9273 + 0.0
					b = (g + -1) | 0
					do
						if (g) {
							c = c + +(d[(a + (b << 1)) >> 1] | 0) * -1.8545
							e = (g + -2) | 0
							if ((g | 0) == 1) {
								b = (i + (b << 3)) | 0
								h = 9
								break
							} else {
								b = (i + (b << 3)) | 0
								f = (a + (e << 1)) | 0
								e = (i + (e << 3)) | 0
								break
							}
						} else {
							c = c + +(d[(71726 + ((g + 1) << 1)) >> 1] | 0) * -1.8545
							b = (68544 + ((g + 1) << 3)) | 0
							h = 9
						}
					while (0)
					if ((h | 0) == 9) {
						h = 0
						f = (71726 + (g << 1)) | 0
						e = (68544 + (g << 3)) | 0
					}
					p[(i + (g << 3)) >> 3] =
						c + +(d[f >> 1] | 0) * 0.9273 - (+p[b >> 3] * -1.9059 + 0.0 + +p[e >> 3] * 0.9114)
					g = (g + 1) | 0
				} while ((g | 0) != 80)
				d[35863] = d[(a + 156) >> 1] | 0
				d[35864] = d[(a + 158) >> 1] | 0
				p[8568] = +p[(i + 624) >> 3]
				p[8569] = +p[(i + 632) >> 3]
				b = 0
				do {
					d[(a + (b << 1)) >> 1] = ~~+p[(i + (b << 3)) >> 3]
					b = (b + 1) | 0
				} while ((b | 0) != 80)
				t = j
				return
			}
			function ud(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0.0,
					f = 0,
					g = 0.0,
					h = 0,
					i = 0,
					j = 0.0,
					k = 0,
					l = 0
				l = t
				t = (t + 1920) | 0
				if ((t | 0) >= (u | 0)) da(1920)
				h = l
				if (1 == 1) {
					c = 0
					do {
						p[(h + (c << 3)) >> 3] = +p[(61680 + (c << 3)) >> 3] * +(d[(a + (c << 1)) >> 1] | 0)
						c = (c + 1) | 0
					} while ((c | 0) != 240)
				} else {
					c = 0
					do {
						p[(h + (c << 3)) >> 3] = +(d[(a + (c << 1)) >> 1] | 0)
						c = (c + 1) | 0
					} while ((c | 0) != 240)
				}
				if ((b | 0) >= 0) {
					c = 0
					while (1) {
						f = (63600 + (c << 3)) | 0
						p[f >> 3] = 0.0
						if (c >>> 0 < 240) {
							a = c
							e = 0.0
							do {
								e = e + +p[(h + (a << 3)) >> 3] * +p[(h + ((a - c) << 3)) >> 3]
								a = (a + 1) | 0
							} while ((a | 0) != 240)
							p[f >> 3] = e
						}
						if ((c | 0) == (b | 0)) break
						else c = (c + 1) | 0
					}
				}
				p[7958] = 1.0
				p[7966] = 1.0
				e = +p[7950]
				p[7974] = e
				if ((b | 0) <= 0) {
					k = (63792 + (b << 3)) | 0
					j = +p[k >> 3]
					t = l
					return +j
				}
				i = ((b << 3) + 8) | 0
				j = -+p[7951]
				c = 0
				h = 1
				while (1) {
					f = (c | 0) == 0
					if (!f) {
						c = (c + 1) | 0
						a = 1
						g = 0.0
						do {
							g = g + +p[(63664 + (a << 3)) >> 3] * +p[(63600 + ((c - a) << 3)) >> 3]
							a = (a + 1) | 0
						} while ((a | 0) != (h | 0))
						g = -(+p[(63600 + (c << 3)) >> 3] + g) / e
						p[(63856 + (c << 3)) >> 3] = g
						if (f) k = 21
						else {
							a = 1
							do {
								p[(63728 + (a << 3)) >> 3] =
									+p[(63664 + (a << 3)) >> 3] + g * +p[(63664 + ((c - a) << 3)) >> 3]
								a = (a + 1) | 0
							} while ((a | 0) != (h | 0))
						}
					} else {
						g = j / e
						p[7983] = g
						k = 21
					}
					if ((k | 0) == 21) {
						k = 0
						p[7967] = +p[7983]
						c = 1
					}
					p[(63728 + (c << 3)) >> 3] = g
					e = e * (1.0 - g * g)
					p[(63792 + (c << 3)) >> 3] = e
					$g(63664, 63728, i | 0) | 0
					if ((c | 0) == (b | 0)) break
					else h = (h + 1) | 0
				}
				k = (63792 + (b << 3)) | 0
				j = +p[k >> 3]
				t = l
				return +j
			}
			function vd() {
				var a = 0,
					b = 0.0,
					c = 0.0,
					d = 0.0,
					e = 0.0,
					g = 0.0,
					h = 0.0,
					i = 0.0,
					j = 0.0,
					k = 0.0,
					l = 0.0,
					m = 0.0,
					n = 0.0,
					o = 0.0,
					q = 0.0,
					r = 0.0,
					s = 0.0,
					v = 0.0,
					w = 0.0,
					x = 0.0,
					y = 0.0,
					z = 0,
					A = 0,
					B = 0,
					C = 0,
					D = 0,
					E = 0.0,
					F = 0.0,
					G = 0.0,
					H = 0.0,
					I = 0.0
				B = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				z = B
				p[z >> 3] = 0.0
				h = +p[8864]
				i = +p[8865]
				b = +p[7959]
				c = +p[7960]
				d = +p[7961]
				e = +p[7962]
				g = +p[7963]
				j = b * b
				l = c * c
				n = d * d
				w = e * e
				x = g * g
				y = +p[7964]
				y = y * y
				a = 0
				do {
					I = +p[7990]
					H = +p[7997]
					G = +p[8004]
					F = +p[8011]
					E = +p[8018]
					k = j * I + 0.0 + l * H + n * G + w * F + x * E + y * +p[8025] + h
					v = k + i
					m = k / v
					o = -(b * I) / v
					q = -(c * H) / v
					r = -(d * G) / v
					s = -(e * F) / v
					v = -(g * E) / v
					p[8026] = k - m * k
					p[8033] = I - o * 0.0
					p[8040] = H - q * 0.0
					p[8047] = G - r * 0.0
					p[8054] = F - s * 0.0
					p[8061] = E - v * 0.0
					A = 63920
					C = 64208
					D = (A + 48) | 0
					do {
						f[A >> 2] = f[C >> 2]
						A = (A + 4) | 0
						C = (C + 4) | 0
					} while ((A | 0) < (D | 0))
					A = 63968
					C = 64256
					D = (A + 48) | 0
					do {
						f[A >> 2] = f[C >> 2]
						A = (A + 4) | 0
						C = (C + 4) | 0
					} while ((A | 0) < (D | 0))
					A = 64016
					C = 64304
					D = (A + 48) | 0
					do {
						f[A >> 2] = f[C >> 2]
						A = (A + 4) | 0
						C = (C + 4) | 0
					} while ((A | 0) < (D | 0))
					A = 64064
					C = 64352
					D = (A + 48) | 0
					do {
						f[A >> 2] = f[C >> 2]
						A = (A + 4) | 0
						C = (C + 4) | 0
					} while ((A | 0) < (D | 0))
					A = 64112
					C = 64400
					D = (A + 48) | 0
					do {
						f[A >> 2] = f[C >> 2]
						A = (A + 4) | 0
						C = (C + 4) | 0
					} while ((A | 0) < (D | 0))
					A = 64160
					C = 64448
					D = (A + 48) | 0
					do {
						f[A >> 2] = f[C >> 2]
						A = (A + 4) | 0
						C = (C + 4) | 0
					} while ((A | 0) < (D | 0))
					a = (a + 1) | 0
				} while ((a | 0) != 12)
				p[z >> 3] = k
				p[8852] = m
				p[8854] = o
				p[8856] = q
				p[8858] = r
				p[8860] = s
				p[8862] = v
				t = B
				return
			}
			function wd() {
				var a = 0,
					b = 0.0
				a = 0
				do {
					b = 0.54 - +K(+((+(a | 0) * 6.283185307) / 239.0)) * 0.46
					p[(61680 + (a << 3)) >> 3] = b
					a = (a + 1) | 0
				} while ((a | 0) != 240)
				return
			}
			function xd() {
				var a = 0,
					b = 0
				a = 65200
				b = (a + 48) | 0
				do {
					f[a >> 2] = 0
					a = (a + 4) | 0
				} while ((a | 0) < (b | 0))
				a = 65248
				b = (a + 48) | 0
				do {
					f[a >> 2] = 0
					a = (a + 4) | 0
				} while ((a | 0) < (b | 0))
				a = 65296
				b = (a + 48) | 0
				do {
					f[a >> 2] = 0
					a = (a + 4) | 0
				} while ((a | 0) < (b | 0))
				f[17769] = 0
				f[16124] = 0
				f[16125] = 0
				f[16126] = 0
				f[16127] = 0
				f[16128] = 0
				f[16129] = 0
				f[16130] = 0
				f[16131] = 0
				return
			}
			function yd(a) {
				a = a | 0
				var b = 0,
					c = 0.0,
					e = 0,
					g = 0.0,
					h = 0.0,
					i = 0,
					k = 0,
					l = 0.0,
					m = 0.0,
					n = 0.0,
					o = 0.0,
					q = 0.0,
					r = 0.0,
					s = 0.0,
					t = 0.0,
					u = 0.0,
					v = 0.0,
					w = 0,
					x = 0.0,
					y = 0.0
				if ((f[17747] | 0) < (j[35861] | 0)) return
				td(a)
				b = f[17769] | 0
				if ((b | 0) <= 11) {
					k = (b | 0) > 1
					if (k) {
						i = (((b * 80) | 0) + -160) | 0
						e = 0
						do {
							d[(66944 + ((i + e) << 1)) >> 1] = d[(a + (e << 1)) >> 1] | 0
							e = (e + 1) | 0
						} while ((e | 0) != 80)
					}
					e = 0
					do {
						w = (68736 + ((e + 80) << 1)) | 0
						d[(68736 + (e << 1)) >> 1] = d[w >> 1] | 0
						i = (68736 + ((e + 160) << 1)) | 0
						d[w >> 1] = d[i >> 1] | 0
						d[i >> 1] = d[(a + (e << 1)) >> 1] | 0
						e = (e + 1) | 0
					} while ((e | 0) != 80)
					if (!b) p[8866] = 0.0
					if (k) {
						v = +ud(68736, 3)
						p[8866] = v + +p[8866]
						p[8063] = +p[7959] + +p[8063]
						p[8064] = +p[7960] + +p[8064]
						p[8065] = +p[7961] + +p[8065]
						b = f[17769] | 0
						if ((b | 0) == 11) {
							p[8062] = 1.0
							g = +p[8063] / 10.0
							p[8063] = g
							h = +p[8064] / 10.0
							p[8064] = h
							l = +p[8065] / 10.0
							p[8065] = l
							c = +p[8866] / 10.0
							p[8866] = c
							c = c / 240.0
							p[8865] = c
							if (!0) {
								b = 0
								do {
									if (b) {
										c = g * +(d[(66944 + ((b + -1) << 1)) >> 1] | 0) + 0.0
										if ((b | 0) != 1) {
											c = c + h * +(d[(66944 + ((b + -2) << 1)) >> 1] | 0)
											if (b >>> 0 > 2) c = c + l * +(d[(66944 + ((b + -3) << 1)) >> 1] | 0)
										}
									} else c = 0.0
									d[(65344 + (b << 1)) >> 1] = (j[(66944 + (b << 1)) >> 1] | 0) + (~~c & 65535)
									b = (b + 1) | 0
								} while ((b | 0) != 800)
								p[8865] = 0.0
								b = 0
								c = 0.0
								do {
									v = +(d[(65344 + (b << 1)) >> 1] | 0)
									c = c + v * v
									b = (b + 1) | 0
								} while ((b | 0) != 800)
								c = c / 800.0
								p[8865] = c
							}
							bh(63920, 0, 288) | 0
							p[7990] = c
							p[7997] = c
							p[8004] = c
							p[8011] = c
							p[8018] = c
							p[8025] = c
							b = 0
							do {
								d[(65344 + ((b + 80) << 1)) >> 1] = d[(65344 + ((b + 640) << 1)) >> 1] | 0
								d[(65344 + ((b + 160) << 1)) >> 1] = d[(65344 + ((b + 720) << 1)) >> 1] | 0
								b = (b + 1) | 0
							} while ((b | 0) != 80)
							d[34448] = d[(a + 154) >> 1] | 0
							d[34449] = d[(a + 156) >> 1] | 0
							d[34450] = d[(a + 158) >> 1] | 0
							b = 11
						}
					}
				} else {
					f[17184] = f[17224]
					d[34370] = d[34450] | 0
					b = 0
					do {
						d[(68736 + ((b + 3) << 1)) >> 1] = d[(a + (b << 1)) >> 1] | 0
						b = (b + 1) | 0
					} while ((b | 0) != 80)
					c = +p[8063]
					g = +p[8064]
					h = +p[8065]
					b = 0
					do {
						k = (65344 + ((b + 80) << 1)) | 0
						d[(65344 + (b << 1)) >> 1] = d[k >> 1] | 0
						w = (65344 + ((b + 160) << 1)) | 0
						d[k >> 1] = d[w >> 1] | 0
						d[w >> 1] =
							(j[(68736 + ((b + 3) << 1)) >> 1] | 0) +
							(~~(
								c * +(d[(68736 + ((b + 2) << 1)) >> 1] | 0) +
								0.0 +
								g * +(d[(68736 + ((b + 1) << 1)) >> 1] | 0) +
								h * +(d[(68736 + (b << 1)) >> 1] | 0)
							) &
								65535)
						b = (b + 1) | 0
					} while ((b | 0) != 80)
					h = +ud(65344, 6)
					p[8866] = h
					p[8864] = 0.0
					h = +p[7958]
					l = +p[7959]
					m = +p[7960]
					n = +p[7961]
					o = +p[7962]
					q = +p[7963]
					r = +p[7964]
					b = 0
					g = 0.0
					do {
						c = h * +(d[(65344 + (b << 1)) >> 1] | 0) + 0.0
						if (b) {
							c = c + l * +(d[(65344 + ((b + -1) << 1)) >> 1] | 0)
							if ((b | 0) != 1) {
								c = c + m * +(d[(65344 + ((b + -2) << 1)) >> 1] | 0)
								if (b >>> 0 > 2) {
									c = c + n * +(d[(65344 + ((b + -3) << 1)) >> 1] | 0)
									if ((b | 0) != 3) {
										c = c + o * +(d[(65344 + ((b + -4) << 1)) >> 1] | 0)
										if (b >>> 0 > 4) {
											c = c + q * +(d[(65344 + ((b + -5) << 1)) >> 1] | 0)
											if ((b | 0) != 5) c = c + r * +(d[(65344 + ((b + -6) << 1)) >> 1] | 0)
										}
									}
								}
							}
						}
						g = c * c + g
						b = (b + 1) | 0
					} while ((b | 0) != 80)
					p[8864] = g / 240.0
					vd()
					c = +p[7959]
					g = +p[7960]
					h = +p[7961]
					l = +p[7962]
					m = +p[7963]
					n = +p[7964]
					o = +p[8852]
					q = +p[8854]
					r = +p[8856]
					s = +p[8858]
					t = +p[8860]
					u = +p[8862]
					b = 0
					do {
						v =
							0.0 -
							c * +p[8150] -
							g * +p[8151] -
							h * +p[8152] -
							l * +p[8153] -
							m * +p[8154] -
							n * +p[8155]
						e = 65256
						i = 65200
						k = (e + 40) | 0
						do {
							f[e >> 2] = f[i >> 2]
							e = (e + 4) | 0
							i = (i + 4) | 0
						} while ((e | 0) < (k | 0))
						y = +(d[(65344 + (b << 1)) >> 1] | 0) - v
						x = v + o * y
						p[8162] = x
						p[8163] = +p[8157] + q * y
						p[8164] = +p[8158] + r * y
						p[8165] = +p[8159] + s * y
						p[8166] = +p[8160] + t * y
						p[8167] = +p[8161] + u * y
						p[(64560 + (b << 3)) >> 3] = x
						e = 65200
						i = 65296
						k = (e + 48) | 0
						do {
							f[e >> 2] = f[i >> 2]
							e = (e + 4) | 0
							i = (i + 4) | 0
						} while ((e | 0) < (k | 0))
						b = (b + 1) | 0
					} while ((b | 0) != 80)
					p[8156] = v
					f[17140] = f[17180]
					d[34282] = d[34362] | 0
					bh(68566, 0, 160) | 0
					c = +p[8063]
					g = +p[8064]
					h = +p[8065]
					b = 0
					e = d[34282] | 0
					i = d[34280] | 0
					do {
						w = b
						b = (b + 1) | 0
						k = i
						i = d[(68560 + (b << 1)) >> 1] | 0
						e = ~~(
							+p[(64560 + (w << 3)) >> 3] -
							(c * +((e << 16) >> 16) + 0.0 + g * +((i << 16) >> 16) + h * +((k << 16) >> 16))
						)
						d[(68560 + ((w + 3) << 1)) >> 1] = e
						d[(a + (w << 1)) >> 1] = e
					} while ((b | 0) != 80)
					b = f[17769] | 0
				}
				f[17769] = b + 1
				return
			}
			function zd(a) {
				a = a | 0
				var b = 0,
					c = 0
				b = Xc() | 0
				f[17770] = b
				if (!b) {
					b = 0
					return b | 0
				}
				b = kd() | 0
				f[17771] = b
				if (!b) {
					b = -1
					return b | 0
				}
				b = pd(b) | 0
				f[17772] = b
				if (!b) {
					b = -2
					return b | 0
				}
				if (!a) {
					b = 1
					return b | 0
				}
				f[17774] = 1
				c = Of(8e4, 2) | 0
				b = f[17773] | 0
				f[(69216 + (b << 3)) >> 2] = c
				a = Of(8e4, 2) | 0
				f[(69216 + (b << 3) + 4) >> 2] = a
				bh(c | 0, 0, 16e4) | 0
				bh(a | 0, 0, 16e4) | 0
				f[17773] = b + 1
				b = 1
				return b | 0
			}
			function Ad() {
				var a = 0,
					b = 0,
					c = 0
				a = f[17770] | 0
				if (a | 0) {
					Yc(a) | 0
					f[17770] = 0
				}
				a = f[17772] | 0
				if (a | 0) {
					qd(a) | 0
					f[17772] = 0
				}
				a = f[17771] | 0
				if (a | 0) {
					od(a) | 0
					f[17771] = 0
				}
				if ((f[17773] | 0) <= 0) {
					f[17774] = 0
					f[17773] = 0
					return
				}
				a = 0
				do {
					c = (69216 + (a << 3)) | 0
					Nf(f[c >> 2] | 0)
					b = (69216 + (a << 3) + 4) | 0
					Nf(f[b >> 2] | 0)
					f[c >> 2] = 0
					f[b >> 2] = 0
					a = (a + 1) | 0
				} while ((a | 0) < (f[17773] | 0))
				f[17774] = 0
				f[17773] = 0
				return
			}
			function Bd(a) {
				a = a | 0
				a = Zc(f[17770] | 0, a) | 0
				rd(f[17771] | 0, f[17772] | 0)
				f[17767] = 0
				f[17777] = 0
				f[17776] = 0
				f[17775] = 0
				return a | 0
			}
			function Cd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0
				k = t
				t = (t + 640) | 0
				if ((t | 0) >= (u | 0)) da(640)
				g = (k + 320) | 0
				h = k
				if ((b | 0) < 1) {
					j = 0
					t = k
					return j | 0
				}
				if ((f[17775] | 0) > 28) {
					j = -4
					t = k
					return j | 0
				}
				if ((b | 0) > 159) {
					i = 0
					do {
						c = f[17777] | 0
						if ((c | 0) > 0) {
							$g((69456 + (c << 1)) | 0, (a + (i << 1)) | 0, (320 - (c << 1)) | 0) | 0
							f[17777] = 0
							c = (160 - c) | 0
						} else {
							$g(69456, (a + (i << 1)) | 0, 320) | 0
							c = 160
						}
						i = (c + i) | 0
						$g(g | 0, 69456, 320) | 0
						$g(h | 0, 69456, 320) | 0
						_c(f[17770] | 0, h, 160) | 0
						if (f[17774] | 0) {
							c = f[17776] | 0
							e = f[17775] | 0
							if ((c | 0) > 79840) {
								c = (e + 1) | 0
								f[17775] = c
								d = f[17773] | 0
								if ((d | 0) < ((e + 2) | 0)) {
									l = Of(8e4, 2) | 0
									f[(69216 + (d << 3)) >> 2] = l
									e = Of(8e4, 2) | 0
									f[(69216 + (d << 3) + 4) >> 2] = e
									bh(l | 0, 0, 16e4) | 0
									bh(e | 0, 0, 16e4) | 0
									f[17773] = d + 1
								}
								f[17776] = 0
								d = c
								c = 0
							} else d = e
							$g(((f[(69216 + (d << 3)) >> 2] | 0) + (c << 1)) | 0, g | 0, 320) | 0
							$g(((f[(69216 + (d << 3) + 4) >> 2] | 0) + (c << 1)) | 0, 69456, 320) | 0
							f[17776] = c + 160
						}
						gd(f[17771] | 0, f[17772] | 0, h) | 0
						d = $c(f[17770] | 0, h, 160) | 0
						if ((f[17747] | 0) > 7) dd(f[17771] | 0, f[17772] | 0)
					} while (((d | 2 | 0) == 2) & (((b - i) | 0) > 159))
					c = (d | 0) == 0
					if ((d | 2 | 0) == 2 ? ((j = (b - i) | 0), (j | 0) > 0) : 0) {
						f[17777] = j
						$g(69456, (a + (i << 1)) | 0, (j << 1) | 0) | 0
					}
				} else {
					d = 0
					c = 0
				}
				l = c & ((f[17752] | 0) == 1) ? 2 : d
				t = k
				return l | 0
			}
			function Dd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					k = 0
				i = t
				t = (t + 320) | 0
				if ((t | 0) >= (u | 0)) da(320)
				h = i
				if (!(f[17774] | 0)) {
					h = -1
					t = i
					return h | 0
				}
				d = j[35856] | 0
				e = ((((j[35862] | 0) - d) | 0) * 160) | 0
				if (!a) {
					h = e
					t = i
					return h | 0
				}
				c = ((d >>> 0) / 500) | 0
				d = ((U(c, -8e4) | 0) + ((d * 160) | 0)) | 0
				a: do
					if (((e + d) | 0) > 8e4) {
						g = 0
						while (1) {
							if ((c | 0) >= (f[17773] | 0)) {
								c = 0
								break
							}
							k = (8e4 - d) | 0
							$g(
								(a + (g << 1)) | 0,
								((f[(69216 + (c << 3) + (b << 2)) >> 2] | 0) + (d << 1)) | 0,
								(k << 1) | 0,
							) | 0
							d = (g + k) | 0
							e = (e - k) | 0
							c = (c + 1) | 0
							if ((e | 0) > 8e4) {
								g = d
								d = 0
							} else {
								g = d
								d = 0
								break a
							}
						}
						t = i
						return c | 0
					} else g = 0
				while (0)
				$g(
					(a + (g << 1)) | 0,
					((f[(69216 + (c << 3) + (b << 2)) >> 2] | 0) + (d << 1)) | 0,
					(e << 1) | 0,
				) | 0
				c = (g + e) | 0
				if (!b) {
					k = c
					t = i
					return k | 0
				}
				Zc(f[17770] | 0, 1) | 0
				e = ((c | 0) / 160) | 0
				if ((c | 0) <= 159) {
					k = c
					t = i
					return k | 0
				}
				d = 0
				do {
					k = (a + ((d * 160) << 1)) | 0
					$g(h | 0, k | 0, 320) | 0
					_c(f[17770] | 0, h, 160) | 0
					$g(k | 0, h | 0, 320) | 0
					d = (d + 1) | 0
				} while ((d | 0) != (e | 0))
				t = i
				return c | 0
			}
			function Ed(a) {
				a = a | 0
				a = (a | 0) < 180 ? a : 180
				a = (a | 0) > 28 ? a : 28
				f[1870] = a
				return a | 0
			}
			function Fd() {
				return +(+n[17746])
			}
			function Gd(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = j[35856] | 0
				f[a >> 2] = c * 160
				a = j[35862] | 0
				f[b >> 2] = a * 160
				return (((a - c) | 0) * 160) | 0
			}
			function Hd() {
				Id(0)
				return
			}
			function Id(a) {
				a = a | 0
				Ya(8405, 2, 7500, 8424, 2, 3)
				Ya(8428, 1, 7508, 8448, 12, 2)
				Ya(8451, 2, 7500, 8424, 2, 4)
				Ya(8473, 3, 7512, 8495, 7, 3)
				Ya(8500, 1, 7524, 8520, 5, 13)
				Ya(8523, 1, 7528, 8520, 6, 14)
				Ya(8542, 1, 7532, 8561, 1, 1)
				Ya(8564, 2, 7500, 8424, 2, 7)
				Xd(8594)
				Yd(8606)
				return
			}
			function Jd(a, b) {
				a = a | 0
				b = b | 0
				return mc[a & 15](b) | 0
			}
			function Kd(a) {
				a = a | 0
				Lf(9103) | 0
				Lf(9139) | 0
				Lf(9163) | 0
				return zd(a) | 0
			}
			function Ld(a) {
				a = a | 0
				qc[a & 3]()
				return
			}
			function Md() {
				Ad()
				return
			}
			function Nd(a) {
				a = a | 0
				return Bd(a) | 0
			}
			function Od(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				return nc[a & 7](b, c) | 0
			}
			function Pd(a, b) {
				a = a | 0
				b = b | 0
				return Cd(a, b) | 0
			}
			function Qd(a) {
				a = a | 0
				var b = 0,
					c = 0
				b = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				c = b
				rc[a & 31](c)
				a = Pf(12) | 0
				f[a >> 2] = f[c >> 2]
				f[(a + 4) >> 2] = f[(c + 4) >> 2]
				f[(a + 8) >> 2] = f[(c + 8) >> 2]
				t = b
				return a | 0
			}
			function Rd(a) {
				a = a | 0
				var b = 0
				f[a >> 2] = 0
				f[(a + 4) >> 2] = 0
				f[(a + 8) >> 2] = 0
				b = Dd(0, 0) | 0
				if ((b | 0) <= 0) return
				b = Of(b, 2) | 0
				Ee(a, b, (b + ((Dd(b, 0) | 0) << 1)) | 0)
				return
			}
			function Sd(a) {
				a = a | 0
				var b = 0,
					c = 0
				b = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				c = b
				rc[a & 31](c)
				a = Pf(12) | 0
				f[a >> 2] = f[c >> 2]
				f[(a + 4) >> 2] = f[(c + 4) >> 2]
				f[(a + 8) >> 2] = f[(c + 8) >> 2]
				t = b
				return a | 0
			}
			function Td(a) {
				a = a | 0
				var b = 0,
					c = 0,
					d = 0,
					e = 0,
					g = 0
				e = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				b = (e + 4) | 0
				c = e
				f[a >> 2] = 0
				d = (a + 4) | 0
				f[d >> 2] = 0
				g = (a + 8) | 0
				f[g >> 2] = 0
				Gd(b, c) | 0
				De(a, b)
				b = f[d >> 2] | 0
				if ((b | 0) == (f[g >> 2] | 0)) {
					De(a, c)
					t = e
					return
				} else {
					f[b >> 2] = f[c >> 2]
					f[d >> 2] = b + 4
					t = e
					return
				}
			}
			function Ud(a) {
				a = a | 0
				return +(+jc[a & 1]())
			}
			function Vd() {
				return +(+Fd())
			}
			function Wd(a) {
				a = a | 0
				return Ed(a) | 0
			}
			function Xd(a) {
				a = a | 0
				Ta(6928, 6952, 6968, 0, 8520, 8, 8620, 0, 8620, 0, a | 0, 8448, 15)
				Ua(6928, 1, 7572, 8520, 9, 1)
				a = Pf(8) | 0
				f[a >> 2] = 1
				f[(a + 4) >> 2] = 0
				Va(6928, 8622, 3, 7576, 8632, 1, a | 0, 0)
				a = Pf(8) | 0
				f[a >> 2] = 2
				f[(a + 4) >> 2] = 0
				Va(6928, 8637, 4, 4368, 8644, 4, a | 0, 0)
				a = Pf(8) | 0
				f[a >> 2] = 10
				f[(a + 4) >> 2] = 0
				Va(6928, 8650, 2, 7588, 8424, 4, a | 0, 0)
				a = Pf(4) | 0
				f[a >> 2] = 3
				Va(6928, 8655, 3, 7596, 8495, 8, a | 0, 0)
				a = Pf(4) | 0
				f[a >> 2] = 9
				Va(6928, 8659, 4, 4384, 8663, 1, a | 0, 0)
				return
			}
			function Yd(a) {
				a = a | 0
				Ta(6832, 6856, 6872, 0, 8520, 11, 8620, 0, 8620, 0, a | 0, 8448, 16)
				Ua(6832, 1, 7536, 8520, 12, 2)
				a = Pf(8) | 0
				f[a >> 2] = 2
				f[(a + 4) >> 2] = 0
				Va(6832, 8622, 3, 7540, 8632, 4, a | 0, 0)
				a = Pf(8) | 0
				f[a >> 2] = 5
				f[(a + 4) >> 2] = 0
				Va(6832, 8637, 4, 4336, 8644, 5, a | 0, 0)
				a = Pf(8) | 0
				f[a >> 2] = 13
				f[(a + 4) >> 2] = 0
				Va(6832, 8650, 2, 7552, 8424, 5, a | 0, 0)
				a = Pf(4) | 0
				f[a >> 2] = 6
				Va(6832, 8655, 3, 7560, 8495, 10, a | 0, 0)
				a = Pf(4) | 0
				f[a >> 2] = 11
				Va(6832, 8659, 4, 4352, 8663, 2, a | 0, 0)
				return
			}
			function Zd(a) {
				a = a | 0
				return 6832
			}
			function _d(a) {
				a = a | 0
				var b = 0
				if (!a) return
				b = f[a >> 2] | 0
				if (b | 0) {
					f[(a + 4) >> 2] = b
					Qf(b)
				}
				Qf(a)
				return
			}
			function $d(a) {
				a = a | 0
				return lc[a & 3]() | 0
			}
			function ae() {
				var a = 0
				a = Pf(12) | 0
				f[a >> 2] = 0
				f[(a + 4) >> 2] = 0
				f[(a + 8) >> 2] = 0
				return a | 0
			}
			function be(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0
				c = (a + 4) | 0
				e = f[c >> 2] | 0
				if ((e | 0) == (f[(a + 8) >> 2] | 0)) {
					ne(a, b)
					return
				} else {
					d[e >> 1] = d[b >> 1] | 0
					f[c >> 2] = e + 2
					return
				}
			}
			function ce(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0
				h = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				g = h
				e = f[a >> 2] | 0
				i = f[(a + 4) >> 2] | 0
				a = (b + (1 ? i >> 1 : i)) | 0
				if (i & 1) e = f[((f[a >> 2] | 0) + e) >> 2] | 0
				d[g >> 1] = c
				sc[e & 3](a, g)
				t = h
				return
			}
			function de(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0
				d = (a + 4) | 0
				e = f[a >> 2] | 0
				g = ((f[d >> 2] | 0) - e) | 0
				g = 1 ? g >> 1 : g
				if (g >>> 0 < b >>> 0) {
					me(a, (b - g) | 0, c)
					return
				}
				if (g >>> 0 <= b >>> 0) return
				f[d >> 2] = e + (b << 1)
				return
			}
			function ee(a, b, c, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				e = e | 0
				var g = 0,
					h = 0,
					i = 0,
					j = 0
				i = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				h = i
				g = f[a >> 2] | 0
				j = f[(a + 4) >> 2] | 0
				a = (b + (1 ? j >> 1 : j)) | 0
				if (j & 1) g = f[((f[a >> 2] | 0) + g) >> 2] | 0
				d[h >> 1] = e
				tc[g & 7](a, c, h)
				t = i
				return
			}
			function fe(a) {
				a = a | 0
				a = ((f[(a + 4) >> 2] | 0) - (f[a >> 2] | 0)) | 0
				return (1 ? a >> 1 : a) | 0
			}
			function ge(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0
				c = f[a >> 2] | 0
				d = f[(a + 4) >> 2] | 0
				a = (b + (1 ? d >> 1 : d)) | 0
				if (!(d & 1)) {
					d = c
					d = mc[d & 15](a) | 0
					return d | 0
				} else {
					d = f[((f[a >> 2] | 0) + c) >> 2] | 0
					d = mc[d & 15](a) | 0
					return d | 0
				}
				return 0
			}
			function he(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var e = 0,
					g = 0,
					h = 0
				h = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				e = h
				g = f[b >> 2] | 0
				b = ((f[(b + 4) >> 2] | 0) - g) | 0
				if ((1 ? b >> 1 : b) >>> 0 <= c >>> 0) {
					g = 1
					f[a >> 2] = g
					t = h
					return
				}
				f[e >> 2] = d[(g + (c << 1)) >> 1]
				g = fb(7376, e | 0) | 0
				f[a >> 2] = g
				t = h
				return
			}
			function ie(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0
				d = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				e = d
				tc[f[a >> 2] & 7](e, b, c)
				db(f[e >> 2] | 0)
				c = f[e >> 2] | 0
				cb(c | 0)
				t = d
				return c | 0
			}
			function je(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				d[((f[a >> 2] | 0) + (b << 1)) >> 1] = d[c >> 1] | 0
				return 1
			}
			function ke(a, b, c, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				e = e | 0
				var g = 0,
					h = 0
				g = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				h = g
				a = f[a >> 2] | 0
				d[h >> 1] = e
				e = oc[a & 15](b, c, h) | 0
				t = g
				return e | 0
			}
			function le(a) {
				a = a | 0
				Ga(a | 0) | 0
				rg()
			}
			function me(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0
				n = (a + 8) | 0
				g = f[n >> 2] | 0
				o = (a + 4) | 0
				e = f[o >> 2] | 0
				m = (g - e) | 0
				h = e
				if ((1 ? m >> 1 : m) >>> 0 >= b >>> 0) {
					e = b
					g = h
					while (1) {
						d[g >> 1] = d[c >> 1] | 0
						e = (e + -1) | 0
						if (!e) break
						else g = (g + 2) | 0
					}
					f[o >> 2] = h + (b << 1)
					return
				}
				m = f[a >> 2] | 0
				l = (e - m) | 0
				h = 1 ? l >> 1 : l
				e = (h + b) | 0
				if ((e | 0) < 0) Vf(a)
				k = (g - m) | 0
				e = (1 ? k >> 1 : k) >>> 0 < 1073741823 ? (k >>> 0 < e >>> 0 ? e : k) : 2147483647
				do
					if (e)
						if ((e | 0) < 0) {
							o = Fa(8) | 0
							Tf(o, 8688)
							f[o >> 2] = 8224
							Ia(o | 0, 7264, 6)
						} else {
							k = Pf(e << 1) | 0
							j = k
							break
						}
					else {
						j = 0
						k = 0
					}
				while (0)
				i = (j + (h << 1)) | 0
				g = (j + (e << 1)) | 0
				e = b
				h = i
				while (1) {
					d[h >> 1] = d[c >> 1] | 0
					e = (e + -1) | 0
					if (!e) break
					else h = (h + 2) | 0
				}
				if ((l | 0) > 0) $g(k | 0, m | 0, l | 0) | 0
				f[a >> 2] = j
				f[o >> 2] = i + (b << 1)
				f[n >> 2] = g
				if (!m) return
				Qf(m)
				return
			}
			function ne(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0
				j = (a + 4) | 0
				k = f[a >> 2] | 0
				l = ((f[j >> 2] | 0) - k) | 0
				h = 1 ? l >> 1 : l
				c = (h + 1) | 0
				if ((l | 0) < -2) Vf(a)
				m = (a + 8) | 0
				i = ((f[m >> 2] | 0) - k) | 0
				i = (1 ? i >> 1 : i) >>> 0 < 1073741823 ? (i >>> 0 < c >>> 0 ? c : i) : 2147483647
				do
					if (i)
						if ((i | 0) < 0) {
							m = Fa(8) | 0
							Tf(m, 8688)
							f[m >> 2] = 8224
							Ia(m | 0, 7264, 6)
						} else {
							g = Pf(i << 1) | 0
							e = g
							break
						}
					else {
						e = 0
						g = 0
					}
				while (0)
				c = (e + (h << 1)) | 0
				d[c >> 1] = d[b >> 1] | 0
				if ((l | 0) > 0) $g(g | 0, k | 0, l | 0) | 0
				f[a >> 2] = e
				f[j >> 2] = c + 2
				f[m >> 2] = e + (i << 1)
				if (!k) return
				Qf(k)
				return
			}
			function oe(a) {
				a = a | 0
				return 6928
			}
			function pe(a) {
				a = a | 0
				var b = 0
				if (!a) return
				b = f[a >> 2] | 0
				if (b | 0) {
					f[(a + 4) >> 2] = b
					Qf(b)
				}
				Qf(a)
				return
			}
			function qe(a) {
				a = a | 0
				return lc[a & 3]() | 0
			}
			function re() {
				var a = 0
				a = Pf(12) | 0
				f[a >> 2] = 0
				f[(a + 4) >> 2] = 0
				f[(a + 8) >> 2] = 0
				return a | 0
			}
			function se(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0
				c = (a + 4) | 0
				d = f[c >> 2] | 0
				if ((d | 0) == (f[(a + 8) >> 2] | 0)) {
					De(a, b)
					return
				} else {
					f[d >> 2] = f[b >> 2]
					f[c >> 2] = d + 4
					return
				}
			}
			function te(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0
				g = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				e = g
				d = f[a >> 2] | 0
				h = f[(a + 4) >> 2] | 0
				a = (b + (1 ? h >> 1 : h)) | 0
				if (h & 1) d = f[((f[a >> 2] | 0) + d) >> 2] | 0
				f[e >> 2] = c
				sc[d & 3](a, e)
				t = g
				return
			}
			function ue(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0
				d = (a + 4) | 0
				e = f[a >> 2] | 0
				g = ((f[d >> 2] | 0) - e) | 0
				g = 2 ? g >> 2 : g
				if (g >>> 0 < b >>> 0) {
					Ce(a, (b - g) | 0, c)
					return
				}
				if (g >>> 0 <= b >>> 0) return
				f[d >> 2] = e + (b << 2)
				return
			}
			function ve(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0
				h = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				g = h
				e = f[a >> 2] | 0
				i = f[(a + 4) >> 2] | 0
				a = (b + (1 ? i >> 1 : i)) | 0
				if (i & 1) e = f[((f[a >> 2] | 0) + e) >> 2] | 0
				f[g >> 2] = d
				tc[e & 7](a, c, g)
				t = h
				return
			}
			function we(a) {
				a = a | 0
				a = ((f[(a + 4) >> 2] | 0) - (f[a >> 2] | 0)) | 0
				return (2 ? a >> 2 : a) | 0
			}
			function xe(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0
				c = f[a >> 2] | 0
				d = f[(a + 4) >> 2] | 0
				a = (b + (1 ? d >> 1 : d)) | 0
				if (!(d & 1)) {
					d = c
					d = mc[d & 15](a) | 0
					return d | 0
				} else {
					d = f[((f[a >> 2] | 0) + c) >> 2] | 0
					d = mc[d & 15](a) | 0
					return d | 0
				}
				return 0
			}
			function ye(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0
				g = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				d = g
				e = f[b >> 2] | 0
				b = ((f[(b + 4) >> 2] | 0) - e) | 0
				if ((2 ? b >> 2 : b) >>> 0 <= c >>> 0) {
					e = 1
					f[a >> 2] = e
					t = g
					return
				}
				f[d >> 2] = f[(e + (c << 2)) >> 2]
				e = fb(7408, d | 0) | 0
				f[a >> 2] = e
				t = g
				return
			}
			function ze(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0
				d = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				e = d
				tc[f[a >> 2] & 7](e, b, c)
				db(f[e >> 2] | 0)
				c = f[e >> 2] | 0
				cb(c | 0)
				t = d
				return c | 0
			}
			function Ae(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				f[((f[a >> 2] | 0) + (b << 2)) >> 2] = f[c >> 2]
				return 1
			}
			function Be(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0
				e = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				g = e
				a = f[a >> 2] | 0
				f[g >> 2] = d
				d = oc[a & 15](b, c, g) | 0
				t = e
				return d | 0
			}
			function Ce(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0
				m = (a + 8) | 0
				e = f[m >> 2] | 0
				n = (a + 4) | 0
				d = f[n >> 2] | 0
				l = (e - d) | 0
				g = d
				if ((2 ? l >> 2 : l) >>> 0 >= b >>> 0) {
					d = b
					e = g
					while (1) {
						f[e >> 2] = f[c >> 2]
						d = (d + -1) | 0
						if (!d) break
						else e = (e + 4) | 0
					}
					f[n >> 2] = g + (b << 2)
					return
				}
				l = f[a >> 2] | 0
				k = (d - l) | 0
				g = 2 ? k >> 2 : k
				d = (g + b) | 0
				if (d >>> 0 > 1073741823) Vf(a)
				i = (e - l) | 0
				j = 1 ? i >> 1 : i
				d = (2 ? i >> 2 : i) >>> 0 < 536870911 ? (j >>> 0 < d >>> 0 ? d : j) : 1073741823
				do
					if (d)
						if (d >>> 0 > 1073741823) {
							n = Fa(8) | 0
							Tf(n, 8688)
							f[n >> 2] = 8224
							Ia(n | 0, 7264, 6)
						} else {
							j = Pf(d << 2) | 0
							i = j
							break
						}
					else {
						i = 0
						j = 0
					}
				while (0)
				h = (i + (g << 2)) | 0
				e = (i + (d << 2)) | 0
				d = b
				g = h
				while (1) {
					f[g >> 2] = f[c >> 2]
					d = (d + -1) | 0
					if (!d) break
					else g = (g + 4) | 0
				}
				if ((k | 0) > 0) $g(j | 0, l | 0, k | 0) | 0
				f[a >> 2] = i
				f[n >> 2] = h + (b << 2)
				f[m >> 2] = e
				if (!l) return
				Qf(l)
				return
			}
			function De(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0
				i = (a + 4) | 0
				j = f[a >> 2] | 0
				k = ((f[i >> 2] | 0) - j) | 0
				g = 2 ? k >> 2 : k
				c = (g + 1) | 0
				if (c >>> 0 > 1073741823) Vf(a)
				l = (a + 8) | 0
				e = ((f[l >> 2] | 0) - j) | 0
				h = 1 ? e >> 1 : e
				h = (2 ? e >> 2 : e) >>> 0 < 536870911 ? (h >>> 0 < c >>> 0 ? c : h) : 1073741823
				do
					if (h)
						if (h >>> 0 > 1073741823) {
							l = Fa(8) | 0
							Tf(l, 8688)
							f[l >> 2] = 8224
							Ia(l | 0, 7264, 6)
						} else {
							e = Pf(h << 2) | 0
							d = e
							break
						}
					else {
						d = 0
						e = 0
					}
				while (0)
				c = (d + (g << 2)) | 0
				f[c >> 2] = f[b >> 2]
				if ((k | 0) > 0) $g(e | 0, j | 0, k | 0) | 0
				f[a >> 2] = d
				f[i >> 2] = c + 4
				f[l >> 2] = d + (h << 2)
				if (!j) return
				Qf(j)
				return
			}
			function Ee(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0
				k = c
				h = b
				g = (k - h) | 0
				e = 1 ? g >> 1 : g
				i = (a + 8) | 0
				d = f[i >> 2] | 0
				l = f[a >> 2] | 0
				m = (d - l) | 0
				j = l
				if (e >>> 0 <= (1 ? m >> 1 : m) >>> 0) {
					g = (a + 4) | 0
					a = ((f[g >> 2] | 0) - l) | 0
					a = 1 ? a >> 1 : a
					e = e >>> 0 > a >>> 0
					a = e ? (b + (a << 1)) | 0 : c
					c = a
					d = (c - h) | 0
					if (d | 0) ah(l | 0, b | 0, d | 0) | 0
					if (!e) {
						f[g >> 2] = j + ((1 ? d >> 1 : d) << 1)
						return
					}
					d = (k - c) | 0
					if ((d | 0) <= 0) return
					$g(f[g >> 2] | 0, a | 0, d | 0) | 0
					f[g >> 2] = (f[g >> 2] | 0) + ((1 ? d >>> 1 : d) << 1)
					return
				}
				if (l) {
					d = (a + 4) | 0
					f[d >> 2] = l
					Qf(l)
					f[i >> 2] = 0
					f[d >> 2] = 0
					f[a >> 2] = 0
					d = 0
				}
				if ((g | 0) < 0) Vf(a)
				e = (1 ? d >> 1 : d) >>> 0 < 1073741823 ? (d >>> 0 < e >>> 0 ? e : d) : 2147483647
				if ((e | 0) < 0) Vf(a)
				d = Pf(e << 1) | 0
				c = (a + 4) | 0
				f[c >> 2] = d
				f[a >> 2] = d
				f[i >> 2] = d + (e << 1)
				if ((g | 0) <= 0) return
				$g(d | 0, b | 0, g | 0) | 0
				f[c >> 2] = d + ((1 ? g >>> 1 : g) << 1)
				return
			}
			function Fe() {
				Ge(0)
				return
			}
			function Ge(a) {
				a = a | 0
				bb(7328, 9199)
				Sa(7344, 9204, 1, 1, 0)
				Za(7352, 9209, 1, -128, 127)
				Za(7368, 9214, 1, -128, 127)
				Za(7360, 9226, 1, 0, 255)
				Za(7376, 9240, 2, -32768, 32767)
				Za(7400, 9246, 2, 0, 65535)
				Za(7408, 9261, 4, -2147483648, 2147483647)
				Za(7416, 9265, 4, 0, -1)
				Za(7424, 9278, 4, -2147483648, 2147483647)
				Za(7432, 9283, 4, 0, -1)
				Xa(7440, 9297, 4)
				Xa(7448, 9303, 8)
				$a(7008, 9310)
				$a(7032, 9322)
				ab(7056, 4, 9355)
				Wa(6888, 9368)
				_a(7080, 0, 9384)
				_a(7088, 0, 9414)
				_a(7096, 1, 9451)
				_a(7104, 2, 9490)
				_a(7112, 3, 9521)
				_a(7120, 4, 9561)
				_a(7128, 5, 9590)
				_a(7136, 4, 9628)
				_a(7144, 5, 9658)
				_a(7088, 0, 9697)
				_a(7096, 1, 9729)
				_a(7104, 2, 9762)
				_a(7112, 3, 9795)
				_a(7120, 4, 9829)
				_a(7128, 5, 9862)
				_a(7152, 6, 9896)
				_a(7160, 7, 9927)
				_a(7168, 7, 9959)
				return
			}
			function He(a) {
				a = a | 0
				return Ff(f[(a + 4) >> 2] | 0) | 0
			}
			function Ie(a) {
				a = a | 0
				var b = 0,
					c = 0
				b = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				c = b
				a = Ne(f[(a + 60) >> 2] | 0) | 0
				f[c >> 2] = a
				a = Le(Qa(6, c | 0) | 0) | 0
				t = b
				return a | 0
			}
			function Je(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0
				m = t
				t = (t + 48) | 0
				if ((t | 0) >= (u | 0)) da(48)
				k = (m + 32) | 0
				g = (m + 16) | 0
				e = m
				i = (a + 28) | 0
				d = f[i >> 2] | 0
				f[e >> 2] = d
				j = (a + 20) | 0
				d = ((f[j >> 2] | 0) - d) | 0
				f[(e + 4) >> 2] = d
				f[(e + 8) >> 2] = b
				f[(e + 12) >> 2] = c
				d = (d + c) | 0
				h = (a + 60) | 0
				f[g >> 2] = f[h >> 2]
				f[(g + 4) >> 2] = e
				f[(g + 8) >> 2] = 2
				g = Le(Oa(146, g | 0) | 0) | 0
				a: do
					if ((d | 0) != (g | 0)) {
						b = 2
						while (1) {
							if ((g | 0) < 0) break
							d = (d - g) | 0
							o = f[(e + 4) >> 2] | 0
							n = g >>> 0 > o >>> 0
							e = n ? (e + 8) | 0 : e
							b = (b + ((n << 31) >> 31)) | 0
							o = (g - (n ? o : 0)) | 0
							f[e >> 2] = (f[e >> 2] | 0) + o
							n = (e + 4) | 0
							f[n >> 2] = (f[n >> 2] | 0) - o
							f[k >> 2] = f[h >> 2]
							f[(k + 4) >> 2] = e
							f[(k + 8) >> 2] = b
							g = Le(Oa(146, k | 0) | 0) | 0
							if ((d | 0) == (g | 0)) {
								l = 3
								break a
							}
						}
						f[(a + 16) >> 2] = 0
						f[i >> 2] = 0
						f[j >> 2] = 0
						f[a >> 2] = f[a >> 2] | 32
						if ((b | 0) == 2) c = 0
						else c = (c - (f[(e + 4) >> 2] | 0)) | 0
					} else l = 3
				while (0)
				if ((l | 0) == 3) {
					o = f[(a + 44) >> 2] | 0
					f[(a + 16) >> 2] = o + (f[(a + 48) >> 2] | 0)
					f[i >> 2] = o
					f[j >> 2] = o
				}
				t = m
				return c | 0
			}
			function Ke(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0
				e = t
				t = (t + 32) | 0
				if ((t | 0) >= (u | 0)) da(32)
				g = e
				d = (e + 20) | 0
				f[g >> 2] = f[(a + 60) >> 2]
				f[(g + 4) >> 2] = 0
				f[(g + 8) >> 2] = b
				f[(g + 12) >> 2] = d
				f[(g + 16) >> 2] = c
				if ((Le(Na(140, g | 0) | 0) | 0) < 0) {
					f[d >> 2] = -1
					a = -1
				} else a = f[d >> 2] | 0
				t = e
				return a | 0
			}
			function Le(a) {
				a = a | 0
				var b = 0
				if (a >>> 0 > 4294963200) {
					b = Me() | 0
					f[b >> 2] = 0 - a
					a = -1
				}
				return a | 0
			}
			function Me() {
				return 71176
			}
			function Ne(a) {
				a = a | 0
				return a | 0
			}
			function Oe(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0
				g = t
				t = (t + 32) | 0
				if ((t | 0) >= (u | 0)) da(32)
				e = g
				f[(a + 36) >> 2] = 1
				if (
					((f[a >> 2] & 64) | 0) == 0
						? ((f[e >> 2] = f[(a + 60) >> 2]),
							(f[(e + 4) >> 2] = 21523),
							(f[(e + 8) >> 2] = g + 16),
							Pa(54, e | 0) | 0)
						: 0
				)
					b[(a + 75) >> 0] = -1
				e = Je(a, c, d) | 0
				t = g
				return e | 0
			}
			function Pe(a, c) {
				a = a | 0
				c = c | 0
				var d = 0,
					e = 0
				d = b[a >> 0] | 0
				e = b[c >> 0] | 0
				if ((d << 24) >> 24 == 0 ? 1 : (d << 24) >> 24 != (e << 24) >> 24) a = e
				else {
					do {
						a = (a + 1) | 0
						c = (c + 1) | 0
						d = b[a >> 0] | 0
						e = b[c >> 0] | 0
					} while (!((d << 24) >> 24 == 0 ? 1 : (d << 24) >> 24 != (e << 24) >> 24))
					a = e
				}
				return ((d & 255) - (a & 255)) | 0
			}
			function Qe(a) {
				a = a | 0
				return (((a + -48) | 0) >>> 0 < 10) | 0
			}
			function Re(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0,
					q = 0,
					r = 0
				r = t
				t = (t + 224) | 0
				if ((t | 0) >= (u | 0)) da(224)
				m = (r + 208) | 0
				o = (r + 160) | 0
				p = (r + 80) | 0
				q = r
				e = o
				g = (e + 40) | 0
				do {
					f[e >> 2] = 0
					e = (e + 4) | 0
				} while ((e | 0) < (g | 0))
				f[m >> 2] = f[d >> 2]
				if ((Se(0, c, m, p, o) | 0) < 0) d = -1
				else {
					if ((f[(a + 76) >> 2] | 0) > -1) n = Te(a) | 0
					else n = 0
					d = f[a >> 2] | 0
					l = d & 32
					if ((b[(a + 74) >> 0] | 0) < 1) f[a >> 2] = d & -33
					e = (a + 48) | 0
					if (!(f[e >> 2] | 0)) {
						g = (a + 44) | 0
						h = f[g >> 2] | 0
						f[g >> 2] = q
						i = (a + 28) | 0
						f[i >> 2] = q
						j = (a + 20) | 0
						f[j >> 2] = q
						f[e >> 2] = 80
						k = (a + 16) | 0
						f[k >> 2] = q + 80
						d = Se(a, c, m, p, o) | 0
						if (h) {
							oc[f[(a + 36) >> 2] & 15](a, 0, 0) | 0
							d = (f[j >> 2] | 0) == 0 ? -1 : d
							f[g >> 2] = h
							f[e >> 2] = 0
							f[k >> 2] = 0
							f[i >> 2] = 0
							f[j >> 2] = 0
						}
					} else d = Se(a, c, m, p, o) | 0
					e = f[a >> 2] | 0
					f[a >> 2] = e | l
					if (n | 0) Ue(a)
					d = ((e & 32) | 0) == 0 ? d : -1
				}
				t = r
				return d | 0
			}
			function Se(a, c, e, g, h) {
				a = a | 0
				c = c | 0
				e = e | 0
				g = g | 0
				h = h | 0
				var i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					q = 0,
					r = 0,
					s = 0,
					v = 0,
					w = 0,
					x = 0,
					y = 0,
					z = 0,
					A = 0,
					B = 0,
					C = 0,
					D = 0,
					E = 0,
					F = 0,
					G = 0,
					H = 0,
					I = 0
				I = t
				t = (t + 64) | 0
				if ((t | 0) >= (u | 0)) da(64)
				D = (I + 56) | 0
				E = (I + 40) | 0
				A = I
				G = (I + 48) | 0
				H = (I + 60) | 0
				f[D >> 2] = c
				x = (a | 0) != 0
				y = (A + 40) | 0
				z = y
				A = (A + 39) | 0
				B = (G + 4) | 0
				i = 0
				c = 0
				k = 0
				a: while (1) {
					do {
						do
							if ((c | 0) > -1)
								if ((i | 0) > ((2147483647 - c) | 0)) {
									c = Me() | 0
									f[c >> 2] = 75
									c = -1
									break
								} else {
									c = (i + c) | 0
									break
								}
						while (0)
						r = f[D >> 2] | 0
						i = b[r >> 0] | 0
						if (!((i << 24) >> 24)) {
							w = 94
							break a
						}
						j = r
						b: while (1) {
							switch ((i << 24) >> 24) {
								case 37: {
									w = 10
									break b
								}
								case 0: {
									i = j
									break b
								}
								default: {
								}
							}
							v = (j + 1) | 0
							f[D >> 2] = v
							i = b[v >> 0] | 0
							j = v
						}
						c: do
							if ((w | 0) == 10) {
								w = 0
								i = j
								do {
									if ((b[(j + 1) >> 0] | 0) != 37) break c
									i = (i + 1) | 0
									j = (j + 2) | 0
									f[D >> 2] = j
								} while ((b[j >> 0] | 0) == 37)
							}
						while (0)
						i = (i - r) | 0
						if (x) Ve(a, r, i)
					} while ((i | 0) != 0)
					v = (Qe(b[((f[D >> 2] | 0) + 1) >> 0] | 0) | 0) == 0
					j = f[D >> 2] | 0
					if (!v ? (b[(j + 2) >> 0] | 0) == 36 : 0) {
						o = ((b[(j + 1) >> 0] | 0) + -48) | 0
						m = 1
						i = 3
					} else {
						o = -1
						m = k
						i = 1
					}
					i = (j + i) | 0
					f[D >> 2] = i
					j = b[i >> 0] | 0
					k = (((j << 24) >> 24) + -32) | 0
					if ((k >>> 0 > 31) | ((((1 << k) & 75913) | 0) == 0)) l = 0
					else {
						l = 0
						do {
							l = (1 << k) | l
							i = (i + 1) | 0
							f[D >> 2] = i
							j = b[i >> 0] | 0
							k = (((j << 24) >> 24) + -32) | 0
						} while (!((k >>> 0 > 31) | ((((1 << k) & 75913) | 0) == 0)))
					}
					if ((j << 24) >> 24 == 42) {
						if (
							(Qe(b[(i + 1) >> 0] | 0) | 0) != 0
								? ((F = f[D >> 2] | 0), (b[(F + 2) >> 0] | 0) == 36)
								: 0
						) {
							i = (F + 1) | 0
							f[(h + (((b[i >> 0] | 0) + -48) << 2)) >> 2] = 10
							i = f[(g + (((b[i >> 0] | 0) + -48) << 3)) >> 2] | 0
							k = 1
							j = (F + 3) | 0
						} else {
							if (m | 0) {
								c = -1
								break
							}
							if (x) {
								v = ((f[e >> 2] | 0) + (4 - 1)) & ~(4 - 1)
								i = f[v >> 2] | 0
								f[e >> 2] = v + 4
							} else i = 0
							k = 0
							j = ((f[D >> 2] | 0) + 1) | 0
						}
						f[D >> 2] = j
						v = (i | 0) < 0
						s = v ? (0 - i) | 0 : i
						l = v ? l | 8192 : l
						v = k
					} else {
						i = We(D) | 0
						if ((i | 0) < 0) {
							c = -1
							break
						}
						s = i
						v = m
						j = f[D >> 2] | 0
					}
					do
						if ((b[j >> 0] | 0) == 46) {
							i = (j + 1) | 0
							if ((b[i >> 0] | 0) != 42) {
								f[D >> 2] = i
								i = We(D) | 0
								j = f[D >> 2] | 0
								break
							}
							if (
								Qe(b[(j + 2) >> 0] | 0) | 0 ? ((C = f[D >> 2] | 0), (b[(C + 3) >> 0] | 0) == 36) : 0
							) {
								i = (C + 2) | 0
								f[(h + (((b[i >> 0] | 0) + -48) << 2)) >> 2] = 10
								i = f[(g + (((b[i >> 0] | 0) + -48) << 3)) >> 2] | 0
								j = (C + 4) | 0
								f[D >> 2] = j
								break
							}
							if (v | 0) {
								c = -1
								break a
							}
							if (x) {
								q = ((f[e >> 2] | 0) + (4 - 1)) & ~(4 - 1)
								i = f[q >> 2] | 0
								f[e >> 2] = q + 4
							} else i = 0
							j = ((f[D >> 2] | 0) + 2) | 0
							f[D >> 2] = j
						} else i = -1
					while (0)
					q = 0
					while (1) {
						if ((((b[j >> 0] | 0) + -65) | 0) >>> 0 > 57) {
							c = -1
							break a
						}
						k = j
						j = (j + 1) | 0
						f[D >> 2] = j
						k = b[((b[k >> 0] | 0) + -65 + (4400 + ((q * 58) | 0))) >> 0] | 0
						m = k & 255
						if (((m + -1) | 0) >>> 0 >= 8) break
						else q = m
					}
					if (!((k << 24) >> 24)) {
						c = -1
						break
					}
					n = (o | 0) > -1
					do
						if ((k << 24) >> 24 == 19)
							if (n) {
								c = -1
								break a
							} else w = 54
						else {
							if (n) {
								f[(h + (o << 2)) >> 2] = m
								n = (g + (o << 3)) | 0
								o = f[(n + 4) >> 2] | 0
								w = E
								f[w >> 2] = f[n >> 2]
								f[(w + 4) >> 2] = o
								w = 54
								break
							}
							if (!x) {
								c = 0
								break a
							}
							Xe(E, m, e)
							j = f[D >> 2] | 0
							w = 55
						}
					while (0)
					if ((w | 0) == 54) {
						w = 0
						if (x) w = 55
						else i = 0
					}
					d: do
						if ((w | 0) == 55) {
							w = 0
							j = b[(j + -1) >> 0] | 0
							j = ((q | 0) != 0) & (((j & 15) | 0) == 3) ? j & -33 : j
							k = l & -65537
							o = ((l & 8192) | 0) == 0 ? l : k
							e: do
								switch (j | 0) {
									case 110:
										switch (((q & 255) << 24) >> 24) {
											case 0: {
												f[f[E >> 2] >> 2] = c
												i = 0
												break d
											}
											case 1: {
												f[f[E >> 2] >> 2] = c
												i = 0
												break d
											}
											case 2: {
												i = f[E >> 2] | 0
												f[i >> 2] = c
												f[(i + 4) >> 2] = (((c | 0) < 0) << 31) >> 31
												i = 0
												break d
											}
											case 3: {
												d[f[E >> 2] >> 1] = c
												i = 0
												break d
											}
											case 4: {
												b[f[E >> 2] >> 0] = c
												i = 0
												break d
											}
											case 6: {
												f[f[E >> 2] >> 2] = c
												i = 0
												break d
											}
											case 7: {
												i = f[E >> 2] | 0
												f[i >> 2] = c
												f[(i + 4) >> 2] = (((c | 0) < 0) << 31) >> 31
												i = 0
												break d
											}
											default: {
												i = 0
												break d
											}
										}
									case 112: {
										j = 120
										i = i >>> 0 > 8 ? i : 8
										k = o | 8
										w = 67
										break
									}
									case 88:
									case 120: {
										k = o
										w = 67
										break
									}
									case 111: {
										k = E
										j = f[k >> 2] | 0
										k = f[(k + 4) >> 2] | 0
										n = Ze(j, k, y) | 0
										w = (z - n) | 0
										l = 0
										m = 10595
										i = (((o & 8) | 0) == 0) | ((i | 0) > (w | 0)) ? i : (w + 1) | 0
										w = 73
										break
									}
									case 105:
									case 100: {
										k = E
										j = f[k >> 2] | 0
										k = f[(k + 4) >> 2] | 0
										if ((k | 0) < 0) {
											j = Ug(0, 0, j | 0, k | 0) | 0
											k = ba() | 0
											l = E
											f[l >> 2] = j
											f[(l + 4) >> 2] = k
											l = 1
											m = 10595
											w = 72
											break e
										} else {
											l = (((o & 2049) | 0) != 0) & 1
											m = ((o & 2048) | 0) == 0 ? (((o & 1) | 0) == 0 ? 10595 : 10597) : 10596
											w = 72
											break e
										}
									}
									case 117: {
										k = E
										l = 0
										m = 10595
										j = f[k >> 2] | 0
										k = f[(k + 4) >> 2] | 0
										w = 72
										break
									}
									case 99: {
										b[A >> 0] = f[E >> 2]
										q = A
										l = 0
										m = 10595
										n = 1
										i = z
										break
									}
									case 109: {
										j = Me() | 0
										j = $e(f[j >> 2] | 0) | 0
										w = 77
										break
									}
									case 115: {
										j = f[E >> 2] | 0
										j = (j | 0) == 0 ? 10605 : j
										w = 77
										break
									}
									case 67: {
										f[G >> 2] = f[E >> 2]
										f[B >> 2] = 0
										f[E >> 2] = G
										m = -1
										w = 81
										break
									}
									case 83: {
										if (!i) {
											bf(a, 32, s, 0, o)
											i = 0
											w = 91
										} else {
											m = i
											w = 81
										}
										break
									}
									case 65:
									case 71:
									case 70:
									case 69:
									case 97:
									case 103:
									case 102:
									case 101: {
										i = df(a, +p[E >> 3], s, i, o, j) | 0
										break d
									}
									default: {
										q = r
										l = 0
										m = 10595
										n = i
										k = o
										i = z
									}
								}
							while (0)
							f: do
								if ((w | 0) == 67) {
									r = E
									q = f[r >> 2] | 0
									r = f[(r + 4) >> 2] | 0
									n = Ye(q, r, y, j & 32) | 0
									m = (((k & 8) | 0) == 0) | (((q | 0) == 0) & ((r | 0) == 0))
									l = m ? 0 : 2
									m = m ? 10595 : (10595 + (4 ? j >>> 4 : j)) | 0
									o = k
									j = q
									k = r
									w = 73
								} else if ((w | 0) == 72) {
									n = _e(j, k, y) | 0
									w = 73
								} else if ((w | 0) == 77) {
									w = 0
									r = af(j, 0, i) | 0
									o = (r | 0) == 0
									q = j
									l = 0
									m = 10595
									n = o ? i : (r - j) | 0
									i = o ? (j + i) | 0 : r
								} else if ((w | 0) == 81) {
									w = 0
									l = f[E >> 2] | 0
									i = 0
									while (1) {
										j = f[l >> 2] | 0
										if (!j) break
										j = cf(H, j) | 0
										k = (j | 0) < 0
										if (k | (j >>> 0 > ((m - i) | 0) >>> 0)) {
											w = 85
											break
										}
										i = (j + i) | 0
										if (m >>> 0 > i >>> 0) l = (l + 4) | 0
										else break
									}
									if ((w | 0) == 85) {
										w = 0
										if (k) {
											c = -1
											break a
										}
									}
									bf(a, 32, s, i, o)
									if (!i) {
										i = 0
										w = 91
									} else {
										k = f[E >> 2] | 0
										l = 0
										while (1) {
											j = f[k >> 2] | 0
											if (!j) {
												w = 91
												break f
											}
											j = cf(H, j) | 0
											l = (j + l) | 0
											if ((l | 0) > (i | 0)) {
												w = 91
												break f
											}
											Ve(a, H, j)
											if (l >>> 0 >= i >>> 0) {
												w = 91
												break
											} else k = (k + 4) | 0
										}
									}
								}
							while (0)
							if ((w | 0) == 73) {
								w = 0
								k = ((j | 0) != 0) | ((k | 0) != 0)
								r = ((i | 0) != 0) | k
								k = (z - n + ((k ^ 1) & 1)) | 0
								q = r ? n : y
								n = r ? ((i | 0) > (k | 0) ? i : k) : 0
								k = (i | 0) > -1 ? o & -65537 : o
								i = z
							} else if ((w | 0) == 91) {
								w = 0
								bf(a, 32, s, i, o ^ 8192)
								i = (s | 0) > (i | 0) ? s : i
								break
							}
							o = (i - q) | 0
							n = (n | 0) < (o | 0) ? o : n
							r = (n + l) | 0
							i = (s | 0) < (r | 0) ? r : s
							bf(a, 32, i, r, k)
							Ve(a, m, l)
							bf(a, 48, i, r, k ^ 65536)
							bf(a, 48, n, o, 0)
							Ve(a, q, o)
							bf(a, 32, i, r, k ^ 8192)
						}
					while (0)
					k = v
				}
				g: do
					if ((w | 0) == 94)
						if (!a)
							if (!k) c = 0
							else {
								c = 1
								while (1) {
									i = f[(h + (c << 2)) >> 2] | 0
									if (!i) break
									Xe((g + (c << 3)) | 0, i, e)
									c = (c + 1) | 0
									if (c >>> 0 >= 10) {
										c = 1
										break g
									}
								}
								while (1) {
									if (f[(h + (c << 2)) >> 2] | 0) {
										c = -1
										break g
									}
									c = (c + 1) | 0
									if (c >>> 0 >= 10) {
										c = 1
										break
									}
								}
							}
				while (0)
				t = I
				return c | 0
			}
			function Te(a) {
				a = a | 0
				return 1
			}
			function Ue(a) {
				a = a | 0
				return
			}
			function Ve(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				if (!(f[a >> 2] & 32)) rf(b, c, a) | 0
				return
			}
			function We(a) {
				a = a | 0
				var c = 0,
					d = 0
				if (!(Qe(b[f[a >> 2] >> 0] | 0) | 0)) c = 0
				else {
					c = 0
					do {
						d = f[a >> 2] | 0
						c = (((c * 10) | 0) + -48 + (b[d >> 0] | 0)) | 0
						d = (d + 1) | 0
						f[a >> 2] = d
					} while ((Qe(b[d >> 0] | 0) | 0) != 0)
				}
				return c | 0
			}
			function Xe(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0.0
				a: do
					if (b >>> 0 <= 20)
						do
							switch (b | 0) {
								case 9: {
									d = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									b = f[d >> 2] | 0
									f[c >> 2] = d + 4
									f[a >> 2] = b
									break a
								}
								case 10: {
									d = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									b = f[d >> 2] | 0
									f[c >> 2] = d + 4
									d = a
									f[d >> 2] = b
									f[(d + 4) >> 2] = (((b | 0) < 0) << 31) >> 31
									break a
								}
								case 11: {
									d = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									b = f[d >> 2] | 0
									f[c >> 2] = d + 4
									d = a
									f[d >> 2] = b
									f[(d + 4) >> 2] = 0
									break a
								}
								case 12: {
									d = ((f[c >> 2] | 0) + (8 - 1)) & ~(8 - 1)
									b = d
									e = f[b >> 2] | 0
									b = f[(b + 4) >> 2] | 0
									f[c >> 2] = d + 8
									d = a
									f[d >> 2] = e
									f[(d + 4) >> 2] = b
									break a
								}
								case 13: {
									e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									d = f[e >> 2] | 0
									f[c >> 2] = e + 4
									d = ((d & 65535) << 16) >> 16
									e = a
									f[e >> 2] = d
									f[(e + 4) >> 2] = (((d | 0) < 0) << 31) >> 31
									break a
								}
								case 14: {
									e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									d = f[e >> 2] | 0
									f[c >> 2] = e + 4
									e = a
									f[e >> 2] = d & 65535
									f[(e + 4) >> 2] = 0
									break a
								}
								case 15: {
									e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									d = f[e >> 2] | 0
									f[c >> 2] = e + 4
									d = ((d & 255) << 24) >> 24
									e = a
									f[e >> 2] = d
									f[(e + 4) >> 2] = (((d | 0) < 0) << 31) >> 31
									break a
								}
								case 16: {
									e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1)
									d = f[e >> 2] | 0
									f[c >> 2] = e + 4
									e = a
									f[e >> 2] = d & 255
									f[(e + 4) >> 2] = 0
									break a
								}
								case 17: {
									e = ((f[c >> 2] | 0) + (8 - 1)) & ~(8 - 1)
									g = +p[e >> 3]
									f[c >> 2] = e + 8
									p[a >> 3] = g
									break a
								}
								case 18: {
									e = ((f[c >> 2] | 0) + (8 - 1)) & ~(8 - 1)
									g = +p[e >> 3]
									f[c >> 2] = e + 8
									p[a >> 3] = g
									break a
								}
								default:
									break a
							}
						while (0)
				while (0)
				return
			}
			function Ye(a, c, d, e) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				if (!(((a | 0) == 0) & ((c | 0) == 0)))
					do {
						d = (d + -1) | 0
						b[d >> 0] = h[(4864 + (a & 15)) >> 0] | 0 | e
						a = Yg(a | 0, c | 0, 4) | 0
						c = ba() | 0
					} while (!(((a | 0) == 0) & ((c | 0) == 0)))
				return d | 0
			}
			function Ze(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				if (!(((a | 0) == 0) & ((c | 0) == 0)))
					do {
						d = (d + -1) | 0
						b[d >> 0] = (a & 7) | 48
						a = Yg(a | 0, c | 0, 3) | 0
						c = ba() | 0
					} while (!(((a | 0) == 0) & ((c | 0) == 0)))
				return d | 0
			}
			function _e(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					f = 0,
					g = 0
				if ((c >>> 0 > 0) | (((c | 0) == 0) & (a >>> 0 > 4294967295))) {
					do {
						e = a
						a = Xg(a | 0, c | 0, 10, 0) | 0
						f = c
						c = ba() | 0
						g = Sg(a | 0, c | 0, 10, 0) | 0
						g = Ug(e | 0, f | 0, g | 0, ba() | 0) | 0
						ba() | 0
						d = (d + -1) | 0
						b[d >> 0] = (g & 255) | 48
					} while ((f >>> 0 > 9) | (((f | 0) == 9) & (e >>> 0 > 4294967295)))
					c = a
				} else c = a
				if (c)
					do {
						g = c
						c = ((c >>> 0) / 10) | 0
						d = (d + -1) | 0
						b[d >> 0] = (g - ((c * 10) | 0)) | 48
					} while (g >>> 0 >= 10)
				return d | 0
			}
			function $e(a) {
				a = a | 0
				var b = 0
				b = ((lf() | 0) + 188) | 0
				return mf(a, f[b >> 2] | 0) | 0
			}
			function af(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0
				h = c & 255
				e = (d | 0) != 0
				a: do
					if (e & (((a & 3) | 0) != 0)) {
						g = c & 255
						while (1) {
							if ((b[a >> 0] | 0) == (g << 24) >> 24) {
								i = 6
								break a
							}
							a = (a + 1) | 0
							d = (d + -1) | 0
							e = (d | 0) != 0
							if (!(e & (((a & 3) | 0) != 0))) {
								i = 5
								break
							}
						}
					} else i = 5
				while (0)
				if ((i | 0) == 5)
					if (e) i = 6
					else i = 16
				b: do
					if ((i | 0) == 6) {
						g = c & 255
						if ((b[a >> 0] | 0) == (g << 24) >> 24)
							if (!d) {
								i = 16
								break
							} else break
						e = U(h, 16843009) | 0
						c: do
							if (d >>> 0 > 3)
								while (1) {
									h = f[a >> 2] ^ e
									if ((((h & -2139062144) ^ -2139062144) & (h + -16843009)) | 0) break c
									a = (a + 4) | 0
									d = (d + -4) | 0
									if (d >>> 0 <= 3) {
										i = 11
										break
									}
								}
							else i = 11
						while (0)
						if ((i | 0) == 11)
							if (!d) {
								i = 16
								break
							}
						while (1) {
							if ((b[a >> 0] | 0) == (g << 24) >> 24) break b
							d = (d + -1) | 0
							if (!d) {
								i = 16
								break
							} else a = (a + 1) | 0
						}
					}
				while (0)
				if ((i | 0) == 16) a = 0
				return a | 0
			}
			function bf(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				var f = 0,
					g = 0
				g = t
				t = (t + 256) | 0
				if ((t | 0) >= (u | 0)) da(256)
				f = g
				if (((c | 0) > (d | 0)) & (((e & 73728) | 0) == 0)) {
					e = (c - d) | 0
					bh(f | 0, ((b << 24) >> 24) | 0, (e >>> 0 < 256 ? e : 256) | 0) | 0
					if (e >>> 0 > 255) {
						b = (c - d) | 0
						do {
							Ve(a, f, 256)
							e = (e + -256) | 0
						} while (e >>> 0 > 255)
						e = b & 255
					}
					Ve(a, f, e)
				}
				t = g
				return
			}
			function cf(a, b) {
				a = a | 0
				b = b | 0
				if (!a) a = 0
				else a = hf(a, b, 0) | 0
				return a | 0
			}
			function df(a, c, d, e, g, i) {
				a = a | 0
				c = +c
				d = d | 0
				e = e | 0
				g = g | 0
				i = i | 0
				var j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0,
					q = 0.0,
					r = 0,
					s = 0,
					v = 0,
					w = 0,
					x = 0,
					y = 0,
					z = 0,
					A = 0,
					B = 0,
					C = 0,
					D = 0,
					E = 0,
					F = 0,
					G = 0,
					H = 0
				H = t
				t = (t + 560) | 0
				if ((t | 0) >= (u | 0)) da(560)
				l = (H + 32) | 0
				w = (H + 536) | 0
				G = H
				F = G
				m = (H + 540) | 0
				f[w >> 2] = 0
				E = (m + 12) | 0
				ef(c) | 0
				j = ba() | 0
				if ((j | 0) < 0) {
					c = -c
					ef(c) | 0
					D = 1
					C = 10612
					j = ba() | 0
				} else {
					D = (((g & 2049) | 0) != 0) & 1
					C = ((g & 2048) | 0) == 0 ? (((g & 1) | 0) == 0 ? 10613 : 10618) : 10615
				}
				do
					if ((0 == 0) & (((j & 2146435072) | 0) == 2146435072)) {
						G = ((i & 32) | 0) != 0
						j = (D + 3) | 0
						bf(a, 32, d, j, g & -65537)
						Ve(a, C, D)
						Ve(a, (c != c) | (0.0 != 0.0) ? (G ? 10639 : 10643) : G ? 10631 : 10635, 3)
						bf(a, 32, d, j, g ^ 8192)
					} else {
						q = +ff(c, w) * 2.0
						j = q != 0.0
						if (j) f[w >> 2] = (f[w >> 2] | 0) + -1
						v = i | 32
						if ((v | 0) == 97) {
							o = i & 32
							r = (o | 0) == 0 ? C : (C + 9) | 0
							p = D | 2
							j = (12 - e) | 0
							do
								if (!((e >>> 0 > 11) | ((j | 0) == 0))) {
									c = 8.0
									do {
										j = (j + -1) | 0
										c = c * 16.0
									} while ((j | 0) != 0)
									if ((b[r >> 0] | 0) == 45) {
										c = -(c + (-q - c))
										break
									} else {
										c = q + c - c
										break
									}
								} else c = q
							while (0)
							k = f[w >> 2] | 0
							j = (k | 0) < 0 ? (0 - k) | 0 : k
							j = _e(j, (((j | 0) < 0) << 31) >> 31, E) | 0
							if ((j | 0) == (E | 0)) {
								j = (m + 11) | 0
								b[j >> 0] = 48
							}
							b[(j + -1) >> 0] = ((31 ? k >> 31 : k) & 2) + 43
							n = (j + -2) | 0
							b[n >> 0] = i + 15
							k = (e | 0) < 1
							l = ((g & 8) | 0) == 0
							m = G
							do {
								D = ~~c
								j = (m + 1) | 0
								b[m >> 0] = o | h[(4864 + D) >> 0]
								c = (c - +(D | 0)) * 16.0
								if (((j - F) | 0) == 1 ? !(l & (k & (c == 0.0))) : 0) {
									b[j >> 0] = 46
									m = (m + 2) | 0
								} else m = j
							} while (c != 0.0)
							if ((e | 0) != 0 ? ((-2 - F + m) | 0) < (e | 0) : 0) {
								k = E
								l = n
								j = (e + 2 + k - l) | 0
							} else {
								k = E
								l = n
								j = (k - F - l + m) | 0
							}
							E = (j + p) | 0
							bf(a, 32, d, E, g)
							Ve(a, r, p)
							bf(a, 48, d, E, g ^ 65536)
							F = (m - F) | 0
							Ve(a, G, F)
							G = (k - l) | 0
							bf(a, 48, (j - (F + G)) | 0, 0, 0)
							Ve(a, n, G)
							bf(a, 32, d, E, g ^ 8192)
							j = E
							break
						}
						k = (e | 0) < 0 ? 6 : e
						if (j) {
							j = ((f[w >> 2] | 0) + -28) | 0
							f[w >> 2] = j
							c = q * 268435456.0
						} else {
							c = q
							j = f[w >> 2] | 0
						}
						B = (j | 0) < 0 ? l : (l + 288) | 0
						l = B
						do {
							z = ~~c >>> 0
							f[l >> 2] = z
							l = (l + 4) | 0
							c = (c - +(z >>> 0)) * 1.0e9
						} while (c != 0.0)
						z = B
						if ((j | 0) > 0) {
							o = B
							while (1) {
								n = (j | 0) < 29 ? j : 29
								j = (l + -4) | 0
								if (j >>> 0 >= o >>> 0) {
									m = 0
									do {
										s = Zg(f[j >> 2] | 0, 0, n | 0) | 0
										s = Tg(s | 0, ba() | 0, m | 0, 0) | 0
										x = ba() | 0
										m = Xg(s | 0, x | 0, 1e9, 0) | 0
										y = Sg(m | 0, ba() | 0, 1e9, 0) | 0
										y = Ug(s | 0, x | 0, y | 0, ba() | 0) | 0
										ba() | 0
										f[j >> 2] = y
										j = (j + -4) | 0
									} while (j >>> 0 >= o >>> 0)
									if (m) {
										y = (o + -4) | 0
										f[y >> 2] = m
										m = y
									} else m = o
								} else m = o
								a: do
									if (l >>> 0 > m >>> 0) {
										j = l
										while (1) {
											l = (j + -4) | 0
											if (f[l >> 2] | 0) {
												l = j
												break a
											}
											if (l >>> 0 > m >>> 0) j = l
											else break
										}
									}
								while (0)
								j = ((f[w >> 2] | 0) - n) | 0
								f[w >> 2] = j
								if ((j | 0) > 0) o = m
								else break
							}
						} else m = B
						if ((j | 0) < 0) {
							e = (((((k + 25) | 0) / 9) | 0) + 1) | 0
							s = (v | 0) == 102
							do {
								r = (0 - j) | 0
								r = (r | 0) < 9 ? r : 9
								if (m >>> 0 < l >>> 0) {
									n = ((1 << r) + -1) | 0
									o = r ? 1e9 >>> r : 1e9
									p = 0
									j = m
									do {
										y = f[j >> 2] | 0
										f[j >> 2] = (r ? y >>> r : y) + p
										p = U(y & n, o) | 0
										j = (j + 4) | 0
									} while (j >>> 0 < l >>> 0)
									m = (f[m >> 2] | 0) == 0 ? (m + 4) | 0 : m
									if (p) {
										f[l >> 2] = p
										l = (l + 4) | 0
									}
								} else m = (f[m >> 2] | 0) == 0 ? (m + 4) | 0 : m
								j = s ? B : m
								y = (l - j) | 0
								l = ((2 ? y >> 2 : y) | 0) > (e | 0) ? (j + (e << 2)) | 0 : l
								j = ((f[w >> 2] | 0) + r) | 0
								f[w >> 2] = j
							} while ((j | 0) < 0)
							s = m
						} else s = m
						if (s >>> 0 < l >>> 0) {
							j = (z - s) | 0
							j = ((2 ? j >> 2 : j) * 9) | 0
							n = f[s >> 2] | 0
							if (n >>> 0 >= 10) {
								m = 10
								do {
									m = (m * 10) | 0
									j = (j + 1) | 0
								} while (n >>> 0 >= m >>> 0)
							}
						} else j = 0
						x = (v | 0) == 103
						y = (k | 0) != 0
						m = (k - ((v | 0) == 102 ? 0 : j) + (((y & x) << 31) >> 31)) | 0
						w = (l - z) | 0
						if ((m | 0) < (((((2 ? w >> 2 : w) * 9) | 0) + -9) | 0)) {
							w = (m + 9216) | 0
							m = ((w | 0) / 9) | 0
							e = (B + 4 + ((m + -1024) << 2)) | 0
							m = (w - ((m * 9) | 0)) | 0
							if ((m | 0) < 8) {
								n = 10
								while (1) {
									n = (n * 10) | 0
									if ((m | 0) < 7) m = (m + 1) | 0
									else break
								}
							} else n = 10
							p = f[e >> 2] | 0
							m = ((p >>> 0) / (n >>> 0)) | 0
							r = (p - (U(m, n) | 0)) | 0
							o = ((e + 4) | 0) == (l | 0)
							if (!(o & ((r | 0) == 0))) {
								q = ((m & 1) | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0
								w = 1 ? n >>> 1 : n
								c = r >>> 0 < w >>> 0 ? 0.5 : o & ((r | 0) == (w | 0)) ? 1.0 : 1.5
								if (D) {
									w = (b[C >> 0] | 0) == 45
									c = w ? -c : c
									q = w ? -q : q
								}
								m = (p - r) | 0
								f[e >> 2] = m
								if (q + c != q) {
									w = (m + n) | 0
									f[e >> 2] = w
									if (w >>> 0 > 999999999) {
										n = e
										j = s
										while (1) {
											m = (n + -4) | 0
											f[n >> 2] = 0
											if (m >>> 0 < j >>> 0) {
												j = (j + -4) | 0
												f[j >> 2] = 0
											}
											w = ((f[m >> 2] | 0) + 1) | 0
											f[m >> 2] = w
											if (w >>> 0 > 999999999) n = m
											else {
												n = j
												break
											}
										}
									} else {
										m = e
										n = s
									}
									j = (z - n) | 0
									j = ((2 ? j >> 2 : j) * 9) | 0
									p = f[n >> 2] | 0
									if (p >>> 0 >= 10) {
										o = 10
										do {
											o = (o * 10) | 0
											j = (j + 1) | 0
										} while (p >>> 0 >= o >>> 0)
									}
								} else {
									m = e
									n = s
								}
							} else {
								m = e
								n = s
							}
							w = (m + 4) | 0
							l = l >>> 0 > w >>> 0 ? w : l
						} else n = s
						e = (0 - j) | 0
						b: do
							if (l >>> 0 > n >>> 0)
								while (1) {
									m = (l + -4) | 0
									if (f[m >> 2] | 0) {
										w = l
										v = 1
										break b
									}
									if (m >>> 0 > n >>> 0) l = m
									else {
										w = m
										v = 0
										break
									}
								}
							else {
								w = l
								v = 0
							}
						while (0)
						do
							if (x) {
								k = (k + ((y ^ 1) & 1)) | 0
								if (((k | 0) > (j | 0)) & ((j | 0) > -5)) {
									o = (i + -1) | 0
									k = (k + -1 - j) | 0
								} else {
									o = (i + -2) | 0
									k = (k + -1) | 0
								}
								if (!(g & 8)) {
									if (v ? ((A = f[(w + -4) >> 2] | 0), (A | 0) != 0) : 0)
										if (!((A >>> 0) % 10 | 0)) {
											m = 0
											l = 10
											do {
												l = (l * 10) | 0
												m = (m + 1) | 0
											} while (!((A >>> 0) % (l >>> 0) | 0 | 0))
										} else m = 0
									else m = 9
									l = (w - z) | 0
									l = ((((2 ? l >> 2 : l) * 9) | 0) + -9) | 0
									if ((o | 32 | 0) == 102) {
										i = (l - m) | 0
										i = (i | 0) > 0 ? i : 0
										k = (k | 0) < (i | 0) ? k : i
										break
									} else {
										i = (l + j - m) | 0
										i = (i | 0) > 0 ? i : 0
										k = (k | 0) < (i | 0) ? k : i
										break
									}
								}
							} else o = i
						while (0)
						s = (k | 0) != 0
						p = s ? 1 : (3 ? g >>> 3 : g) & 1
						r = (o | 32 | 0) == 102
						if (r) {
							x = 0
							j = (j | 0) > 0 ? j : 0
						} else {
							l = (j | 0) < 0 ? e : j
							l = _e(l, (((l | 0) < 0) << 31) >> 31, E) | 0
							m = E
							if (((m - l) | 0) < 2)
								do {
									l = (l + -1) | 0
									b[l >> 0] = 48
								} while (((m - l) | 0) < 2)
							b[(l + -1) >> 0] = ((31 ? j >> 31 : j) & 2) + 43
							j = (l + -2) | 0
							b[j >> 0] = o
							x = j
							j = (m - j) | 0
						}
						j = (D + 1 + k + p + j) | 0
						bf(a, 32, d, j, g)
						Ve(a, C, D)
						bf(a, 48, d, j, g ^ 65536)
						if (r) {
							p = n >>> 0 > B >>> 0 ? B : n
							r = (G + 9) | 0
							n = r
							o = (G + 8) | 0
							m = p
							do {
								l = _e(f[m >> 2] | 0, 0, r) | 0
								if ((m | 0) == (p | 0)) {
									if ((l | 0) == (r | 0)) {
										b[o >> 0] = 48
										l = o
									}
								} else if (l >>> 0 > G >>> 0) {
									bh(G | 0, 48, (l - F) | 0) | 0
									do l = (l + -1) | 0
									while (l >>> 0 > G >>> 0)
								}
								Ve(a, l, (n - l) | 0)
								m = (m + 4) | 0
							} while (m >>> 0 <= B >>> 0)
							if (!((((g & 8) | 0) == 0) & (s ^ 1))) Ve(a, 10647, 1)
							if ((m >>> 0 < w >>> 0) & ((k | 0) > 0))
								while (1) {
									l = _e(f[m >> 2] | 0, 0, r) | 0
									if (l >>> 0 > G >>> 0) {
										bh(G | 0, 48, (l - F) | 0) | 0
										do l = (l + -1) | 0
										while (l >>> 0 > G >>> 0)
									}
									Ve(a, l, (k | 0) < 9 ? k : 9)
									m = (m + 4) | 0
									l = (k + -9) | 0
									if (!((m >>> 0 < w >>> 0) & ((k | 0) > 9))) {
										k = l
										break
									} else k = l
								}
							bf(a, 48, (k + 9) | 0, 9, 0)
						} else {
							w = v ? w : (n + 4) | 0
							if ((n >>> 0 < w >>> 0) & ((k | 0) > -1)) {
								e = (G + 9) | 0
								s = ((g & 8) | 0) == 0
								v = e
								p = (0 - F) | 0
								r = (G + 8) | 0
								o = n
								do {
									l = _e(f[o >> 2] | 0, 0, e) | 0
									if ((l | 0) == (e | 0)) {
										b[r >> 0] = 48
										l = r
									}
									do
										if ((o | 0) == (n | 0)) {
											m = (l + 1) | 0
											Ve(a, l, 1)
											if (s & ((k | 0) < 1)) {
												l = m
												break
											}
											Ve(a, 10647, 1)
											l = m
										} else {
											if (l >>> 0 <= G >>> 0) break
											bh(G | 0, 48, (l + p) | 0) | 0
											do l = (l + -1) | 0
											while (l >>> 0 > G >>> 0)
										}
									while (0)
									F = (v - l) | 0
									Ve(a, l, (k | 0) > (F | 0) ? F : k)
									k = (k - F) | 0
									o = (o + 4) | 0
								} while ((o >>> 0 < w >>> 0) & ((k | 0) > -1))
							}
							bf(a, 48, (k + 18) | 0, 18, 0)
							Ve(a, x, (E - x) | 0)
						}
						bf(a, 32, d, j, g ^ 8192)
					}
				while (0)
				t = H
				return ((j | 0) < (d | 0) ? d : j) | 0
			}
			function ef(a) {
				a = +a
				var b = 0
				p[s >> 3] = a
				b = f[s >> 2] | 0
				aa(f[(s + 4) >> 2] | 0)
				return b | 0
			}
			function ff(a, b) {
				a = +a
				b = b | 0
				return +(+gf(a, b))
			}
			function gf(a, b) {
				a = +a
				b = b | 0
				var c = 0,
					d = 0,
					e = 0
				p[s >> 3] = a
				c = f[s >> 2] | 0
				d = f[(s + 4) >> 2] | 0
				e = Yg(c | 0, d | 0, 52) | 0
				ba() | 0
				switch (e & 2047) {
					case 0: {
						if (a != 0.0) {
							a = +gf(a * 18446744073709551616.0, b)
							c = ((f[b >> 2] | 0) + -64) | 0
						} else c = 0
						f[b >> 2] = c
						break
					}
					case 2047:
						break
					default: {
						f[b >> 2] = (e & 2047) + -1022
						f[s >> 2] = c
						f[(s + 4) >> 2] = (d & -2146435073) | 1071644672
						a = +p[s >> 3]
					}
				}
				return +a
			}
			function hf(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				do
					if (a) {
						if (c >>> 0 < 128) {
							b[a >> 0] = c
							a = 1
							break
						}
						d = ((jf() | 0) + 188) | 0
						if (!(f[f[d >> 2] >> 2] | 0))
							if (((c & -128) | 0) == 57216) {
								b[a >> 0] = c
								a = 1
								break
							} else {
								a = Me() | 0
								f[a >> 2] = 84
								a = -1
								break
							}
						if (c >>> 0 < 2048) {
							b[a >> 0] = (6 ? c >>> 6 : c) | 192
							b[(a + 1) >> 0] = (c & 63) | 128
							a = 2
							break
						}
						if ((c >>> 0 < 55296) | (((c & -8192) | 0) == 57344)) {
							b[a >> 0] = (12 ? c >>> 12 : c) | 224
							b[(a + 1) >> 0] = ((6 ? c >>> 6 : c) & 63) | 128
							b[(a + 2) >> 0] = (c & 63) | 128
							a = 3
							break
						}
						if (((c + -65536) | 0) >>> 0 < 1048576) {
							b[a >> 0] = (18 ? c >>> 18 : c) | 240
							b[(a + 1) >> 0] = ((12 ? c >>> 12 : c) & 63) | 128
							b[(a + 2) >> 0] = ((6 ? c >>> 6 : c) & 63) | 128
							b[(a + 3) >> 0] = (c & 63) | 128
							a = 4
							break
						} else {
							a = Me() | 0
							f[a >> 2] = 84
							a = -1
							break
						}
					} else a = 1
				while (0)
				return a | 0
			}
			function jf() {
				return kf() | 0
			}
			function kf() {
				return 7868
			}
			function lf() {
				return kf() | 0
			}
			function mf(a, c) {
				a = a | 0
				c = c | 0
				var d = 0,
					e = 0
				d = 0
				while (1) {
					if ((h[(4880 + d) >> 0] | 0) == (a | 0)) {
						e = 4
						break
					}
					d = (d + 1) | 0
					if ((d | 0) == 87) {
						a = 87
						e = 5
						break
					}
				}
				if ((e | 0) == 4)
					if (!d) d = 4976
					else {
						a = d
						e = 5
					}
				if ((e | 0) == 5) {
					d = 4976
					do {
						do {
							e = d
							d = (d + 1) | 0
						} while ((b[e >> 0] | 0) != 0)
						a = (a + -1) | 0
					} while ((a | 0) != 0)
				}
				return nf(d, f[(c + 20) >> 2] | 0) | 0
			}
			function nf(a, b) {
				a = a | 0
				b = b | 0
				return of(a, b) | 0
			}
			function of(a, b) {
				a = a | 0
				b = b | 0
				if (!b) b = 0
				else b = pf(f[b >> 2] | 0, f[(b + 4) >> 2] | 0, a) | 0
				return ((b | 0) == 0 ? a : b) | 0
			}
			function pf(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0
				o = ((f[a >> 2] | 0) + 1794895138) | 0
				h = qf(f[(a + 8) >> 2] | 0, o) | 0
				e = qf(f[(a + 12) >> 2] | 0, o) | 0
				g = qf(f[(a + 16) >> 2] | 0, o) | 0
				a: do
					if (
						(
							h >>> 0 < (2 ? c >>> 2 : c) >>> 0
								? ((n = (c - (h << 2)) | 0), (e >>> 0 < n >>> 0) & (g >>> 0 < n >>> 0))
								: 0
						)
							? (((g | e) & 3) | 0) == 0
							: 0
					) {
						n = 2 ? e >>> 2 : e
						m = 2 ? g >>> 2 : g
						l = 0
						while (1) {
							j = 1 ? h >>> 1 : h
							k = (l + j) | 0
							i = k << 1
							g = (i + n) | 0
							e = qf(f[(a + (g << 2)) >> 2] | 0, o) | 0
							g = qf(f[(a + ((g + 1) << 2)) >> 2] | 0, o) | 0
							if (!((g >>> 0 < c >>> 0) & (e >>> 0 < ((c - g) | 0) >>> 0))) {
								e = 0
								break a
							}
							if (b[(a + (g + e)) >> 0] | 0) {
								e = 0
								break a
							}
							e = Pe(d, (a + g) | 0) | 0
							if (!e) break
							e = (e | 0) < 0
							if ((h | 0) == 1) {
								e = 0
								break a
							}
							l = e ? l : k
							h = e ? j : (h - j) | 0
						}
						e = (i + m) | 0
						g = qf(f[(a + (e << 2)) >> 2] | 0, o) | 0
						e = qf(f[(a + ((e + 1) << 2)) >> 2] | 0, o) | 0
						if ((e >>> 0 < c >>> 0) & (g >>> 0 < ((c - e) | 0) >>> 0))
							e = (b[(a + (e + g)) >> 0] | 0) == 0 ? (a + e) | 0 : 0
						else e = 0
					} else e = 0
				while (0)
				return e | 0
			}
			function qf(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = _g(a | 0) | 0
				return ((b | 0) == 0 ? a : c) | 0
			}
			function rf(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0
				e = (d + 16) | 0
				g = f[e >> 2] | 0
				if (!g)
					if (!(sf(d) | 0)) {
						g = f[e >> 2] | 0
						h = 5
					} else e = 0
				else h = 5
				a: do
					if ((h | 0) == 5) {
						j = (d + 20) | 0
						i = f[j >> 2] | 0
						e = i
						if (((g - i) | 0) >>> 0 < c >>> 0) {
							e = oc[f[(d + 36) >> 2] & 15](d, a, c) | 0
							break
						}
						b: do
							if (((b[(d + 75) >> 0] | 0) < 0) | ((c | 0) == 0)) {
								h = 0
								g = a
							} else {
								i = c
								while (1) {
									g = (i + -1) | 0
									if ((b[(a + g) >> 0] | 0) == 10) break
									if (!g) {
										h = 0
										g = a
										break b
									} else i = g
								}
								e = oc[f[(d + 36) >> 2] & 15](d, a, i) | 0
								if (e >>> 0 < i >>> 0) break a
								h = i
								g = (a + i) | 0
								c = (c - i) | 0
								e = f[j >> 2] | 0
							}
						while (0)
						$g(e | 0, g | 0, c | 0) | 0
						f[j >> 2] = (f[j >> 2] | 0) + c
						e = (h + c) | 0
					}
				while (0)
				return e | 0
			}
			function sf(a) {
				a = a | 0
				var c = 0,
					d = 0
				c = (a + 74) | 0
				d = b[c >> 0] | 0
				b[c >> 0] = (d + 255) | d
				c = f[a >> 2] | 0
				if (!(c & 8)) {
					f[(a + 8) >> 2] = 0
					f[(a + 4) >> 2] = 0
					d = f[(a + 44) >> 2] | 0
					f[(a + 28) >> 2] = d
					f[(a + 20) >> 2] = d
					f[(a + 16) >> 2] = d + (f[(a + 48) >> 2] | 0)
					a = 0
				} else {
					f[a >> 2] = c | 32
					a = -1
				}
				return a | 0
			}
			function tf(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0
				m = t
				t = (t + 208) | 0
				if ((t | 0) >= (u | 0)) da(208)
				j = m
				k = (m + 192) | 0
				h = U(c, b) | 0
				i = k
				f[i >> 2] = 1
				f[(i + 4) >> 2] = 0
				a: do
					if (h | 0) {
						i = (0 - c) | 0
						f[(j + 4) >> 2] = c
						f[j >> 2] = c
						e = 2
						b = c
						g = c
						while (1) {
							b = (b + c + g) | 0
							f[(j + (e << 2)) >> 2] = b
							if (b >>> 0 < h >>> 0) {
								n = g
								e = (e + 1) | 0
								g = b
								b = n
							} else break
						}
						g = (a + h + i) | 0
						if (g >>> 0 > a >>> 0) {
							h = g
							e = 1
							b = 1
							do {
								do
									if (((b & 3) | 0) != 3) {
										b = (e + -1) | 0
										if ((f[(j + (b << 2)) >> 2] | 0) >>> 0 < ((h - a) | 0) >>> 0) uf(a, c, d, e, j)
										else wf(a, c, d, k, e, 0, j)
										if ((e | 0) == 1) {
											xf(k, 1)
											e = 0
											break
										} else {
											xf(k, b)
											e = 1
											break
										}
									} else {
										uf(a, c, d, e, j)
										vf(k, 2)
										e = (e + 2) | 0
									}
								while (0)
								b = f[k >> 2] | 1
								f[k >> 2] = b
								a = (a + c) | 0
							} while (a >>> 0 < g >>> 0)
						} else {
							e = 1
							b = 1
						}
						wf(a, c, d, k, e, 0, j)
						g = (k + 4) | 0
						while (1) {
							if (((e | 0) == 1) & ((b | 0) == 1))
								if (!(f[g >> 2] | 0)) break a
								else l = 19
							else if ((e | 0) < 2) l = 19
							else {
								xf(k, 2)
								n = (e + -2) | 0
								f[k >> 2] = f[k >> 2] ^ 7
								vf(k, 1)
								wf((a + (0 - (f[(j + (n << 2)) >> 2] | 0)) + i) | 0, c, d, k, (e + -1) | 0, 1, j)
								xf(k, 1)
								b = f[k >> 2] | 1
								f[k >> 2] = b
								a = (a + i) | 0
								wf(a, c, d, k, n, 1, j)
								e = n
							}
							if ((l | 0) == 19) {
								l = 0
								b = yf(k) | 0
								vf(k, b)
								a = (a + i) | 0
								e = (b + e) | 0
								b = f[k >> 2] | 0
							}
						}
					}
				while (0)
				t = m
				return
			}
			function uf(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				var g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0
				m = t
				t = (t + 240) | 0
				if ((t | 0) >= (u | 0)) da(240)
				l = m
				f[l >> 2] = a
				a: do
					if ((d | 0) > 1) {
						k = (0 - b) | 0
						i = a
						g = d
						d = 1
						h = a
						while (1) {
							i = (i + k) | 0
							j = (g + -2) | 0
							a = (i + (0 - (f[(e + (j << 2)) >> 2] | 0))) | 0
							if ((nc[c & 7](h, a) | 0) > -1 ? (nc[c & 7](h, i) | 0) > -1 : 0) break a
							h = (l + (d << 2)) | 0
							if ((nc[c & 7](a, i) | 0) > -1) {
								f[h >> 2] = a
								g = (g + -1) | 0
							} else {
								f[h >> 2] = i
								a = i
								g = j
							}
							d = (d + 1) | 0
							if ((g | 0) <= 1) break a
							i = a
							h = f[l >> 2] | 0
						}
					} else d = 1
				while (0)
				Af(b, l, d)
				t = m
				return
			}
			function vf(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0
				e = (a + 4) | 0
				if (b >>> 0 > 31) {
					d = f[e >> 2] | 0
					f[a >> 2] = d
					f[e >> 2] = 0
					b = (b + -32) | 0
					c = 0
				} else {
					c = f[e >> 2] | 0
					d = f[a >> 2] | 0
				}
				f[a >> 2] = (c << (32 - b)) | (b ? d >>> b : d)
				f[e >> 2] = b ? c >>> b : c
				return
			}
			function wf(a, b, c, d, e, g, h) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				h = h | 0
				var i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0
				o = t
				t = (t + 240) | 0
				if ((t | 0) >= (u | 0)) da(240)
				m = (o + 232) | 0
				n = o
				p = f[d >> 2] | 0
				f[m >> 2] = p
				j = f[(d + 4) >> 2] | 0
				k = (m + 4) | 0
				f[k >> 2] = j
				f[n >> 2] = a
				a: do
					if (
						((p | 0) != 1) | ((j | 0) != 0)
							? ((l = (0 - b) | 0),
								(i = (a + (0 - (f[(h + (e << 2)) >> 2] | 0))) | 0),
								(nc[c & 7](i, a) | 0) >= 1)
							: 0
					) {
						d = 1
						g = (g | 0) == 0
						j = i
						while (1) {
							if (g & ((e | 0) > 1)) {
								g = (a + l) | 0
								i = f[(h + ((e + -2) << 2)) >> 2] | 0
								if ((nc[c & 7](g, j) | 0) > -1) {
									i = 10
									break a
								}
								if ((nc[c & 7]((g + (0 - i)) | 0, j) | 0) > -1) {
									i = 10
									break a
								}
							}
							g = (d + 1) | 0
							f[(n + (d << 2)) >> 2] = j
							p = yf(m) | 0
							vf(m, p)
							e = (p + e) | 0
							if (!(((f[m >> 2] | 0) != 1) | ((f[k >> 2] | 0) != 0))) {
								d = g
								a = j
								i = 10
								break a
							}
							a = (j + (0 - (f[(h + (e << 2)) >> 2] | 0))) | 0
							if ((nc[c & 7](a, f[n >> 2] | 0) | 0) < 1) {
								a = j
								d = g
								g = 0
								i = 9
								break
							} else {
								p = j
								d = g
								g = 1
								j = a
								a = p
							}
						}
					} else {
						d = 1
						i = 9
					}
				while (0)
				if ((i | 0) == 9 ? (g | 0) == 0 : 0) i = 10
				if ((i | 0) == 10) {
					Af(b, n, d)
					uf(a, b, c, e, h)
				}
				t = o
				return
			}
			function xf(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					g = 0
				e = (a + 4) | 0
				if (b >>> 0 > 31) {
					d = f[a >> 2] | 0
					f[e >> 2] = d
					f[a >> 2] = 0
					b = (b + -32) | 0
					c = 0
				} else {
					c = f[a >> 2] | 0
					d = f[e >> 2] | 0
				}
				g = (32 - b) | 0
				f[e >> 2] = (g ? c >>> g : c) | (d << b)
				f[a >> 2] = c << b
				return
			}
			function yf(a) {
				a = a | 0
				var b = 0
				b = zf(((f[a >> 2] | 0) + -1) | 0) | 0
				if (!b) {
					b = zf(f[(a + 4) >> 2] | 0) | 0
					return ((b | 0) == 0 ? 0 : (b + 32) | 0) | 0
				} else return b | 0
				return 0
			}
			function zf(a) {
				a = a | 0
				var b = 0
				if (a)
					if (!(a & 1)) {
						b = a
						a = 0
						while (1) {
							a = (a + 1) | 0
							if (!(b & 2)) b = 1 ? b >>> 1 : b
							else break
						}
					} else a = 0
				else a = 32
				return a | 0
			}
			function Af(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0
				h = t
				t = (t + 256) | 0
				if ((t | 0) >= (u | 0)) da(256)
				d = h
				a: do
					if ((c | 0) >= 2 ? ((g = (b + (c << 2)) | 0), (f[g >> 2] = d), a | 0) : 0)
						while (1) {
							e = a >>> 0 < 256 ? a : 256
							$g(d | 0, f[b >> 2] | 0, e | 0) | 0
							d = 0
							do {
								i = (b + (d << 2)) | 0
								d = (d + 1) | 0
								$g(f[i >> 2] | 0, f[(b + (d << 2)) >> 2] | 0, e | 0) | 0
								f[i >> 2] = (f[i >> 2] | 0) + e
							} while ((d | 0) != (c | 0))
							a = (a - e) | 0
							if (!a) break a
							d = f[g >> 2] | 0
						}
				while (0)
				t = h
				return
			}
			function Bf(a) {
				a = a | 0
				var c = 0,
					d = 0,
					e = 0
				e = a
				a: do
					if (!(e & 3)) d = 5
					else {
						c = e
						while (1) {
							if (!(b[a >> 0] | 0)) {
								a = c
								break a
							}
							a = (a + 1) | 0
							c = a
							if (!(c & 3)) {
								d = 5
								break
							}
						}
					}
				while (0)
				if ((d | 0) == 5) {
					while (1) {
						c = f[a >> 2] | 0
						if (!(((c & -2139062144) ^ -2139062144) & (c + -16843009))) a = (a + 4) | 0
						else break
					}
					if (((c & 255) << 24) >> 24)
						do a = (a + 1) | 0
						while ((b[a >> 0] | 0) != 0)
				}
				return (a - e) | 0
			}
			function Cf(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				c = Bf(a) | 0
				return ((((Df(a, 1, c, b) | 0) != (c | 0)) << 31) >> 31) | 0
			}
			function Df(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0
				e = U(c, b) | 0
				c = (b | 0) == 0 ? 0 : c
				if ((f[(d + 76) >> 2] | 0) > -1) {
					g = (Te(d) | 0) == 0
					a = rf(a, e, d) | 0
					if (!g) Ue(d)
				} else a = rf(a, e, d) | 0
				if ((a | 0) != (e | 0)) c = ((a >>> 0) / (b >>> 0)) | 0
				return c | 0
			}
			function Ef(a, c) {
				a = a | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0
				l = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				j = l
				k = c & 255
				b[j >> 0] = k
				e = (a + 16) | 0
				g = f[e >> 2] | 0
				if (!g)
					if (!(sf(a) | 0)) {
						g = f[e >> 2] | 0
						i = 4
					} else d = -1
				else i = 4
				do
					if ((i | 0) == 4) {
						i = (a + 20) | 0
						e = f[i >> 2] | 0
						if (e >>> 0 < g >>> 0 ? ((d = c & 255), (d | 0) != (b[(a + 75) >> 0] | 0)) : 0) {
							f[i >> 2] = e + 1
							b[e >> 0] = k
							break
						}
						if ((oc[f[(a + 36) >> 2] & 15](a, j, 1) | 0) == 1) d = h[j >> 0] | 0
						else d = -1
					}
				while (0)
				t = l
				return d | 0
			}
			function Ff(a) {
				a = a | 0
				var b = 0,
					c = 0
				b = ((Bf(a) | 0) + 1) | 0
				c = Mf(b) | 0
				if (!c) a = 0
				else a = $g(c | 0, a | 0, b | 0) | 0
				return a | 0
			}
			function Gf() {
				Ka(71180)
				return 71188
			}
			function Hf() {
				Ra(71180)
				return
			}
			function If(a) {
				a = a | 0
				var b = 0,
					c = 0
				do
					if (a) {
						if ((f[(a + 76) >> 2] | 0) <= -1) {
							b = Jf(a) | 0
							break
						}
						c = (Te(a) | 0) == 0
						b = Jf(a) | 0
						if (!c) Ue(a)
					} else {
						if (!(f[1966] | 0)) b = 0
						else b = If(f[1966] | 0) | 0
						a = Gf() | 0
						a = f[a >> 2] | 0
						if (a)
							do {
								if ((f[(a + 76) >> 2] | 0) > -1) c = Te(a) | 0
								else c = 0
								if ((f[(a + 20) >> 2] | 0) >>> 0 > (f[(a + 28) >> 2] | 0) >>> 0) b = Jf(a) | 0 | b
								if (c | 0) Ue(a)
								a = f[(a + 56) >> 2] | 0
							} while ((a | 0) != 0)
						Hf()
					}
				while (0)
				return b | 0
			}
			function Jf(a) {
				a = a | 0
				var b = 0,
					c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0
				b = (a + 20) | 0
				h = (a + 28) | 0
				if (
					(f[b >> 2] | 0) >>> 0 > (f[h >> 2] | 0) >>> 0
						? (oc[f[(a + 36) >> 2] & 15](a, 0, 0) | 0, (f[b >> 2] | 0) == 0)
						: 0
				)
					a = -1
				else {
					c = (a + 4) | 0
					d = f[c >> 2] | 0
					e = (a + 8) | 0
					g = f[e >> 2] | 0
					if (d >>> 0 < g >>> 0) oc[f[(a + 40) >> 2] & 15](a, (d - g) | 0, 1) | 0
					f[(a + 16) >> 2] = 0
					f[h >> 2] = 0
					f[b >> 2] = 0
					f[e >> 2] = 0
					f[c >> 2] = 0
					a = 0
				}
				return a | 0
			}
			function Kf(a, c) {
				a = a | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0
				if ((f[(c + 76) >> 2] | 0) >= 0 ? (Te(c) | 0) != 0 : 0) {
					e = a & 255
					d = a & 255
					if (
						(d | 0) != (b[(c + 75) >> 0] | 0)
							? ((i = (c + 20) | 0), (j = f[i >> 2] | 0), j >>> 0 < (f[(c + 16) >> 2] | 0) >>> 0)
							: 0
					) {
						f[i >> 2] = j + 1
						b[j >> 0] = e
					} else d = Ef(c, a) | 0
					Ue(c)
				} else k = 3
				do
					if ((k | 0) == 3) {
						e = a & 255
						d = a & 255
						if (
							(d | 0) != (b[(c + 75) >> 0] | 0)
								? ((g = (c + 20) | 0), (h = f[g >> 2] | 0), h >>> 0 < (f[(c + 16) >> 2] | 0) >>> 0)
								: 0
						) {
							f[g >> 2] = h + 1
							b[h >> 0] = e
							break
						}
						d = Ef(c, a) | 0
					}
				while (0)
				return d | 0
			}
			function Lf(a) {
				a = a | 0
				var c = 0,
					d = 0,
					e = 0,
					g = 0
				e = f[1934] | 0
				if ((f[(e + 76) >> 2] | 0) > -1) g = Te(e) | 0
				else g = 0
				do
					if ((Cf(a, e) | 0) < 0) a = -1
					else {
						if (
							(b[(e + 75) >> 0] | 0) != 10
								? ((c = (e + 20) | 0), (d = f[c >> 2] | 0), d >>> 0 < (f[(e + 16) >> 2] | 0) >>> 0)
								: 0
						) {
							f[c >> 2] = d + 1
							b[d >> 0] = 10
							a = 0
							break
						}
						a = Ef(e, 10) | 0
						a = 31 ? a >> 31 : a
					}
				while (0)
				if (g | 0) Ue(e)
				return a | 0
			}
			function Mf(a) {
				a = a | 0
				var b = 0,
					c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0,
					q = 0,
					r = 0,
					s = 0,
					v = 0,
					w = 0,
					x = 0,
					y = 0
				y = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				n = y
				do
					if (a >>> 0 < 245) {
						k = a >>> 0 < 11 ? 16 : (a + 11) & -8
						a = 3 ? k >>> 3 : k
						m = f[17798] | 0
						c = a ? m >>> a : m
						if ((c & 3) | 0) {
							b = (((c & 1) ^ 1) + a) | 0
							a = (71232 + ((b << 1) << 2)) | 0
							c = (a + 8) | 0
							d = f[c >> 2] | 0
							e = (d + 8) | 0
							g = f[e >> 2] | 0
							if ((g | 0) == (a | 0)) f[17798] = m & ~(1 << b)
							else {
								f[(g + 12) >> 2] = a
								f[c >> 2] = g
							}
							x = b << 3
							f[(d + 4) >> 2] = x | 3
							x = (d + x + 4) | 0
							f[x >> 2] = f[x >> 2] | 1
							x = e
							t = y
							return x | 0
						}
						l = f[17800] | 0
						if (k >>> 0 > l >>> 0) {
							if (c | 0) {
								d = 2 << a
								d = (c << a) & (d | (0 - d))
								d = ((d & (0 - d)) + -1) | 0
								i = (12 ? d >>> 12 : d) & 16
								d = i ? d >>> i : d
								c = (5 ? d >>> 5 : d) & 8
								d = c ? d >>> c : d
								g = (2 ? d >>> 2 : d) & 4
								d = g ? d >>> g : d
								a = (1 ? d >>> 1 : d) & 2
								d = a ? d >>> a : d
								b = (1 ? d >>> 1 : d) & 1
								d = ((c | i | g | a | b) + (b ? d >>> b : d)) | 0
								b = (71232 + ((d << 1) << 2)) | 0
								a = (b + 8) | 0
								g = f[a >> 2] | 0
								i = (g + 8) | 0
								c = f[i >> 2] | 0
								if ((c | 0) == (b | 0)) {
									a = m & ~(1 << d)
									f[17798] = a
								} else {
									f[(c + 12) >> 2] = b
									f[a >> 2] = c
									a = m
								}
								x = d << 3
								h = (x - k) | 0
								f[(g + 4) >> 2] = k | 3
								e = (g + k) | 0
								f[(e + 4) >> 2] = h | 1
								f[(g + x) >> 2] = h
								if (l | 0) {
									d = f[17803] | 0
									b = 3 ? l >>> 3 : l
									c = (71232 + ((b << 1) << 2)) | 0
									b = 1 << b
									if (!(a & b)) {
										f[17798] = a | b
										b = c
										a = (c + 8) | 0
									} else {
										a = (c + 8) | 0
										b = f[a >> 2] | 0
									}
									f[a >> 2] = d
									f[(b + 12) >> 2] = d
									f[(d + 8) >> 2] = b
									f[(d + 12) >> 2] = c
								}
								f[17800] = h
								f[17803] = e
								x = i
								t = y
								return x | 0
							}
							g = f[17799] | 0
							if (g) {
								j = ((g & (0 - g)) + -1) | 0
								e = (12 ? j >>> 12 : j) & 16
								j = e ? j >>> e : j
								d = (5 ? j >>> 5 : j) & 8
								j = d ? j >>> d : j
								h = (2 ? j >>> 2 : j) & 4
								j = h ? j >>> h : j
								i = (1 ? j >>> 1 : j) & 2
								j = i ? j >>> i : j
								c = (1 ? j >>> 1 : j) & 1
								j = f[(71496 + (((d | e | h | i | c) + (c ? j >>> c : j)) << 2)) >> 2] | 0
								c = j
								i = j
								j = ((f[(j + 4) >> 2] & -8) - k) | 0
								while (1) {
									a = f[(c + 16) >> 2] | 0
									if (!a) {
										a = f[(c + 20) >> 2] | 0
										if (!a) break
									}
									h = ((f[(a + 4) >> 2] & -8) - k) | 0
									e = h >>> 0 < j >>> 0
									c = a
									i = e ? a : i
									j = e ? h : j
								}
								h = (i + k) | 0
								if (h >>> 0 > i >>> 0) {
									e = f[(i + 24) >> 2] | 0
									b = f[(i + 12) >> 2] | 0
									do
										if ((b | 0) == (i | 0)) {
											a = (i + 20) | 0
											b = f[a >> 2] | 0
											if (!b) {
												a = (i + 16) | 0
												b = f[a >> 2] | 0
												if (!b) {
													c = 0
													break
												}
											}
											while (1) {
												d = (b + 20) | 0
												c = f[d >> 2] | 0
												if (!c) {
													d = (b + 16) | 0
													c = f[d >> 2] | 0
													if (!c) break
													else {
														b = c
														a = d
													}
												} else {
													b = c
													a = d
												}
											}
											f[a >> 2] = 0
											c = b
										} else {
											c = f[(i + 8) >> 2] | 0
											f[(c + 12) >> 2] = b
											f[(b + 8) >> 2] = c
											c = b
										}
									while (0)
									do
										if (e | 0) {
											b = f[(i + 28) >> 2] | 0
											a = (71496 + (b << 2)) | 0
											if ((i | 0) == (f[a >> 2] | 0)) {
												f[a >> 2] = c
												if (!c) {
													f[17799] = g & ~(1 << b)
													break
												}
											} else {
												x = (e + 16) | 0
												f[((f[x >> 2] | 0) == (i | 0) ? x : (e + 20) | 0) >> 2] = c
												if (!c) break
											}
											f[(c + 24) >> 2] = e
											b = f[(i + 16) >> 2] | 0
											if (b | 0) {
												f[(c + 16) >> 2] = b
												f[(b + 24) >> 2] = c
											}
											b = f[(i + 20) >> 2] | 0
											if (b | 0) {
												f[(c + 20) >> 2] = b
												f[(b + 24) >> 2] = c
											}
										}
									while (0)
									if (j >>> 0 < 16) {
										x = (j + k) | 0
										f[(i + 4) >> 2] = x | 3
										x = (i + x + 4) | 0
										f[x >> 2] = f[x >> 2] | 1
									} else {
										f[(i + 4) >> 2] = k | 3
										f[(h + 4) >> 2] = j | 1
										f[(h + j) >> 2] = j
										if (l | 0) {
											d = f[17803] | 0
											b = 3 ? l >>> 3 : l
											c = (71232 + ((b << 1) << 2)) | 0
											b = 1 << b
											if (!(b & m)) {
												f[17798] = b | m
												b = c
												a = (c + 8) | 0
											} else {
												a = (c + 8) | 0
												b = f[a >> 2] | 0
											}
											f[a >> 2] = d
											f[(b + 12) >> 2] = d
											f[(d + 8) >> 2] = b
											f[(d + 12) >> 2] = c
										}
										f[17800] = j
										f[17803] = h
									}
									x = (i + 8) | 0
									t = y
									return x | 0
								} else m = k
							} else m = k
						} else m = k
					} else if (a >>> 0 <= 4294967231) {
						a = (a + 11) | 0
						k = a & -8
						d = f[17799] | 0
						if (d) {
							e = (0 - k) | 0
							a = 8 ? a >>> 8 : a
							if (a)
								if (k >>> 0 > 16777215) j = 31
								else {
									m = (a + 1048320) | 0
									m = (16 ? m >>> 16 : m) & 8
									j = a << m
									i = (j + 520192) | 0
									i = (16 ? i >>> 16 : i) & 4
									j = j << i
									q = (j + 245760) | 0
									q = (16 ? q >>> 16 : q) & 2
									j = j << q
									j = (14 - (i | m | q) + (15 ? j >>> 15 : j)) | 0
									q = (j + 7) | 0
									j = ((q ? k >>> q : k) & 1) | (j << 1)
								}
							else j = 0
							c = f[(71496 + (j << 2)) >> 2] | 0
							a: do
								if (!c) {
									c = 0
									a = 0
									q = 61
								} else {
									a = 0
									i = k << ((j | 0) == 31 ? 0 : (25 - (1 ? j >>> 1 : j)) | 0)
									g = 0
									while (1) {
										h = ((f[(c + 4) >> 2] & -8) - k) | 0
										if (h >>> 0 < e >>> 0)
											if (!h) {
												a = c
												e = 0
												q = 65
												break a
											} else {
												a = c
												e = h
											}
										q = f[(c + 20) >> 2] | 0
										c = f[(c + 16 + ((31 ? i >>> 31 : i) << 2)) >> 2] | 0
										g = ((q | 0) == 0) | ((q | 0) == (c | 0)) ? g : q
										if (!c) {
											c = g
											q = 61
											break
										} else i = i << 1
									}
								}
							while (0)
							if ((q | 0) == 61) {
								if (((c | 0) == 0) & ((a | 0) == 0)) {
									a = 2 << j
									a = (a | (0 - a)) & d
									if (!a) {
										m = k
										break
									}
									c = ((a & (0 - a)) + -1) | 0
									h = (12 ? c >>> 12 : c) & 16
									c = h ? c >>> h : c
									g = (5 ? c >>> 5 : c) & 8
									c = g ? c >>> g : c
									i = (2 ? c >>> 2 : c) & 4
									c = i ? c >>> i : c
									j = (1 ? c >>> 1 : c) & 2
									c = j ? c >>> j : c
									m = (1 ? c >>> 1 : c) & 1
									a = 0
									c = f[(71496 + (((g | h | i | j | m) + (m ? c >>> m : c)) << 2)) >> 2] | 0
								}
								if (!c) {
									i = a
									h = e
								} else q = 65
							}
							if ((q | 0) == 65) {
								g = c
								while (1) {
									m = ((f[(g + 4) >> 2] & -8) - k) | 0
									c = m >>> 0 < e >>> 0
									e = c ? m : e
									a = c ? g : a
									c = f[(g + 16) >> 2] | 0
									if (!c) c = f[(g + 20) >> 2] | 0
									if (!c) {
										i = a
										h = e
										break
									} else g = c
								}
							}
							if (
								((i | 0) != 0 ? h >>> 0 < (((f[17800] | 0) - k) | 0) >>> 0 : 0)
									? ((l = (i + k) | 0), l >>> 0 > i >>> 0)
									: 0
							) {
								g = f[(i + 24) >> 2] | 0
								b = f[(i + 12) >> 2] | 0
								do
									if ((b | 0) == (i | 0)) {
										a = (i + 20) | 0
										b = f[a >> 2] | 0
										if (!b) {
											a = (i + 16) | 0
											b = f[a >> 2] | 0
											if (!b) {
												b = 0
												break
											}
										}
										while (1) {
											e = (b + 20) | 0
											c = f[e >> 2] | 0
											if (!c) {
												e = (b + 16) | 0
												c = f[e >> 2] | 0
												if (!c) break
												else {
													b = c
													a = e
												}
											} else {
												b = c
												a = e
											}
										}
										f[a >> 2] = 0
									} else {
										x = f[(i + 8) >> 2] | 0
										f[(x + 12) >> 2] = b
										f[(b + 8) >> 2] = x
									}
								while (0)
								do
									if (g) {
										a = f[(i + 28) >> 2] | 0
										c = (71496 + (a << 2)) | 0
										if ((i | 0) == (f[c >> 2] | 0)) {
											f[c >> 2] = b
											if (!b) {
												d = d & ~(1 << a)
												f[17799] = d
												break
											}
										} else {
											x = (g + 16) | 0
											f[((f[x >> 2] | 0) == (i | 0) ? x : (g + 20) | 0) >> 2] = b
											if (!b) break
										}
										f[(b + 24) >> 2] = g
										a = f[(i + 16) >> 2] | 0
										if (a | 0) {
											f[(b + 16) >> 2] = a
											f[(a + 24) >> 2] = b
										}
										a = f[(i + 20) >> 2] | 0
										if (a) {
											f[(b + 20) >> 2] = a
											f[(a + 24) >> 2] = b
										}
									}
								while (0)
								b: do
									if (h >>> 0 < 16) {
										x = (h + k) | 0
										f[(i + 4) >> 2] = x | 3
										x = (i + x + 4) | 0
										f[x >> 2] = f[x >> 2] | 1
									} else {
										f[(i + 4) >> 2] = k | 3
										f[(l + 4) >> 2] = h | 1
										f[(l + h) >> 2] = h
										b = 3 ? h >>> 3 : h
										if (h >>> 0 < 256) {
											c = (71232 + ((b << 1) << 2)) | 0
											a = f[17798] | 0
											b = 1 << b
											if (!(a & b)) {
												f[17798] = a | b
												b = c
												a = (c + 8) | 0
											} else {
												a = (c + 8) | 0
												b = f[a >> 2] | 0
											}
											f[a >> 2] = l
											f[(b + 12) >> 2] = l
											f[(l + 8) >> 2] = b
											f[(l + 12) >> 2] = c
											break
										}
										b = 8 ? h >>> 8 : h
										if (b)
											if (h >>> 0 > 16777215) c = 31
											else {
												w = (b + 1048320) | 0
												w = (16 ? w >>> 16 : w) & 8
												c = b << w
												v = (c + 520192) | 0
												v = (16 ? v >>> 16 : v) & 4
												c = c << v
												x = (c + 245760) | 0
												x = (16 ? x >>> 16 : x) & 2
												c = c << x
												c = (14 - (v | w | x) + (15 ? c >>> 15 : c)) | 0
												x = (c + 7) | 0
												c = ((x ? h >>> x : h) & 1) | (c << 1)
											}
										else c = 0
										b = (71496 + (c << 2)) | 0
										f[(l + 28) >> 2] = c
										a = (l + 16) | 0
										f[(a + 4) >> 2] = 0
										f[a >> 2] = 0
										a = 1 << c
										if (!(d & a)) {
											f[17799] = d | a
											f[b >> 2] = l
											f[(l + 24) >> 2] = b
											f[(l + 12) >> 2] = l
											f[(l + 8) >> 2] = l
											break
										}
										b = f[b >> 2] | 0
										c: do
											if (((f[(b + 4) >> 2] & -8) | 0) != (h | 0)) {
												d = h << ((c | 0) == 31 ? 0 : (25 - (1 ? c >>> 1 : c)) | 0)
												while (1) {
													c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0
													a = f[c >> 2] | 0
													if (!a) break
													if (((f[(a + 4) >> 2] & -8) | 0) == (h | 0)) {
														b = a
														break c
													} else {
														d = d << 1
														b = a
													}
												}
												f[c >> 2] = l
												f[(l + 24) >> 2] = b
												f[(l + 12) >> 2] = l
												f[(l + 8) >> 2] = l
												break b
											}
										while (0)
										w = (b + 8) | 0
										x = f[w >> 2] | 0
										f[(x + 12) >> 2] = l
										f[w >> 2] = l
										f[(l + 8) >> 2] = x
										f[(l + 12) >> 2] = b
										f[(l + 24) >> 2] = 0
									}
								while (0)
								x = (i + 8) | 0
								t = y
								return x | 0
							} else m = k
						} else m = k
					} else m = -1
				while (0)
				c = f[17800] | 0
				if (c >>> 0 >= m >>> 0) {
					b = (c - m) | 0
					a = f[17803] | 0
					if (b >>> 0 > 15) {
						x = (a + m) | 0
						f[17803] = x
						f[17800] = b
						f[(x + 4) >> 2] = b | 1
						f[(a + c) >> 2] = b
						f[(a + 4) >> 2] = m | 3
					} else {
						f[17800] = 0
						f[17803] = 0
						f[(a + 4) >> 2] = c | 3
						x = (a + c + 4) | 0
						f[x >> 2] = f[x >> 2] | 1
					}
					x = (a + 8) | 0
					t = y
					return x | 0
				}
				h = f[17801] | 0
				if (h >>> 0 > m >>> 0) {
					v = (h - m) | 0
					f[17801] = v
					x = f[17804] | 0
					w = (x + m) | 0
					f[17804] = w
					f[(w + 4) >> 2] = v | 1
					f[(x + 4) >> 2] = m | 3
					x = (x + 8) | 0
					t = y
					return x | 0
				}
				if (!(f[17916] | 0)) {
					f[17918] = 4096
					f[17917] = 4096
					f[17919] = -1
					f[17920] = -1
					f[17921] = 0
					f[17909] = 0
					f[17916] = (n & -16) ^ 1431655768
					a = 4096
				} else a = f[17918] | 0
				i = (m + 48) | 0
				j = (m + 47) | 0
				g = (a + j) | 0
				e = (0 - a) | 0
				k = g & e
				if (k >>> 0 <= m >>> 0) {
					x = 0
					t = y
					return x | 0
				}
				a = f[17908] | 0
				if (
					a | 0
						? ((l = f[17906] | 0), (n = (l + k) | 0), (n >>> 0 <= l >>> 0) | (n >>> 0 > a >>> 0))
						: 0
				) {
					x = 0
					t = y
					return x | 0
				}
				d: do
					if (!(f[17909] & 4)) {
						c = f[17804] | 0
						e: do
							if (c) {
								d = 71640
								while (1) {
									n = f[d >> 2] | 0
									if (n >>> 0 <= c >>> 0 ? ((n + (f[(d + 4) >> 2] | 0)) | 0) >>> 0 > c >>> 0 : 0)
										break
									a = f[(d + 8) >> 2] | 0
									if (!a) {
										q = 128
										break e
									} else d = a
								}
								b = (g - h) & e
								if (b >>> 0 < 2147483647) {
									a = ch(b | 0) | 0
									if ((a | 0) == (((f[d >> 2] | 0) + (f[(d + 4) >> 2] | 0)) | 0)) {
										if ((a | 0) != (-1 | 0)) {
											h = b
											g = a
											q = 145
											break d
										}
									} else {
										d = a
										q = 136
									}
								} else b = 0
							} else q = 128
						while (0)
						do
							if ((q | 0) == 128) {
								c = ch(0) | 0
								if (
									(c | 0) != (-1 | 0)
										? ((b = c),
											(o = f[17917] | 0),
											(p = (o + -1) | 0),
											(b = ((((p & b) | 0) == 0 ? 0 : (((p + b) & (0 - o)) - b) | 0) + k) | 0),
											(o = f[17906] | 0),
											(p = (b + o) | 0),
											(b >>> 0 > m >>> 0) & (b >>> 0 < 2147483647))
										: 0
								) {
									n = f[17908] | 0
									if (n | 0 ? (p >>> 0 <= o >>> 0) | (p >>> 0 > n >>> 0) : 0) {
										b = 0
										break
									}
									a = ch(b | 0) | 0
									if ((a | 0) == (c | 0)) {
										h = b
										g = c
										q = 145
										break d
									} else {
										d = a
										q = 136
									}
								} else b = 0
							}
						while (0)
						do
							if ((q | 0) == 136) {
								c = (0 - b) | 0
								if (!((i >>> 0 > b >>> 0) & ((b >>> 0 < 2147483647) & ((d | 0) != (-1 | 0)))))
									if ((d | 0) == (-1 | 0)) {
										b = 0
										break
									} else {
										h = b
										g = d
										q = 145
										break d
									}
								a = f[17918] | 0
								a = (j - b + a) & (0 - a)
								if (a >>> 0 >= 2147483647) {
									h = b
									g = d
									q = 145
									break d
								}
								if ((ch(a | 0) | 0) == (-1 | 0)) {
									ch(c | 0) | 0
									b = 0
									break
								} else {
									h = (a + b) | 0
									g = d
									q = 145
									break d
								}
							}
						while (0)
						f[17909] = f[17909] | 4
						q = 143
					} else {
						b = 0
						q = 143
					}
				while (0)
				if (
					((q | 0) == 143 ? k >>> 0 < 2147483647 : 0)
						? ((v = ch(k | 0) | 0),
							(p = ch(0) | 0),
							(r = (p - v) | 0),
							(s = r >>> 0 > ((m + 40) | 0) >>> 0),
							!(
								((v | 0) == (-1 | 0)) |
								(s ^ 1) |
								(((v >>> 0 < p >>> 0) & (((v | 0) != (-1 | 0)) & ((p | 0) != (-1 | 0)))) ^ 1)
							))
						: 0
				) {
					h = s ? r : b
					g = v
					q = 145
				}
				if ((q | 0) == 145) {
					b = ((f[17906] | 0) + h) | 0
					f[17906] = b
					if (b >>> 0 > (f[17907] | 0) >>> 0) f[17907] = b
					j = f[17804] | 0
					f: do
						if (j) {
							b = 71640
							while (1) {
								a = f[b >> 2] | 0
								c = f[(b + 4) >> 2] | 0
								if ((g | 0) == ((a + c) | 0)) {
									q = 154
									break
								}
								d = f[(b + 8) >> 2] | 0
								if (!d) break
								else b = d
							}
							if (
								((q | 0) == 154 ? ((w = (b + 4) | 0), ((f[(b + 12) >> 2] & 8) | 0) == 0) : 0)
									? (g >>> 0 > j >>> 0) & (a >>> 0 <= j >>> 0)
									: 0
							) {
								f[w >> 2] = c + h
								x = ((f[17801] | 0) + h) | 0
								v = (j + 8) | 0
								v = ((v & 7) | 0) == 0 ? 0 : (0 - v) & 7
								w = (j + v) | 0
								v = (x - v) | 0
								f[17804] = w
								f[17801] = v
								f[(w + 4) >> 2] = v | 1
								f[(j + x + 4) >> 2] = 40
								f[17805] = f[17920]
								break
							}
							if (g >>> 0 < (f[17802] | 0) >>> 0) f[17802] = g
							c = (g + h) | 0
							b = 71640
							while (1) {
								if ((f[b >> 2] | 0) == (c | 0)) {
									q = 162
									break
								}
								a = f[(b + 8) >> 2] | 0
								if (!a) break
								else b = a
							}
							if ((q | 0) == 162 ? ((f[(b + 12) >> 2] & 8) | 0) == 0 : 0) {
								f[b >> 2] = g
								l = (b + 4) | 0
								f[l >> 2] = (f[l >> 2] | 0) + h
								l = (g + 8) | 0
								l = (g + (((l & 7) | 0) == 0 ? 0 : (0 - l) & 7)) | 0
								b = (c + 8) | 0
								b = (c + (((b & 7) | 0) == 0 ? 0 : (0 - b) & 7)) | 0
								k = (l + m) | 0
								i = (b - l - m) | 0
								f[(l + 4) >> 2] = m | 3
								g: do
									if ((j | 0) == (b | 0)) {
										x = ((f[17801] | 0) + i) | 0
										f[17801] = x
										f[17804] = k
										f[(k + 4) >> 2] = x | 1
									} else {
										if ((f[17803] | 0) == (b | 0)) {
											x = ((f[17800] | 0) + i) | 0
											f[17800] = x
											f[17803] = k
											f[(k + 4) >> 2] = x | 1
											f[(k + x) >> 2] = x
											break
										}
										a = f[(b + 4) >> 2] | 0
										if (((a & 3) | 0) == 1) {
											h = a & -8
											d = 3 ? a >>> 3 : a
											h: do
												if (a >>> 0 < 256) {
													a = f[(b + 8) >> 2] | 0
													c = f[(b + 12) >> 2] | 0
													if ((c | 0) == (a | 0)) {
														f[17798] = f[17798] & ~(1 << d)
														break
													} else {
														f[(a + 12) >> 2] = c
														f[(c + 8) >> 2] = a
														break
													}
												} else {
													g = f[(b + 24) >> 2] | 0
													a = f[(b + 12) >> 2] | 0
													do
														if ((a | 0) == (b | 0)) {
															c = (b + 16) | 0
															d = (c + 4) | 0
															a = f[d >> 2] | 0
															if (!a) {
																a = f[c >> 2] | 0
																if (!a) {
																	a = 0
																	break
																}
															} else c = d
															while (1) {
																e = (a + 20) | 0
																d = f[e >> 2] | 0
																if (!d) {
																	e = (a + 16) | 0
																	d = f[e >> 2] | 0
																	if (!d) break
																	else {
																		a = d
																		c = e
																	}
																} else {
																	a = d
																	c = e
																}
															}
															f[c >> 2] = 0
														} else {
															x = f[(b + 8) >> 2] | 0
															f[(x + 12) >> 2] = a
															f[(a + 8) >> 2] = x
														}
													while (0)
													if (!g) break
													c = f[(b + 28) >> 2] | 0
													d = (71496 + (c << 2)) | 0
													do
														if ((f[d >> 2] | 0) != (b | 0)) {
															x = (g + 16) | 0
															f[((f[x >> 2] | 0) == (b | 0) ? x : (g + 20) | 0) >> 2] = a
															if (!a) break h
														} else {
															f[d >> 2] = a
															if (a | 0) break
															f[17799] = f[17799] & ~(1 << c)
															break h
														}
													while (0)
													f[(a + 24) >> 2] = g
													c = (b + 16) | 0
													d = f[c >> 2] | 0
													if (d | 0) {
														f[(a + 16) >> 2] = d
														f[(d + 24) >> 2] = a
													}
													c = f[(c + 4) >> 2] | 0
													if (!c) break
													f[(a + 20) >> 2] = c
													f[(c + 24) >> 2] = a
												}
											while (0)
											b = (b + h) | 0
											e = (h + i) | 0
										} else e = i
										b = (b + 4) | 0
										f[b >> 2] = f[b >> 2] & -2
										f[(k + 4) >> 2] = e | 1
										f[(k + e) >> 2] = e
										b = 3 ? e >>> 3 : e
										if (e >>> 0 < 256) {
											c = (71232 + ((b << 1) << 2)) | 0
											a = f[17798] | 0
											b = 1 << b
											if (!(a & b)) {
												f[17798] = a | b
												b = c
												a = (c + 8) | 0
											} else {
												a = (c + 8) | 0
												b = f[a >> 2] | 0
											}
											f[a >> 2] = k
											f[(b + 12) >> 2] = k
											f[(k + 8) >> 2] = b
											f[(k + 12) >> 2] = c
											break
										}
										b = 8 ? e >>> 8 : e
										do
											if (!b) d = 0
											else {
												if (e >>> 0 > 16777215) {
													d = 31
													break
												}
												w = (b + 1048320) | 0
												w = (16 ? w >>> 16 : w) & 8
												d = b << w
												v = (d + 520192) | 0
												v = (16 ? v >>> 16 : v) & 4
												d = d << v
												x = (d + 245760) | 0
												x = (16 ? x >>> 16 : x) & 2
												d = d << x
												d = (14 - (v | w | x) + (15 ? d >>> 15 : d)) | 0
												x = (d + 7) | 0
												d = ((x ? e >>> x : e) & 1) | (d << 1)
											}
										while (0)
										b = (71496 + (d << 2)) | 0
										f[(k + 28) >> 2] = d
										a = (k + 16) | 0
										f[(a + 4) >> 2] = 0
										f[a >> 2] = 0
										a = f[17799] | 0
										c = 1 << d
										if (!(a & c)) {
											f[17799] = a | c
											f[b >> 2] = k
											f[(k + 24) >> 2] = b
											f[(k + 12) >> 2] = k
											f[(k + 8) >> 2] = k
											break
										}
										b = f[b >> 2] | 0
										i: do
											if (((f[(b + 4) >> 2] & -8) | 0) != (e | 0)) {
												d = e << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0)
												while (1) {
													c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0
													a = f[c >> 2] | 0
													if (!a) break
													if (((f[(a + 4) >> 2] & -8) | 0) == (e | 0)) {
														b = a
														break i
													} else {
														d = d << 1
														b = a
													}
												}
												f[c >> 2] = k
												f[(k + 24) >> 2] = b
												f[(k + 12) >> 2] = k
												f[(k + 8) >> 2] = k
												break g
											}
										while (0)
										w = (b + 8) | 0
										x = f[w >> 2] | 0
										f[(x + 12) >> 2] = k
										f[w >> 2] = k
										f[(k + 8) >> 2] = x
										f[(k + 12) >> 2] = b
										f[(k + 24) >> 2] = 0
									}
								while (0)
								x = (l + 8) | 0
								t = y
								return x | 0
							}
							b = 71640
							while (1) {
								a = f[b >> 2] | 0
								if (
									a >>> 0 <= j >>> 0
										? ((x = (a + (f[(b + 4) >> 2] | 0)) | 0), x >>> 0 > j >>> 0)
										: 0
								)
									break
								b = f[(b + 8) >> 2] | 0
							}
							e = (x + -47) | 0
							a = (e + 8) | 0
							a = (e + (((a & 7) | 0) == 0 ? 0 : (0 - a) & 7)) | 0
							e = (j + 16) | 0
							a = a >>> 0 < e >>> 0 ? j : a
							b = (a + 8) | 0
							c = (h + -40) | 0
							v = (g + 8) | 0
							v = ((v & 7) | 0) == 0 ? 0 : (0 - v) & 7
							w = (g + v) | 0
							v = (c - v) | 0
							f[17804] = w
							f[17801] = v
							f[(w + 4) >> 2] = v | 1
							f[(g + c + 4) >> 2] = 40
							f[17805] = f[17920]
							c = (a + 4) | 0
							f[c >> 2] = 27
							f[b >> 2] = f[17910]
							f[(b + 4) >> 2] = f[17911]
							f[(b + 8) >> 2] = f[17912]
							f[(b + 12) >> 2] = f[17913]
							f[17910] = g
							f[17911] = h
							f[17913] = 0
							f[17912] = b
							b = (a + 24) | 0
							do {
								w = b
								b = (b + 4) | 0
								f[b >> 2] = 7
							} while (((w + 8) | 0) >>> 0 < x >>> 0)
							if ((a | 0) != (j | 0)) {
								g = (a - j) | 0
								f[c >> 2] = f[c >> 2] & -2
								f[(j + 4) >> 2] = g | 1
								f[a >> 2] = g
								b = 3 ? g >>> 3 : g
								if (g >>> 0 < 256) {
									c = (71232 + ((b << 1) << 2)) | 0
									a = f[17798] | 0
									b = 1 << b
									if (!(a & b)) {
										f[17798] = a | b
										b = c
										a = (c + 8) | 0
									} else {
										a = (c + 8) | 0
										b = f[a >> 2] | 0
									}
									f[a >> 2] = j
									f[(b + 12) >> 2] = j
									f[(j + 8) >> 2] = b
									f[(j + 12) >> 2] = c
									break
								}
								b = 8 ? g >>> 8 : g
								if (b)
									if (g >>> 0 > 16777215) d = 31
									else {
										w = (b + 1048320) | 0
										w = (16 ? w >>> 16 : w) & 8
										d = b << w
										v = (d + 520192) | 0
										v = (16 ? v >>> 16 : v) & 4
										d = d << v
										x = (d + 245760) | 0
										x = (16 ? x >>> 16 : x) & 2
										d = d << x
										d = (14 - (v | w | x) + (15 ? d >>> 15 : d)) | 0
										x = (d + 7) | 0
										d = ((x ? g >>> x : g) & 1) | (d << 1)
									}
								else d = 0
								c = (71496 + (d << 2)) | 0
								f[(j + 28) >> 2] = d
								f[(j + 20) >> 2] = 0
								f[e >> 2] = 0
								b = f[17799] | 0
								a = 1 << d
								if (!(b & a)) {
									f[17799] = b | a
									f[c >> 2] = j
									f[(j + 24) >> 2] = c
									f[(j + 12) >> 2] = j
									f[(j + 8) >> 2] = j
									break
								}
								b = f[c >> 2] | 0
								j: do
									if (((f[(b + 4) >> 2] & -8) | 0) != (g | 0)) {
										d = g << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0)
										while (1) {
											c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0
											a = f[c >> 2] | 0
											if (!a) break
											if (((f[(a + 4) >> 2] & -8) | 0) == (g | 0)) {
												b = a
												break j
											} else {
												d = d << 1
												b = a
											}
										}
										f[c >> 2] = j
										f[(j + 24) >> 2] = b
										f[(j + 12) >> 2] = j
										f[(j + 8) >> 2] = j
										break f
									}
								while (0)
								w = (b + 8) | 0
								x = f[w >> 2] | 0
								f[(x + 12) >> 2] = j
								f[w >> 2] = j
								f[(j + 8) >> 2] = x
								f[(j + 12) >> 2] = b
								f[(j + 24) >> 2] = 0
							}
						} else {
							x = f[17802] | 0
							if (((x | 0) == 0) | (g >>> 0 < x >>> 0)) f[17802] = g
							f[17910] = g
							f[17911] = h
							f[17913] = 0
							f[17807] = f[17916]
							f[17806] = -1
							f[17811] = 71232
							f[17810] = 71232
							f[17813] = 71240
							f[17812] = 71240
							f[17815] = 71248
							f[17814] = 71248
							f[17817] = 71256
							f[17816] = 71256
							f[17819] = 71264
							f[17818] = 71264
							f[17821] = 71272
							f[17820] = 71272
							f[17823] = 71280
							f[17822] = 71280
							f[17825] = 71288
							f[17824] = 71288
							f[17827] = 71296
							f[17826] = 71296
							f[17829] = 71304
							f[17828] = 71304
							f[17831] = 71312
							f[17830] = 71312
							f[17833] = 71320
							f[17832] = 71320
							f[17835] = 71328
							f[17834] = 71328
							f[17837] = 71336
							f[17836] = 71336
							f[17839] = 71344
							f[17838] = 71344
							f[17841] = 71352
							f[17840] = 71352
							f[17843] = 71360
							f[17842] = 71360
							f[17845] = 71368
							f[17844] = 71368
							f[17847] = 71376
							f[17846] = 71376
							f[17849] = 71384
							f[17848] = 71384
							f[17851] = 71392
							f[17850] = 71392
							f[17853] = 71400
							f[17852] = 71400
							f[17855] = 71408
							f[17854] = 71408
							f[17857] = 71416
							f[17856] = 71416
							f[17859] = 71424
							f[17858] = 71424
							f[17861] = 71432
							f[17860] = 71432
							f[17863] = 71440
							f[17862] = 71440
							f[17865] = 71448
							f[17864] = 71448
							f[17867] = 71456
							f[17866] = 71456
							f[17869] = 71464
							f[17868] = 71464
							f[17871] = 71472
							f[17870] = 71472
							f[17873] = 71480
							f[17872] = 71480
							x = (h + -40) | 0
							v = (g + 8) | 0
							v = ((v & 7) | 0) == 0 ? 0 : (0 - v) & 7
							w = (g + v) | 0
							v = (x - v) | 0
							f[17804] = w
							f[17801] = v
							f[(w + 4) >> 2] = v | 1
							f[(g + x + 4) >> 2] = 40
							f[17805] = f[17920]
						}
					while (0)
					b = f[17801] | 0
					if (b >>> 0 > m >>> 0) {
						v = (b - m) | 0
						f[17801] = v
						x = f[17804] | 0
						w = (x + m) | 0
						f[17804] = w
						f[(w + 4) >> 2] = v | 1
						f[(x + 4) >> 2] = m | 3
						x = (x + 8) | 0
						t = y
						return x | 0
					}
				}
				x = Me() | 0
				f[x >> 2] = 12
				x = 0
				t = y
				return x | 0
			}
			function Nf(a) {
				a = a | 0
				var b = 0,
					c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0
				if (!a) return
				c = (a + -8) | 0
				e = f[17802] | 0
				a = f[(a + -4) >> 2] | 0
				b = a & -8
				j = (c + b) | 0
				do
					if (!(a & 1)) {
						d = f[c >> 2] | 0
						if (!(a & 3)) return
						h = (c + (0 - d)) | 0
						g = (d + b) | 0
						if (h >>> 0 < e >>> 0) return
						if ((f[17803] | 0) == (h | 0)) {
							a = (j + 4) | 0
							b = f[a >> 2] | 0
							if (((b & 3) | 0) != 3) {
								i = h
								b = g
								break
							}
							f[17800] = g
							f[a >> 2] = b & -2
							f[(h + 4) >> 2] = g | 1
							f[(h + g) >> 2] = g
							return
						}
						c = 3 ? d >>> 3 : d
						if (d >>> 0 < 256) {
							a = f[(h + 8) >> 2] | 0
							b = f[(h + 12) >> 2] | 0
							if ((b | 0) == (a | 0)) {
								f[17798] = f[17798] & ~(1 << c)
								i = h
								b = g
								break
							} else {
								f[(a + 12) >> 2] = b
								f[(b + 8) >> 2] = a
								i = h
								b = g
								break
							}
						}
						e = f[(h + 24) >> 2] | 0
						a = f[(h + 12) >> 2] | 0
						do
							if ((a | 0) == (h | 0)) {
								b = (h + 16) | 0
								c = (b + 4) | 0
								a = f[c >> 2] | 0
								if (!a) {
									a = f[b >> 2] | 0
									if (!a) {
										a = 0
										break
									}
								} else b = c
								while (1) {
									d = (a + 20) | 0
									c = f[d >> 2] | 0
									if (!c) {
										d = (a + 16) | 0
										c = f[d >> 2] | 0
										if (!c) break
										else {
											a = c
											b = d
										}
									} else {
										a = c
										b = d
									}
								}
								f[b >> 2] = 0
							} else {
								i = f[(h + 8) >> 2] | 0
								f[(i + 12) >> 2] = a
								f[(a + 8) >> 2] = i
							}
						while (0)
						if (e) {
							b = f[(h + 28) >> 2] | 0
							c = (71496 + (b << 2)) | 0
							if ((f[c >> 2] | 0) == (h | 0)) {
								f[c >> 2] = a
								if (!a) {
									f[17799] = f[17799] & ~(1 << b)
									i = h
									b = g
									break
								}
							} else {
								i = (e + 16) | 0
								f[((f[i >> 2] | 0) == (h | 0) ? i : (e + 20) | 0) >> 2] = a
								if (!a) {
									i = h
									b = g
									break
								}
							}
							f[(a + 24) >> 2] = e
							b = (h + 16) | 0
							c = f[b >> 2] | 0
							if (c | 0) {
								f[(a + 16) >> 2] = c
								f[(c + 24) >> 2] = a
							}
							b = f[(b + 4) >> 2] | 0
							if (b) {
								f[(a + 20) >> 2] = b
								f[(b + 24) >> 2] = a
								i = h
								b = g
							} else {
								i = h
								b = g
							}
						} else {
							i = h
							b = g
						}
					} else {
						i = c
						h = c
					}
				while (0)
				if (h >>> 0 >= j >>> 0) return
				a = (j + 4) | 0
				d = f[a >> 2] | 0
				if (!(d & 1)) return
				if (!(d & 2)) {
					if ((f[17804] | 0) == (j | 0)) {
						j = ((f[17801] | 0) + b) | 0
						f[17801] = j
						f[17804] = i
						f[(i + 4) >> 2] = j | 1
						if ((i | 0) != (f[17803] | 0)) return
						f[17803] = 0
						f[17800] = 0
						return
					}
					if ((f[17803] | 0) == (j | 0)) {
						j = ((f[17800] | 0) + b) | 0
						f[17800] = j
						f[17803] = h
						f[(i + 4) >> 2] = j | 1
						f[(h + j) >> 2] = j
						return
					}
					e = ((d & -8) + b) | 0
					c = 3 ? d >>> 3 : d
					do
						if (d >>> 0 < 256) {
							b = f[(j + 8) >> 2] | 0
							a = f[(j + 12) >> 2] | 0
							if ((a | 0) == (b | 0)) {
								f[17798] = f[17798] & ~(1 << c)
								break
							} else {
								f[(b + 12) >> 2] = a
								f[(a + 8) >> 2] = b
								break
							}
						} else {
							g = f[(j + 24) >> 2] | 0
							a = f[(j + 12) >> 2] | 0
							do
								if ((a | 0) == (j | 0)) {
									b = (j + 16) | 0
									c = (b + 4) | 0
									a = f[c >> 2] | 0
									if (!a) {
										a = f[b >> 2] | 0
										if (!a) {
											c = 0
											break
										}
									} else b = c
									while (1) {
										d = (a + 20) | 0
										c = f[d >> 2] | 0
										if (!c) {
											d = (a + 16) | 0
											c = f[d >> 2] | 0
											if (!c) break
											else {
												a = c
												b = d
											}
										} else {
											a = c
											b = d
										}
									}
									f[b >> 2] = 0
									c = a
								} else {
									c = f[(j + 8) >> 2] | 0
									f[(c + 12) >> 2] = a
									f[(a + 8) >> 2] = c
									c = a
								}
							while (0)
							if (g | 0) {
								a = f[(j + 28) >> 2] | 0
								b = (71496 + (a << 2)) | 0
								if ((f[b >> 2] | 0) == (j | 0)) {
									f[b >> 2] = c
									if (!c) {
										f[17799] = f[17799] & ~(1 << a)
										break
									}
								} else {
									d = (g + 16) | 0
									f[((f[d >> 2] | 0) == (j | 0) ? d : (g + 20) | 0) >> 2] = c
									if (!c) break
								}
								f[(c + 24) >> 2] = g
								a = (j + 16) | 0
								b = f[a >> 2] | 0
								if (b | 0) {
									f[(c + 16) >> 2] = b
									f[(b + 24) >> 2] = c
								}
								a = f[(a + 4) >> 2] | 0
								if (a | 0) {
									f[(c + 20) >> 2] = a
									f[(a + 24) >> 2] = c
								}
							}
						}
					while (0)
					f[(i + 4) >> 2] = e | 1
					f[(h + e) >> 2] = e
					if ((i | 0) == (f[17803] | 0)) {
						f[17800] = e
						return
					}
				} else {
					f[a >> 2] = d & -2
					f[(i + 4) >> 2] = b | 1
					f[(h + b) >> 2] = b
					e = b
				}
				a = 3 ? e >>> 3 : e
				if (e >>> 0 < 256) {
					c = (71232 + ((a << 1) << 2)) | 0
					b = f[17798] | 0
					a = 1 << a
					if (!(b & a)) {
						f[17798] = b | a
						a = c
						b = (c + 8) | 0
					} else {
						b = (c + 8) | 0
						a = f[b >> 2] | 0
					}
					f[b >> 2] = i
					f[(a + 12) >> 2] = i
					f[(i + 8) >> 2] = a
					f[(i + 12) >> 2] = c
					return
				}
				a = 8 ? e >>> 8 : e
				if (a)
					if (e >>> 0 > 16777215) d = 31
					else {
						h = (a + 1048320) | 0
						h = (16 ? h >>> 16 : h) & 8
						d = a << h
						g = (d + 520192) | 0
						g = (16 ? g >>> 16 : g) & 4
						d = d << g
						j = (d + 245760) | 0
						j = (16 ? j >>> 16 : j) & 2
						d = d << j
						d = (14 - (g | h | j) + (15 ? d >>> 15 : d)) | 0
						j = (d + 7) | 0
						d = ((j ? e >>> j : e) & 1) | (d << 1)
					}
				else d = 0
				a = (71496 + (d << 2)) | 0
				f[(i + 28) >> 2] = d
				f[(i + 20) >> 2] = 0
				f[(i + 16) >> 2] = 0
				b = f[17799] | 0
				c = 1 << d
				a: do
					if (!(b & c)) {
						f[17799] = b | c
						f[a >> 2] = i
						f[(i + 24) >> 2] = a
						f[(i + 12) >> 2] = i
						f[(i + 8) >> 2] = i
					} else {
						a = f[a >> 2] | 0
						b: do
							if (((f[(a + 4) >> 2] & -8) | 0) != (e | 0)) {
								d = e << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0)
								while (1) {
									c = (a + 16 + ((31 ? d >>> 31 : d) << 2)) | 0
									b = f[c >> 2] | 0
									if (!b) break
									if (((f[(b + 4) >> 2] & -8) | 0) == (e | 0)) {
										a = b
										break b
									} else {
										d = d << 1
										a = b
									}
								}
								f[c >> 2] = i
								f[(i + 24) >> 2] = a
								f[(i + 12) >> 2] = i
								f[(i + 8) >> 2] = i
								break a
							}
						while (0)
						h = (a + 8) | 0
						j = f[h >> 2] | 0
						f[(j + 12) >> 2] = i
						f[h >> 2] = i
						f[(i + 8) >> 2] = j
						f[(i + 12) >> 2] = a
						f[(i + 24) >> 2] = 0
					}
				while (0)
				j = ((f[17806] | 0) + -1) | 0
				f[17806] = j
				if (j | 0) return
				a = 71648
				while (1) {
					a = f[a >> 2] | 0
					if (!a) break
					else a = (a + 8) | 0
				}
				f[17806] = -1
				return
			}
			function Of(a, b) {
				a = a | 0
				b = b | 0
				var c = 0
				if (a) {
					c = U(b, a) | 0
					if ((b | a) >>> 0 > 65535) c = (((c >>> 0) / (a >>> 0)) | 0 | 0) == (b | 0) ? c : -1
				} else c = 0
				a = Mf(c) | 0
				if (!a) return a | 0
				if (!(f[(a + -4) >> 2] & 3)) return a | 0
				bh(a | 0, 0, c | 0) | 0
				return a | 0
			}
			function Pf(a) {
				a = a | 0
				var b = 0
				b = (a | 0) == 0 ? 1 : a
				while (1) {
					a = Mf(b) | 0
					if (a | 0) break
					a = Og() | 0
					if (!a) {
						a = 0
						break
					}
					qc[a & 3]()
				}
				return a | 0
			}
			function Qf(a) {
				a = a | 0
				Nf(a)
				return
			}
			function Rf(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0
				d = Bf(b) | 0
				c = Pf((d + 13) | 0) | 0
				f[c >> 2] = d
				f[(c + 4) >> 2] = d
				f[(c + 8) >> 2] = 0
				c = Sf(c) | 0
				$g(c | 0, b | 0, (d + 1) | 0) | 0
				f[a >> 2] = c
				return
			}
			function Sf(a) {
				a = a | 0
				return (a + 12) | 0
			}
			function Tf(a, b) {
				a = a | 0
				b = b | 0
				f[a >> 2] = 8204
				Rf((a + 4) | 0, b)
				return
			}
			function Uf(a) {
				a = a | 0
				return 1
			}
			function Vf(a) {
				a = a | 0
				gb()
			}
			function Wf() {
				var a = 0,
					b = 0,
					c = 0,
					d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0
				a = t
				t = (t + 48) | 0
				if ((t | 0) >= (u | 0)) da(48)
				h = (a + 32) | 0
				c = (a + 24) | 0
				i = (a + 16) | 0
				g = a
				d = (a + 36) | 0
				a = Xf() | 0
				if (a | 0 ? ((e = f[a >> 2] | 0), e | 0) : 0) {
					a = (e + 48) | 0
					b = f[a >> 2] | 0
					a = f[(a + 4) >> 2] | 0
					if (!((((b & -256) | 0) == 1126902528) & ((a | 0) == 1129074247))) {
						f[c >> 2] = 10785
						Yf(10735, c)
					}
					if (((b | 0) == 1126902529) & ((a | 0) == 1129074247)) a = f[(e + 44) >> 2] | 0
					else a = (e + 80) | 0
					f[d >> 2] = a
					e = f[e >> 2] | 0
					a = f[(e + 4) >> 2] | 0
					if (oc[f[((f[1796] | 0) + 16) >> 2] & 15](7184, e, d) | 0) {
						i = f[d >> 2] | 0
						i = mc[f[((f[i >> 2] | 0) + 8) >> 2] & 15](i) | 0
						f[g >> 2] = 10785
						f[(g + 4) >> 2] = a
						f[(g + 8) >> 2] = i
						Yf(10649, g)
					} else {
						f[i >> 2] = 10785
						f[(i + 4) >> 2] = a
						Yf(10694, i)
					}
				}
				Yf(10773, h)
			}
			function Xf() {
				var a = 0,
					b = 0
				a = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				if (!(nb(71688, 3) | 0)) {
					b = lb(f[17923] | 0) | 0
					t = a
					return b | 0
				} else Yf(10924, a)
				return 0
			}
			function Yf(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0
				c = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				d = c
				f[d >> 2] = b
				c = f[1902] | 0
				Re(c, a, d) | 0
				Kf(10, c) | 0
				gb()
			}
			function Zf(a) {
				a = a | 0
				return
			}
			function _f(a) {
				a = a | 0
				Zf(a)
				Qf(a)
				return
			}
			function $f(a) {
				a = a | 0
				return
			}
			function ag(a) {
				a = a | 0
				return
			}
			function bg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0
				h = t
				t = (t + 64) | 0
				if ((t | 0) >= (u | 0)) da(64)
				e = h
				if (!(fg(a, b, 0) | 0))
					if ((b | 0) != 0 ? ((g = jg(b, 7208, 7192, 0) | 0), (g | 0) != 0) : 0) {
						b = (e + 4) | 0
						d = (b + 52) | 0
						do {
							f[b >> 2] = 0
							b = (b + 4) | 0
						} while ((b | 0) < (d | 0))
						f[e >> 2] = g
						f[(e + 8) >> 2] = a
						f[(e + 12) >> 2] = -1
						f[(e + 48) >> 2] = 1
						uc[f[((f[g >> 2] | 0) + 28) >> 2] & 7](g, e, f[c >> 2] | 0, 1)
						if ((f[(e + 24) >> 2] | 0) == 1) {
							f[c >> 2] = f[(e + 16) >> 2]
							b = 1
						} else b = 0
					} else b = 0
				else b = 1
				t = h
				return b | 0
			}
			function cg(a, b, c, d, e, g) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				if (fg(a, f[(b + 8) >> 2] | 0, g) | 0) ig(0, b, c, d, e)
				return
			}
			function dg(a, c, d, e, g) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				var h = 0
				do
					if (!(fg(a, f[(c + 8) >> 2] | 0, g) | 0)) {
						if (fg(a, f[c >> 2] | 0, g) | 0) {
							if (
								(f[(c + 16) >> 2] | 0) != (d | 0)
									? ((h = (c + 20) | 0), (f[h >> 2] | 0) != (d | 0))
									: 0
							) {
								f[(c + 32) >> 2] = e
								f[h >> 2] = d
								g = (c + 40) | 0
								f[g >> 2] = (f[g >> 2] | 0) + 1
								if ((f[(c + 36) >> 2] | 0) == 1 ? (f[(c + 24) >> 2] | 0) == 2 : 0)
									b[(c + 54) >> 0] = 1
								f[(c + 44) >> 2] = 4
								break
							}
							if ((e | 0) == 1) f[(c + 32) >> 2] = 1
						}
					} else hg(0, c, d, e)
				while (0)
				return
			}
			function eg(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				if (fg(a, f[(b + 8) >> 2] | 0, 0) | 0) gg(0, b, c, d)
				return
			}
			function fg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				return ((a | 0) == (b | 0)) | 0
			}
			function gg(a, c, d, e) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				var g = 0
				a = (c + 16) | 0
				g = f[a >> 2] | 0
				do
					if (g) {
						if ((g | 0) != (d | 0)) {
							e = (c + 36) | 0
							f[e >> 2] = (f[e >> 2] | 0) + 1
							f[(c + 24) >> 2] = 2
							b[(c + 54) >> 0] = 1
							break
						}
						a = (c + 24) | 0
						if ((f[a >> 2] | 0) == 2) f[a >> 2] = e
					} else {
						f[a >> 2] = d
						f[(c + 24) >> 2] = e
						f[(c + 36) >> 2] = 1
					}
				while (0)
				return
			}
			function hg(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0
				if ((f[(b + 4) >> 2] | 0) == (c | 0) ? ((e = (b + 28) | 0), (f[e >> 2] | 0) != 1) : 0)
					f[e >> 2] = d
				return
			}
			function ig(a, c, d, e, g) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				b[(c + 53) >> 0] = 1
				do
					if ((f[(c + 4) >> 2] | 0) == (e | 0)) {
						b[(c + 52) >> 0] = 1
						a = (c + 16) | 0
						e = f[a >> 2] | 0
						if (!e) {
							f[a >> 2] = d
							f[(c + 24) >> 2] = g
							f[(c + 36) >> 2] = 1
							if (!((g | 0) == 1 ? (f[(c + 48) >> 2] | 0) == 1 : 0)) break
							b[(c + 54) >> 0] = 1
							break
						}
						if ((e | 0) != (d | 0)) {
							g = (c + 36) | 0
							f[g >> 2] = (f[g >> 2] | 0) + 1
							b[(c + 54) >> 0] = 1
							break
						}
						e = (c + 24) | 0
						a = f[e >> 2] | 0
						if ((a | 0) == 2) {
							f[e >> 2] = g
							a = g
						}
						if ((a | 0) == 1 ? (f[(c + 48) >> 2] | 0) == 1 : 0) b[(c + 54) >> 0] = 1
					}
				while (0)
				return
			}
			function jg(a, c, e, g) {
				a = a | 0
				c = c | 0
				e = e | 0
				g = g | 0
				var h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0
				p = t
				t = (t + 64) | 0
				if ((t | 0) >= (u | 0)) da(64)
				n = p
				m = f[a >> 2] | 0
				o = (a + (f[(m + -8) >> 2] | 0)) | 0
				m = f[(m + -4) >> 2] | 0
				f[n >> 2] = e
				f[(n + 4) >> 2] = a
				f[(n + 8) >> 2] = c
				f[(n + 12) >> 2] = g
				a = (n + 16) | 0
				c = (n + 20) | 0
				g = (n + 24) | 0
				h = (n + 28) | 0
				i = (n + 32) | 0
				j = (n + 40) | 0
				k = a
				l = (k + 36) | 0
				do {
					f[k >> 2] = 0
					k = (k + 4) | 0
				} while ((k | 0) < (l | 0))
				d[(a + 36) >> 1] = 0
				b[(a + 38) >> 0] = 0
				a: do
					if (fg(m, e, 0) | 0) {
						f[(n + 48) >> 2] = 1
						wc[f[((f[m >> 2] | 0) + 20) >> 2] & 3](m, n, o, o, 1, 0)
						a = (f[g >> 2] | 0) == 1 ? o : 0
					} else {
						vc[f[((f[m >> 2] | 0) + 24) >> 2] & 3](m, n, o, 1, 0)
						switch (f[(n + 36) >> 2] | 0) {
							case 0: {
								a =
									((f[j >> 2] | 0) == 1) & ((f[h >> 2] | 0) == 1) & ((f[i >> 2] | 0) == 1)
										? f[c >> 2] | 0
										: 0
								break a
							}
							case 1:
								break
							default: {
								a = 0
								break a
							}
						}
						if (
							(f[g >> 2] | 0) != 1
								? !(((f[j >> 2] | 0) == 0) & ((f[h >> 2] | 0) == 1) & ((f[i >> 2] | 0) == 1))
								: 0
						) {
							a = 0
							break
						}
						a = f[a >> 2] | 0
					}
				while (0)
				t = p
				return a | 0
			}
			function kg(a) {
				a = a | 0
				Zf(a)
				Qf(a)
				return
			}
			function lg(a, b, c, d, e, g) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				if (fg(a, f[(b + 8) >> 2] | 0, g) | 0) ig(0, b, c, d, e)
				else {
					a = f[(a + 8) >> 2] | 0
					wc[f[((f[a >> 2] | 0) + 20) >> 2] & 3](a, b, c, d, e, g)
				}
				return
			}
			function mg(a, c, d, e, g) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				var h = 0,
					i = 0,
					j = 0
				do
					if (!(fg(a, f[(c + 8) >> 2] | 0, g) | 0)) {
						if (!(fg(a, f[c >> 2] | 0, g) | 0)) {
							i = f[(a + 8) >> 2] | 0
							vc[f[((f[i >> 2] | 0) + 24) >> 2] & 3](i, c, d, e, g)
							break
						}
						if (
							(f[(c + 16) >> 2] | 0) != (d | 0)
								? ((h = (c + 20) | 0), (f[h >> 2] | 0) != (d | 0))
								: 0
						) {
							f[(c + 32) >> 2] = e
							i = (c + 44) | 0
							if ((f[i >> 2] | 0) == 4) break
							e = (c + 52) | 0
							b[e >> 0] = 0
							j = (c + 53) | 0
							b[j >> 0] = 0
							a = f[(a + 8) >> 2] | 0
							wc[f[((f[a >> 2] | 0) + 20) >> 2] & 3](a, c, d, d, 1, g)
							if (b[j >> 0] | 0)
								if (!(b[e >> 0] | 0)) {
									e = 1
									a = 11
								} else a = 15
							else {
								e = 0
								a = 11
							}
							do
								if ((a | 0) == 11) {
									f[h >> 2] = d
									j = (c + 40) | 0
									f[j >> 2] = (f[j >> 2] | 0) + 1
									if ((f[(c + 36) >> 2] | 0) == 1 ? (f[(c + 24) >> 2] | 0) == 2 : 0) {
										b[(c + 54) >> 0] = 1
										if (e) {
											a = 15
											break
										} else {
											e = 4
											break
										}
									}
									if (e) a = 15
									else e = 4
								}
							while (0)
							if ((a | 0) == 15) e = 3
							f[i >> 2] = e
							break
						}
						if ((e | 0) == 1) f[(c + 32) >> 2] = 1
					} else hg(0, c, d, e)
				while (0)
				return
			}
			function ng(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				if (fg(a, f[(b + 8) >> 2] | 0, 0) | 0) gg(0, b, c, d)
				else {
					a = f[(a + 8) >> 2] | 0
					uc[f[((f[a >> 2] | 0) + 28) >> 2] & 7](a, b, c, d)
				}
				return
			}
			function og(a) {
				a = a | 0
				return
			}
			function pg() {
				var a = 0
				a = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				if (!(mb(71692, 17) | 0)) {
					t = a
					return
				} else Yf(10973, a)
			}
			function qg(a) {
				a = a | 0
				var b = 0
				b = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				Nf(a)
				if (!(ob(f[17923] | 0, 0) | 0)) {
					t = b
					return
				} else Yf(11023, b)
			}
			function rg() {
				var a = 0,
					b = 0
				a = Xf() | 0
				if (
					(a | 0 ? ((b = f[a >> 2] | 0), b | 0) : 0)
						? ((a = (b + 48) | 0),
							((f[a >> 2] & -256) | 0) == 1126902528 ? (f[(a + 4) >> 2] | 0) == 1129074247 : 0)
						: 0
				)
					sg(f[(b + 12) >> 2] | 0)
				sg(tg() | 0)
			}
			function sg(a) {
				a = a | 0
				var b = 0
				b = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				qc[a & 3]()
				Yf(11076, b)
			}
			function tg() {
				var a = 0
				a = f[2028] | 0
				f[2028] = a + 0
				return a | 0
			}
			function ug(a) {
				a = a | 0
				return
			}
			function vg(a) {
				a = a | 0
				f[a >> 2] = 8204
				zg((a + 4) | 0)
				return
			}
			function wg(a) {
				a = a | 0
				vg(a)
				Qf(a)
				return
			}
			function xg(a) {
				a = a | 0
				return yg((a + 4) | 0) | 0
			}
			function yg(a) {
				a = a | 0
				return f[a >> 2] | 0
			}
			function zg(a) {
				a = a | 0
				var b = 0,
					c = 0
				if (
					Uf(a) | 0
						? ((b = Ag(f[a >> 2] | 0) | 0),
							(c = (b + 8) | 0),
							(a = f[c >> 2] | 0),
							(f[c >> 2] = a + -1),
							((a + -1) | 0) < 0)
						: 0
				)
					Qf(b)
				return
			}
			function Ag(a) {
				a = a | 0
				return (a + -12) | 0
			}
			function Bg(a) {
				a = a | 0
				vg(a)
				Qf(a)
				return
			}
			function Cg(a) {
				a = a | 0
				Zf(a)
				Qf(a)
				return
			}
			function Dg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				return fg(a, b, 0) | 0
			}
			function Eg(a) {
				a = a | 0
				Zf(a)
				Qf(a)
				return
			}
			function Fg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0,
					g = 0,
					h = 0,
					i = 0,
					j = 0
				j = t
				t = (t + 64) | 0
				if ((t | 0) >= (u | 0)) da(64)
				h = j
				f[c >> 2] = f[f[c >> 2] >> 2]
				if (!(Gg(a, b, 0) | 0))
					if (
						((b | 0) != 0 ? ((d = jg(b, 7208, 7296, 0) | 0), (d | 0) != 0) : 0)
							? ((f[(d + 8) >> 2] & ~f[(a + 8) >> 2]) | 0) == 0
							: 0
					) {
						a = (a + 12) | 0
						b = (d + 12) | 0
						if (
							!(fg(f[a >> 2] | 0, f[b >> 2] | 0, 0) | 0) ? !(fg(f[a >> 2] | 0, 7328, 0) | 0) : 0
						) {
							a = f[a >> 2] | 0
							if (
								(
									((a | 0) != 0 ? ((g = jg(a, 7208, 7192, 0) | 0), (g | 0) != 0) : 0)
										? ((e = f[b >> 2] | 0), (e | 0) != 0)
										: 0
								)
									? ((i = jg(e, 7208, 7192, 0) | 0), (i | 0) != 0)
									: 0
							) {
								a = (h + 4) | 0
								b = (a + 52) | 0
								do {
									f[a >> 2] = 0
									a = (a + 4) | 0
								} while ((a | 0) < (b | 0))
								f[h >> 2] = i
								f[(h + 8) >> 2] = g
								f[(h + 12) >> 2] = -1
								f[(h + 48) >> 2] = 1
								uc[f[((f[i >> 2] | 0) + 28) >> 2] & 7](i, h, f[c >> 2] | 0, 1)
								if ((f[(h + 24) >> 2] | 0) == 1) {
									f[c >> 2] = f[(h + 16) >> 2]
									a = 1
								} else a = 0
							} else a = 0
						} else a = 1
					} else a = 0
				else a = 1
				t = j
				return a | 0
			}
			function Gg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				if (fg(a, b, 0) | 0) a = 1
				else a = fg(b, 7336, 0) | 0
				return a | 0
			}
			function Hg(a) {
				a = a | 0
				Zf(a)
				Qf(a)
				return
			}
			function Ig(a, c, d, e, g, h) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				h = h | 0
				var i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0
				if (fg(a, f[(c + 8) >> 2] | 0, h) | 0) ig(0, c, d, e, g)
				else {
					p = (c + 52) | 0
					i = b[p >> 0] | 0
					j = (c + 53) | 0
					k = b[j >> 0] | 0
					o = f[(a + 12) >> 2] | 0
					l = (a + 16 + (o << 3)) | 0
					b[p >> 0] = 0
					b[j >> 0] = 0
					Mg((a + 16) | 0, c, d, e, g, h)
					a: do
						if ((o | 0) > 1) {
							m = (c + 24) | 0
							n = (a + 8) | 0
							o = (c + 54) | 0
							a = (a + 24) | 0
							do {
								if (b[o >> 0] | 0) break a
								if (!(b[p >> 0] | 0)) {
									if (b[j >> 0] | 0 ? ((f[n >> 2] & 1) | 0) == 0 : 0) break a
								} else {
									if ((f[m >> 2] | 0) == 1) break a
									if (!(f[n >> 2] & 2)) break a
								}
								b[p >> 0] = 0
								b[j >> 0] = 0
								Mg(a, c, d, e, g, h)
								a = (a + 8) | 0
							} while (a >>> 0 < l >>> 0)
						}
					while (0)
					b[p >> 0] = i
					b[j >> 0] = k
				}
				return
			}
			function Jg(a, c, d, e, g) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				var h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0,
					q = 0
				a: do
					if (!(fg(a, f[(c + 8) >> 2] | 0, g) | 0)) {
						if (!(fg(a, f[c >> 2] | 0, g) | 0)) {
							q = f[(a + 12) >> 2] | 0
							k = (a + 16 + (q << 3)) | 0
							Ng((a + 16) | 0, c, d, e, g)
							h = (a + 24) | 0
							if ((q | 0) <= 1) break
							a = f[(a + 8) >> 2] | 0
							if (((a & 2) | 0) == 0 ? ((j = (c + 36) | 0), (f[j >> 2] | 0) != 1) : 0) {
								if (!(a & 1)) {
									a = (c + 54) | 0
									while (1) {
										if (b[a >> 0] | 0) break a
										if ((f[j >> 2] | 0) == 1) break a
										Ng(h, c, d, e, g)
										h = (h + 8) | 0
										if (h >>> 0 >= k >>> 0) break a
									}
								}
								a = (c + 24) | 0
								i = (c + 54) | 0
								while (1) {
									if (b[i >> 0] | 0) break a
									if ((f[j >> 2] | 0) == 1 ? (f[a >> 2] | 0) == 1 : 0) break a
									Ng(h, c, d, e, g)
									h = (h + 8) | 0
									if (h >>> 0 >= k >>> 0) break a
								}
							}
							a = (c + 54) | 0
							while (1) {
								if (b[a >> 0] | 0) break a
								Ng(h, c, d, e, g)
								h = (h + 8) | 0
								if (h >>> 0 >= k >>> 0) break a
							}
						}
						if (
							(f[(c + 16) >> 2] | 0) != (d | 0)
								? ((q = (c + 20) | 0), (f[q >> 2] | 0) != (d | 0))
								: 0
						) {
							f[(c + 32) >> 2] = e
							p = (c + 44) | 0
							if ((f[p >> 2] | 0) == 4) break
							k = (a + 16 + (f[(a + 12) >> 2] << 3)) | 0
							e = (c + 52) | 0
							l = (c + 53) | 0
							n = (c + 54) | 0
							m = (a + 8) | 0
							o = (c + 24) | 0
							h = 0
							i = (a + 16) | 0
							j = 0
							b: while (1) {
								if (i >>> 0 >= k >>> 0) {
									a = 18
									break
								}
								b[e >> 0] = 0
								b[l >> 0] = 0
								Mg(i, c, d, d, 1, g)
								if (b[n >> 0] | 0) {
									a = 18
									break
								}
								do
									if (b[l >> 0] | 0) {
										if (!(b[e >> 0] | 0))
											if (!(f[m >> 2] & 1)) {
												h = 1
												a = 18
												break b
											} else {
												h = 1
												a = j
												break
											}
										if ((f[o >> 2] | 0) == 1) {
											a = 23
											break b
										}
										if (!(f[m >> 2] & 2)) {
											a = 23
											break b
										} else {
											h = 1
											a = 1
										}
									} else a = j
								while (0)
								i = (i + 8) | 0
								j = a
							}
							do
								if ((a | 0) == 18) {
									if (
										(
											!j
												? ((f[q >> 2] = d),
													(d = (c + 40) | 0),
													(f[d >> 2] = (f[d >> 2] | 0) + 1),
													(f[(c + 36) >> 2] | 0) == 1)
												: 0
										)
											? (f[o >> 2] | 0) == 2
											: 0
									) {
										b[n >> 0] = 1
										if (h) {
											a = 23
											break
										} else {
											h = 4
											break
										}
									}
									if (h) a = 23
									else h = 4
								}
							while (0)
							if ((a | 0) == 23) h = 3
							f[p >> 2] = h
							break
						}
						if ((e | 0) == 1) f[(c + 32) >> 2] = 1
					} else hg(0, c, d, e)
				while (0)
				return
			}
			function Kg(a, c, d, e) {
				a = a | 0
				c = c | 0
				d = d | 0
				e = e | 0
				var g = 0,
					h = 0
				a: do
					if (!(fg(a, f[(c + 8) >> 2] | 0, 0) | 0)) {
						h = f[(a + 12) >> 2] | 0
						g = (a + 16 + (h << 3)) | 0
						Lg((a + 16) | 0, c, d, e)
						if ((h | 0) > 1) {
							h = (c + 54) | 0
							a = (a + 24) | 0
							do {
								Lg(a, c, d, e)
								if (b[h >> 0] | 0) break a
								a = (a + 8) | 0
							} while (a >>> 0 < g >>> 0)
						}
					} else gg(0, c, d, e)
				while (0)
				return
			}
			function Lg(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0
				g = f[(a + 4) >> 2] | 0
				e = 8 ? g >> 8 : g
				if (g & 1) e = f[((f[c >> 2] | 0) + e) >> 2] | 0
				a = f[a >> 2] | 0
				uc[f[((f[a >> 2] | 0) + 28) >> 2] & 7](a, b, (c + e) | 0, ((g & 2) | 0) == 0 ? 2 : d)
				return
			}
			function Mg(a, b, c, d, e, g) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				g = g | 0
				var h = 0,
					i = 0
				i = f[(a + 4) >> 2] | 0
				h = 8 ? i >> 8 : i
				if (i & 1) h = f[((f[d >> 2] | 0) + h) >> 2] | 0
				a = f[a >> 2] | 0
				wc[f[((f[a >> 2] | 0) + 20) >> 2] & 3](a, b, c, (d + h) | 0, ((i & 2) | 0) == 0 ? 2 : e, g)
				return
			}
			function Ng(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				var g = 0,
					h = 0
				h = f[(a + 4) >> 2] | 0
				g = 8 ? h >> 8 : h
				if (h & 1) g = f[((f[c >> 2] | 0) + g) >> 2] | 0
				a = f[a >> 2] | 0
				vc[f[((f[a >> 2] | 0) + 24) >> 2] & 3](a, b, (c + g) | 0, ((h & 2) | 0) == 0 ? 2 : d, e)
				return
			}
			function Og() {
				var a = 0
				a = f[17924] | 0
				f[17924] = a + 0
				return a | 0
			}
			function Pg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				var d = 0,
					e = 0
				e = t
				t = (t + 16) | 0
				if ((t | 0) >= (u | 0)) da(16)
				d = e
				f[d >> 2] = f[c >> 2]
				a = oc[f[((f[a >> 2] | 0) + 16) >> 2] & 15](a, b, d) | 0
				if (a) f[c >> 2] = f[d >> 2]
				t = e
				return (a & 1) | 0
			}
			function Qg(a) {
				a = a | 0
				if (!a) a = 0
				else a = ((jg(a, 7208, 7296, 0) | 0) != 0) & 1
				return a | 0
			}
			function Rg(a, b) {
				a = a | 0
				b = b | 0
				var c = 0,
					d = 0,
					e = 0,
					f = 0
				f = a & 65535
				e = b & 65535
				c = U(e, f) | 0
				d = a >>> 16
				a = ((c >>> 16) + (U(e, d) | 0)) | 0
				e = b >>> 16
				b = U(e, f) | 0
				return (
					(aa(((a >>> 16) + (U(e, d) | 0) + ((((a & 65535) + b) | 0) >>> 16)) | 0),
					((a + b) << 16) | (c & 65535) | 0) | 0
				)
			}
			function Sg(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				var e = 0,
					f = 0
				e = a
				f = c
				c = Rg(e, f) | 0
				a = ba() | 0
				return (aa(((U(b, f) | 0) + (U(d, e) | 0) + a) | (a & 0) | 0), c | 0 | 0) | 0
			}
			function Tg(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				c = (a + c) >>> 0
				return (aa(((b + d + ((c >>> 0 < a >>> 0) | 0)) >>> 0) | 0), c | 0) | 0
			}
			function Ug(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				d = (b - d - ((c >>> 0 > a >>> 0) | 0)) >>> 0
				return (aa(d | 0), ((a - c) >>> 0) | 0) | 0
			}
			function Vg(a) {
				a = a | 0
				return (a ? (31 - (X(a ^ (a - 1)) | 0)) | 0 : 32) | 0
			}
			function Wg(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				var g = 0,
					h = 0,
					i = 0,
					j = 0,
					k = 0,
					l = 0,
					m = 0,
					n = 0,
					o = 0,
					p = 0
				l = a
				j = b
				k = j
				h = c
				n = d
				i = n
				if (!k) {
					g = (e | 0) != 0
					if (!i) {
						if (g) {
							f[e >> 2] = (l >>> 0) % (h >>> 0)
							f[(e + 4) >> 2] = 0
						}
						n = 0
						e = ((l >>> 0) / (h >>> 0)) >>> 0
						return (aa(n | 0), e) | 0
					} else {
						if (!g) {
							n = 0
							e = 0
							return (aa(n | 0), e) | 0
						}
						f[e >> 2] = a | 0
						f[(e + 4) >> 2] = b & 0
						n = 0
						e = 0
						return (aa(n | 0), e) | 0
					}
				}
				g = (i | 0) == 0
				do
					if (h) {
						if (!g) {
							g = ((X(i | 0) | 0) - (X(k | 0) | 0)) | 0
							if (g >>> 0 <= 31) {
								m = (g + 1) | 0
								i = (31 - g) | 0
								b = (g - 31) >> 31
								h = m
								a = ((l >>> (m >>> 0)) & b) | (k << i)
								b = (k >>> (m >>> 0)) & b
								g = 0
								i = l << i
								break
							}
							if (!e) {
								n = 0
								e = 0
								return (aa(n | 0), e) | 0
							}
							f[e >> 2] = a | 0
							f[(e + 4) >> 2] = j | (b & 0)
							n = 0
							e = 0
							return (aa(n | 0), e) | 0
						}
						g = (h - 1) | 0
						if ((g & h) | 0) {
							i = ((X(h | 0) | 0) + 33 - (X(k | 0) | 0)) | 0
							p = (64 - i) | 0
							m = (32 - i) | 0
							j = m >> 31
							o = (i - 32) | 0
							b = o >> 31
							h = i
							a = (((m - 1) >> 31) & (k >>> (o >>> 0))) | (((k << m) | (l >>> (i >>> 0))) & b)
							b = b & (k >>> (i >>> 0))
							g = (l << p) & j
							i = (((k << p) | (l >>> (o >>> 0))) & j) | ((l << m) & ((i - 33) >> 31))
							break
						}
						if (e | 0) {
							f[e >> 2] = g & l
							f[(e + 4) >> 2] = 0
						}
						if ((h | 0) == 1) {
							o = j | (b & 0)
							p = a | 0 | 0
							return (aa(o | 0), p) | 0
						} else {
							p = Vg(h | 0) | 0
							o = (k >>> (p >>> 0)) | 0
							p = (k << (32 - p)) | (l >>> (p >>> 0)) | 0
							return (aa(o | 0), p) | 0
						}
					} else {
						if (g) {
							if (e | 0) {
								f[e >> 2] = (k >>> 0) % (h >>> 0)
								f[(e + 4) >> 2] = 0
							}
							o = 0
							p = ((k >>> 0) / (h >>> 0)) >>> 0
							return (aa(o | 0), p) | 0
						}
						if (!l) {
							if (e | 0) {
								f[e >> 2] = 0
								f[(e + 4) >> 2] = (k >>> 0) % (i >>> 0)
							}
							o = 0
							p = ((k >>> 0) / (i >>> 0)) >>> 0
							return (aa(o | 0), p) | 0
						}
						g = (i - 1) | 0
						if (!(g & i)) {
							if (e | 0) {
								f[e >> 2] = a | 0
								f[(e + 4) >> 2] = (g & k) | (b & 0)
							}
							o = 0
							p = k >>> ((Vg(i | 0) | 0) >>> 0)
							return (aa(o | 0), p) | 0
						}
						g = ((X(i | 0) | 0) - (X(k | 0) | 0)) | 0
						if (g >>> 0 <= 30) {
							b = (g + 1) | 0
							i = (31 - g) | 0
							h = b
							a = (k << i) | (l >>> (b >>> 0))
							b = k >>> (b >>> 0)
							g = 0
							i = l << i
							break
						}
						if (!e) {
							o = 0
							p = 0
							return (aa(o | 0), p) | 0
						}
						f[e >> 2] = a | 0
						f[(e + 4) >> 2] = j | (b & 0)
						o = 0
						p = 0
						return (aa(o | 0), p) | 0
					}
				while (0)
				if (!h) {
					k = i
					j = 0
					i = 0
				} else {
					m = c | 0 | 0
					l = n | (d & 0)
					k = Tg(m | 0, l | 0, -1, -1) | 0
					c = ba() | 0
					j = i
					i = 0
					do {
						d = j
						j = (g >>> 31) | (j << 1)
						g = i | (g << 1)
						d = (a << 1) | (d >>> 31) | 0
						n = (a >>> 31) | (b << 1) | 0
						Ug(k | 0, c | 0, d | 0, n | 0) | 0
						p = ba() | 0
						o = (p >> 31) | (((p | 0) < 0 ? -1 : 0) << 1)
						i = o & 1
						a =
							Ug(
								d | 0,
								n | 0,
								(o & m) | 0,
								(((((p | 0) < 0 ? -1 : 0) >> 31) | (((p | 0) < 0 ? -1 : 0) << 1)) & l) | 0,
							) | 0
						b = ba() | 0
						h = (h - 1) | 0
					} while ((h | 0) != 0)
					k = j
					j = 0
				}
				h = 0
				if (e | 0) {
					f[e >> 2] = a
					f[(e + 4) >> 2] = b
				}
				o = ((g | 0) >>> 31) | ((k | h) << 1) | (((h << 1) | (g >>> 31)) & 0) | j
				p = (((g << 1) | (0 >>> 31)) & -2) | i
				return (aa(o | 0), p) | 0
			}
			function Xg(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				return Wg(a, b, c, d, 0) | 0
			}
			function Yg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				if ((c | 0) < 32) {
					aa((b >>> c) | 0)
					return (a >>> c) | ((b & ((1 << c) - 1)) << (32 - c))
				}
				aa(0)
				return (b >>> (c - 32)) | 0
			}
			function Zg(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				if ((c | 0) < 32) {
					aa((b << c) | ((a & (((1 << c) - 1) << (32 - c))) >>> (32 - c)) | 0)
					return a << c
				}
				aa((a << (c - 32)) | 0)
				return 0
			}
			function _g(a) {
				a = a | 0
				return (
					((a & 255) << 24) | (((a >> 8) & 255) << 16) | (((a >> 16) & 255) << 8) | (a >>> 24) | 0
				)
			}
			function $g(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0
				if ((d | 0) >= 8192) return ib(a | 0, c | 0, d | 0) | 0
				h = a | 0
				g = (a + d) | 0
				if ((a & 3) == (c & 3)) {
					while (a & 3) {
						if (!d) return h | 0
						b[a >> 0] = b[c >> 0] | 0
						a = (a + 1) | 0
						c = (c + 1) | 0
						d = (d - 1) | 0
					}
					d = (g & -4) | 0
					e = (d - 64) | 0
					while ((a | 0) <= (e | 0)) {
						f[a >> 2] = f[c >> 2]
						f[(a + 4) >> 2] = f[(c + 4) >> 2]
						f[(a + 8) >> 2] = f[(c + 8) >> 2]
						f[(a + 12) >> 2] = f[(c + 12) >> 2]
						f[(a + 16) >> 2] = f[(c + 16) >> 2]
						f[(a + 20) >> 2] = f[(c + 20) >> 2]
						f[(a + 24) >> 2] = f[(c + 24) >> 2]
						f[(a + 28) >> 2] = f[(c + 28) >> 2]
						f[(a + 32) >> 2] = f[(c + 32) >> 2]
						f[(a + 36) >> 2] = f[(c + 36) >> 2]
						f[(a + 40) >> 2] = f[(c + 40) >> 2]
						f[(a + 44) >> 2] = f[(c + 44) >> 2]
						f[(a + 48) >> 2] = f[(c + 48) >> 2]
						f[(a + 52) >> 2] = f[(c + 52) >> 2]
						f[(a + 56) >> 2] = f[(c + 56) >> 2]
						f[(a + 60) >> 2] = f[(c + 60) >> 2]
						a = (a + 64) | 0
						c = (c + 64) | 0
					}
					while ((a | 0) < (d | 0)) {
						f[a >> 2] = f[c >> 2]
						a = (a + 4) | 0
						c = (c + 4) | 0
					}
				} else {
					d = (g - 4) | 0
					while ((a | 0) < (d | 0)) {
						b[a >> 0] = b[c >> 0] | 0
						b[(a + 1) >> 0] = b[(c + 1) >> 0] | 0
						b[(a + 2) >> 0] = b[(c + 2) >> 0] | 0
						b[(a + 3) >> 0] = b[(c + 3) >> 0] | 0
						a = (a + 4) | 0
						c = (c + 4) | 0
					}
				}
				while ((a | 0) < (g | 0)) {
					b[a >> 0] = b[c >> 0] | 0
					a = (a + 1) | 0
					c = (c + 1) | 0
				}
				return h | 0
			}
			function ah(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0
				if (((c | 0) < (a | 0)) & ((a | 0) < ((c + d) | 0))) {
					e = a
					c = (c + d) | 0
					a = (a + d) | 0
					while ((d | 0) > 0) {
						a = (a - 1) | 0
						c = (c - 1) | 0
						d = (d - 1) | 0
						b[a >> 0] = b[c >> 0] | 0
					}
					a = e
				} else $g(a, c, d) | 0
				return a | 0
			}
			function bh(a, c, d) {
				a = a | 0
				c = c | 0
				d = d | 0
				var e = 0,
					g = 0,
					h = 0,
					i = 0
				h = (a + d) | 0
				c = c & 255
				if ((d | 0) >= 67) {
					while (a & 3) {
						b[a >> 0] = c
						a = (a + 1) | 0
					}
					e = (h & -4) | 0
					g = (e - 64) | 0
					i = c | (c << 8) | (c << 16) | (c << 24)
					while ((a | 0) <= (g | 0)) {
						f[a >> 2] = i
						f[(a + 4) >> 2] = i
						f[(a + 8) >> 2] = i
						f[(a + 12) >> 2] = i
						f[(a + 16) >> 2] = i
						f[(a + 20) >> 2] = i
						f[(a + 24) >> 2] = i
						f[(a + 28) >> 2] = i
						f[(a + 32) >> 2] = i
						f[(a + 36) >> 2] = i
						f[(a + 40) >> 2] = i
						f[(a + 44) >> 2] = i
						f[(a + 48) >> 2] = i
						f[(a + 52) >> 2] = i
						f[(a + 56) >> 2] = i
						f[(a + 60) >> 2] = i
						a = (a + 64) | 0
					}
					while ((a | 0) < (e | 0)) {
						f[a >> 2] = i
						a = (a + 4) | 0
					}
				}
				while ((a | 0) < (h | 0)) {
					b[a >> 0] = c
					a = (a + 1) | 0
				}
				return (h - d) | 0
			}
			function ch(a) {
				a = a | 0
				var b = 0,
					c = 0
				c = f[r >> 2] | 0
				b = (c + a) | 0
				if ((((a | 0) > 0) & ((b | 0) < (c | 0))) | ((b | 0) < 0)) {
					ca() | 0
					Ma(12)
					return -1
				}
				f[r >> 2] = b
				if ((b | 0) > ($() | 0) ? (_() | 0) == 0 : 0) {
					f[r >> 2] = c
					Ma(12)
					return -1
				}
				return c | 0
			}
			function dh(a) {
				a = a | 0
				return +jc[a & 1]()
			}
			function eh(a, b) {
				a = a | 0
				b = b | 0
				return +kc[a & 1](b | 0)
			}
			function fh(a) {
				a = a | 0
				return lc[a & 3]() | 0
			}
			function gh(a, b) {
				a = a | 0
				b = b | 0
				return mc[a & 15](b | 0) | 0
			}
			function hh(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				return nc[a & 7](b | 0, c | 0) | 0
			}
			function ih(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				return oc[a & 15](b | 0, c | 0, d | 0) | 0
			}
			function jh(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				return pc[a & 3](b | 0, c | 0, d | 0, e | 0) | 0
			}
			function kh(a) {
				a = a | 0
				qc[a & 3]()
			}
			function lh(a, b) {
				a = a | 0
				b = b | 0
				rc[a & 31](b | 0)
			}
			function mh(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				sc[a & 3](b | 0, c | 0)
			}
			function nh(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				tc[a & 7](b | 0, c | 0, d | 0)
			}
			function oh(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				uc[a & 7](b | 0, c | 0, d | 0, e | 0)
			}
			function ph(a, b, c, d, e, f) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				f = f | 0
				vc[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0)
			}
			function qh(a, b, c, d, e, f, g) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				f = f | 0
				g = g | 0
				wc[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0)
			}
			function rh() {
				ea(0)
				return 0.0
			}
			function sh(a) {
				a = a | 0
				fa(0)
				return 0.0
			}
			function th() {
				ga(0)
				return 0
			}
			function uh() {
				ga(3)
				return 0
			}
			function vh(a) {
				a = a | 0
				ha(0)
				return 0
			}
			function wh(a) {
				a = a | 0
				ha(14)
				return 0
			}
			function xh(a) {
				a = a | 0
				ha(15)
				return 0
			}
			function yh(a, b) {
				a = a | 0
				b = b | 0
				ia(0)
				return 0
			}
			function zh(a, b) {
				a = a | 0
				b = b | 0
				ia(6)
				return 0
			}
			function Ah(a, b) {
				a = a | 0
				b = b | 0
				ia(7)
				return 0
			}
			function Bh(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				ja(0)
				return 0
			}
			function Ch(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				ja(12)
				return 0
			}
			function Dh(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				ja(13)
				return 0
			}
			function Eh(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				ja(14)
				return 0
			}
			function Fh(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				ja(15)
				return 0
			}
			function Gh(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				ka(0)
				return 0
			}
			function Hh(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				ka(3)
				return 0
			}
			function Ih() {
				la(0)
			}
			function Jh(a) {
				a = a | 0
				ma(0)
			}
			function Kh(a) {
				a = a | 0
				ma(18)
			}
			function Lh(a) {
				a = a | 0
				ma(19)
			}
			function Mh(a) {
				a = a | 0
				ma(20)
			}
			function Nh(a) {
				a = a | 0
				ma(21)
			}
			function Oh(a) {
				a = a | 0
				ma(22)
			}
			function Ph(a) {
				a = a | 0
				ma(23)
			}
			function Qh(a) {
				a = a | 0
				ma(24)
			}
			function Rh(a) {
				a = a | 0
				ma(25)
			}
			function Sh(a) {
				a = a | 0
				ma(26)
			}
			function Th(a) {
				a = a | 0
				ma(27)
			}
			function Uh(a) {
				a = a | 0
				ma(28)
			}
			function Vh(a) {
				a = a | 0
				ma(29)
			}
			function Wh(a) {
				a = a | 0
				ma(30)
			}
			function Xh(a) {
				a = a | 0
				ma(31)
			}
			function Yh(a, b) {
				a = a | 0
				b = b | 0
				na(0)
			}
			function Zh(a, b) {
				a = a | 0
				b = b | 0
				na(3)
			}
			function _h(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				oa(0)
			}
			function $h(a, b, c) {
				a = a | 0
				b = b | 0
				c = c | 0
				oa(7)
			}
			function ai(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				pa(0)
			}
			function bi(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				pa(6)
			}
			function ci(a, b, c, d) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				pa(7)
			}
			function di(a, b, c, d, e) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				qa(0)
			}
			function ei(a, b, c, d, e, f) {
				a = a | 0
				b = b | 0
				c = c | 0
				d = d | 0
				e = e | 0
				f = f | 0
				ra(0)
			}

			// EMSCRIPTEN_END_FUNCS
			var jc = [rh, Vd]
			var kc = [sh, Ud]
			var lc = [th, re, ae, uh]
			var mc = [vh, Ie, xg, Kd, Nd, Qd, Sd, Wd, oe, qe, we, Zd, $d, fe, wh, xh]
			var nc = [yh, cd, Jd, Pd, xe, ge, zh, Ah]
			var oc = [Bh, Je, Ke, Oe, bg, Dg, Fg, Od, ze, Ae, ie, je, Ch, Dh, Eh, Fh]
			var pc = [Gh, Be, ke, Hh]
			var qc = [Ih, Wf, Md, pg]
			var rc = [
				Jh,
				Zf,
				_f,
				$f,
				ag,
				kg,
				vg,
				wg,
				Bg,
				Cg,
				Eg,
				Hg,
				Ld,
				Rd,
				Td,
				pe,
				_d,
				qg,
				Kh,
				Lh,
				Mh,
				Nh,
				Oh,
				Ph,
				Qh,
				Rh,
				Sh,
				Th,
				Uh,
				Vh,
				Wh,
				Xh,
			]
			var sc = [Yh, se, be, Zh]
			var tc = [_h, te, ue, ye, ce, de, he, $h]
			var uc = [ai, eg, ng, Kg, ve, ee, bi, ci]
			var vc = [di, dg, mg, Jg]
			var wc = [ei, cg, lg, Ig]
			return {
				_PowerEPD_FrameProc_JS: Pd,
				__GLOBAL__sub_I_PowerEPD_WB_cpp: Hd,
				__GLOBAL__sub_I_bind_cpp: Fe,
				___cxa_can_catch: Pg,
				___cxa_is_pointer_type: Qg,
				___errno_location: Me,
				___getTypeName: He,
				___muldi3: Sg,
				___udivdi3: Xg,
				_bitshift64Lshr: Yg,
				_bitshift64Shl: Zg,
				_emscripten_replace_memory: ic,
				_fflush: If,
				_free: Nf,
				_i64Add: Tg,
				_i64Subtract: Ug,
				_llvm_bswap_i32: _g,
				_malloc: Mf,
				_memcpy: $g,
				_memmove: ah,
				_memset: bh,
				_sbrk: ch,
				dynCall_d: dh,
				dynCall_di: eh,
				dynCall_i: fh,
				dynCall_ii: gh,
				dynCall_iii: hh,
				dynCall_iiii: ih,
				dynCall_iiiii: jh,
				dynCall_v: kh,
				dynCall_vi: lh,
				dynCall_vii: mh,
				dynCall_viii: nh,
				dynCall_viiii: oh,
				dynCall_viiiii: ph,
				dynCall_viiiiii: qh,
				establishStackSpace: Ac,
				setThrew: Bc,
				stackAlloc: xc,
				stackRestore: zc,
				stackSave: yc,
			}
		})(
			// EMSCRIPTEN_END_ASM
			Module.asmGlobalArg,
			Module.asmLibraryArg,
			buffer,
		)
		var real__PowerEPD_FrameProc_JS = asm['_PowerEPD_FrameProc_JS']
		asm['_PowerEPD_FrameProc_JS'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__PowerEPD_FrameProc_JS.apply(null, arguments)
		}
		var real___GLOBAL__sub_I_PowerEPD_WB_cpp = asm['__GLOBAL__sub_I_PowerEPD_WB_cpp']
		asm['__GLOBAL__sub_I_PowerEPD_WB_cpp'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real___GLOBAL__sub_I_PowerEPD_WB_cpp.apply(null, arguments)
		}
		var real___GLOBAL__sub_I_bind_cpp = asm['__GLOBAL__sub_I_bind_cpp']
		asm['__GLOBAL__sub_I_bind_cpp'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real___GLOBAL__sub_I_bind_cpp.apply(null, arguments)
		}
		var real____cxa_can_catch = asm['___cxa_can_catch']
		asm['___cxa_can_catch'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real____cxa_can_catch.apply(null, arguments)
		}
		var real____cxa_is_pointer_type = asm['___cxa_is_pointer_type']
		asm['___cxa_is_pointer_type'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real____cxa_is_pointer_type.apply(null, arguments)
		}
		var real____errno_location = asm['___errno_location']
		asm['___errno_location'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real____errno_location.apply(null, arguments)
		}
		var real____getTypeName = asm['___getTypeName']
		asm['___getTypeName'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real____getTypeName.apply(null, arguments)
		}
		var real____muldi3 = asm['___muldi3']
		asm['___muldi3'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real____muldi3.apply(null, arguments)
		}
		var real____udivdi3 = asm['___udivdi3']
		asm['___udivdi3'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real____udivdi3.apply(null, arguments)
		}
		var real__bitshift64Lshr = asm['_bitshift64Lshr']
		asm['_bitshift64Lshr'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__bitshift64Lshr.apply(null, arguments)
		}
		var real__bitshift64Shl = asm['_bitshift64Shl']
		asm['_bitshift64Shl'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__bitshift64Shl.apply(null, arguments)
		}
		var real__fflush = asm['_fflush']
		asm['_fflush'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__fflush.apply(null, arguments)
		}
		var real__free = asm['_free']
		asm['_free'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__free.apply(null, arguments)
		}
		var real__i64Add = asm['_i64Add']
		asm['_i64Add'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__i64Add.apply(null, arguments)
		}
		var real__i64Subtract = asm['_i64Subtract']
		asm['_i64Subtract'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__i64Subtract.apply(null, arguments)
		}
		var real__llvm_bswap_i32 = asm['_llvm_bswap_i32']
		asm['_llvm_bswap_i32'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__llvm_bswap_i32.apply(null, arguments)
		}
		var real__malloc = asm['_malloc']
		asm['_malloc'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__malloc.apply(null, arguments)
		}
		var real__memmove = asm['_memmove']
		asm['_memmove'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__memmove.apply(null, arguments)
		}
		var real__sbrk = asm['_sbrk']
		asm['_sbrk'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real__sbrk.apply(null, arguments)
		}
		var real_establishStackSpace = asm['establishStackSpace']
		asm['establishStackSpace'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real_establishStackSpace.apply(null, arguments)
		}
		var real_setThrew = asm['setThrew']
		asm['setThrew'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real_setThrew.apply(null, arguments)
		}
		var real_stackAlloc = asm['stackAlloc']
		asm['stackAlloc'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real_stackAlloc.apply(null, arguments)
		}
		var real_stackRestore = asm['stackRestore']
		asm['stackRestore'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real_stackRestore.apply(null, arguments)
		}
		var real_stackSave = asm['stackSave']
		asm['stackSave'] = function () {
			assert(
				runtimeInitialized,
				'you need to wait for the runtime to be ready (e.g. wait for main() to be called)',
			)
			assert(
				!runtimeExited,
				'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)',
			)
			return real_stackSave.apply(null, arguments)
		}
		var _PowerEPD_FrameProc_JS = (Module['_PowerEPD_FrameProc_JS'] = asm['_PowerEPD_FrameProc_JS'])
		var __GLOBAL__sub_I_PowerEPD_WB_cpp = (Module['__GLOBAL__sub_I_PowerEPD_WB_cpp'] =
			asm['__GLOBAL__sub_I_PowerEPD_WB_cpp'])
		var __GLOBAL__sub_I_bind_cpp = (Module['__GLOBAL__sub_I_bind_cpp'] =
			asm['__GLOBAL__sub_I_bind_cpp'])
		var ___cxa_can_catch = (Module['___cxa_can_catch'] = asm['___cxa_can_catch'])
		var ___cxa_is_pointer_type = (Module['___cxa_is_pointer_type'] = asm['___cxa_is_pointer_type'])
		var ___errno_location = (Module['___errno_location'] = asm['___errno_location'])
		var ___getTypeName = (Module['___getTypeName'] = asm['___getTypeName'])
		var ___muldi3 = (Module['___muldi3'] = asm['___muldi3'])
		var ___udivdi3 = (Module['___udivdi3'] = asm['___udivdi3'])
		var _bitshift64Lshr = (Module['_bitshift64Lshr'] = asm['_bitshift64Lshr'])
		var _bitshift64Shl = (Module['_bitshift64Shl'] = asm['_bitshift64Shl'])
		var _emscripten_replace_memory = (Module['_emscripten_replace_memory'] =
			asm['_emscripten_replace_memory'])
		var _fflush = (Module['_fflush'] = asm['_fflush'])
		var _free = (Module['_free'] = asm['_free'])
		var _i64Add = (Module['_i64Add'] = asm['_i64Add'])
		var _i64Subtract = (Module['_i64Subtract'] = asm['_i64Subtract'])
		var _llvm_bswap_i32 = (Module['_llvm_bswap_i32'] = asm['_llvm_bswap_i32'])
		var _malloc = (Module['_malloc'] = asm['_malloc'])
		var _memcpy = (Module['_memcpy'] = asm['_memcpy'])
		var _memmove = (Module['_memmove'] = asm['_memmove'])
		var _memset = (Module['_memset'] = asm['_memset'])
		var _sbrk = (Module['_sbrk'] = asm['_sbrk'])
		var establishStackSpace = (Module['establishStackSpace'] = asm['establishStackSpace'])
		var setThrew = (Module['setThrew'] = asm['setThrew'])
		var stackAlloc = (Module['stackAlloc'] = asm['stackAlloc'])
		var stackRestore = (Module['stackRestore'] = asm['stackRestore'])
		var stackSave = (Module['stackSave'] = asm['stackSave'])
		var dynCall_d = (Module['dynCall_d'] = asm['dynCall_d'])
		var dynCall_di = (Module['dynCall_di'] = asm['dynCall_di'])
		var dynCall_i = (Module['dynCall_i'] = asm['dynCall_i'])
		var dynCall_ii = (Module['dynCall_ii'] = asm['dynCall_ii'])
		var dynCall_iii = (Module['dynCall_iii'] = asm['dynCall_iii'])
		var dynCall_iiii = (Module['dynCall_iiii'] = asm['dynCall_iiii'])
		var dynCall_iiiii = (Module['dynCall_iiiii'] = asm['dynCall_iiiii'])
		var dynCall_v = (Module['dynCall_v'] = asm['dynCall_v'])
		var dynCall_vi = (Module['dynCall_vi'] = asm['dynCall_vi'])
		var dynCall_vii = (Module['dynCall_vii'] = asm['dynCall_vii'])
		var dynCall_viii = (Module['dynCall_viii'] = asm['dynCall_viii'])
		var dynCall_viiii = (Module['dynCall_viiii'] = asm['dynCall_viiii'])
		var dynCall_viiiii = (Module['dynCall_viiiii'] = asm['dynCall_viiiii'])
		var dynCall_viiiiii = (Module['dynCall_viiiiii'] = asm['dynCall_viiiiii'])
		Module['asm'] = asm
		if (!Module['intArrayFromString'])
			Module['intArrayFromString'] = function () {
				abort(
					"'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['intArrayToString'])
			Module['intArrayToString'] = function () {
				abort(
					"'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		Module['ccall'] = ccall
		Module['cwrap'] = cwrap
		Module['setValue'] = setValue
		Module['getValue'] = getValue
		if (!Module['allocate'])
			Module['allocate'] = function () {
				abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['getMemory'])
			Module['getMemory'] = function () {
				abort(
					"'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['Pointer_stringify'])
			Module['Pointer_stringify'] = function () {
				abort(
					"'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['AsciiToString'])
			Module['AsciiToString'] = function () {
				abort(
					"'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stringToAscii'])
			Module['stringToAscii'] = function () {
				abort(
					"'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['UTF8ArrayToString'])
			Module['UTF8ArrayToString'] = function () {
				abort(
					"'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['UTF8ToString'])
			Module['UTF8ToString'] = function () {
				abort(
					"'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stringToUTF8Array'])
			Module['stringToUTF8Array'] = function () {
				abort(
					"'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stringToUTF8'])
			Module['stringToUTF8'] = function () {
				abort(
					"'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['lengthBytesUTF8'])
			Module['lengthBytesUTF8'] = function () {
				abort(
					"'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['UTF16ToString'])
			Module['UTF16ToString'] = function () {
				abort(
					"'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stringToUTF16'])
			Module['stringToUTF16'] = function () {
				abort(
					"'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['lengthBytesUTF16'])
			Module['lengthBytesUTF16'] = function () {
				abort(
					"'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['UTF32ToString'])
			Module['UTF32ToString'] = function () {
				abort(
					"'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stringToUTF32'])
			Module['stringToUTF32'] = function () {
				abort(
					"'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['lengthBytesUTF32'])
			Module['lengthBytesUTF32'] = function () {
				abort(
					"'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['allocateUTF8'])
			Module['allocateUTF8'] = function () {
				abort(
					"'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stackTrace'])
			Module['stackTrace'] = function () {
				abort(
					"'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addOnPreRun'])
			Module['addOnPreRun'] = function () {
				abort(
					"'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addOnInit'])
			Module['addOnInit'] = function () {
				abort(
					"'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addOnPreMain'])
			Module['addOnPreMain'] = function () {
				abort(
					"'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addOnExit'])
			Module['addOnExit'] = function () {
				abort(
					"'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addOnPostRun'])
			Module['addOnPostRun'] = function () {
				abort(
					"'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['writeStringToMemory'])
			Module['writeStringToMemory'] = function () {
				abort(
					"'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['writeArrayToMemory'])
			Module['writeArrayToMemory'] = function () {
				abort(
					"'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['writeAsciiToMemory'])
			Module['writeAsciiToMemory'] = function () {
				abort(
					"'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addRunDependency'])
			Module['addRunDependency'] = function () {
				abort(
					"'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['removeRunDependency'])
			Module['removeRunDependency'] = function () {
				abort(
					"'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['ENV'])
			Module['ENV'] = function () {
				abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['FS'])
			Module['FS'] = function () {
				abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['FS_createFolder'])
			Module['FS_createFolder'] = function () {
				abort(
					"'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_createPath'])
			Module['FS_createPath'] = function () {
				abort(
					"'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_createDataFile'])
			Module['FS_createDataFile'] = function () {
				abort(
					"'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_createPreloadedFile'])
			Module['FS_createPreloadedFile'] = function () {
				abort(
					"'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_createLazyFile'])
			Module['FS_createLazyFile'] = function () {
				abort(
					"'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_createLink'])
			Module['FS_createLink'] = function () {
				abort(
					"'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_createDevice'])
			Module['FS_createDevice'] = function () {
				abort(
					"'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['FS_unlink'])
			Module['FS_unlink'] = function () {
				abort(
					"'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you",
				)
			}
		if (!Module['GL'])
			Module['GL'] = function () {
				abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['staticAlloc'])
			Module['staticAlloc'] = function () {
				abort(
					"'staticAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['dynamicAlloc'])
			Module['dynamicAlloc'] = function () {
				abort(
					"'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['warnOnce'])
			Module['warnOnce'] = function () {
				abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['loadDynamicLibrary'])
			Module['loadDynamicLibrary'] = function () {
				abort(
					"'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['loadWebAssemblyModule'])
			Module['loadWebAssemblyModule'] = function () {
				abort(
					"'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['getLEB'])
			Module['getLEB'] = function () {
				abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['getFunctionTables'])
			Module['getFunctionTables'] = function () {
				abort(
					"'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['alignFunctionTables'])
			Module['alignFunctionTables'] = function () {
				abort(
					"'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['registerFunctions'])
			Module['registerFunctions'] = function () {
				abort(
					"'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['addFunction'])
			Module['addFunction'] = function () {
				abort(
					"'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['removeFunction'])
			Module['removeFunction'] = function () {
				abort(
					"'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['getFuncWrapper'])
			Module['getFuncWrapper'] = function () {
				abort(
					"'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['prettyPrint'])
			Module['prettyPrint'] = function () {
				abort(
					"'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['makeBigInt'])
			Module['makeBigInt'] = function () {
				abort(
					"'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['dynCall'])
			Module['dynCall'] = function () {
				abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['getCompilerSetting'])
			Module['getCompilerSetting'] = function () {
				abort(
					"'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stackSave'])
			Module['stackSave'] = function () {
				abort(
					"'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stackRestore'])
			Module['stackRestore'] = function () {
				abort(
					"'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['stackAlloc'])
			Module['stackAlloc'] = function () {
				abort(
					"'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['establishStackSpace'])
			Module['establishStackSpace'] = function () {
				abort(
					"'establishStackSpace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['print'])
			Module['print'] = function () {
				abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['printErr'])
			Module['printErr'] = function () {
				abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)")
			}
		if (!Module['intArrayFromBase64'])
			Module['intArrayFromBase64'] = function () {
				abort(
					"'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['tryParseAsDataURI'])
			Module['tryParseAsDataURI'] = function () {
				abort(
					"'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
				)
			}
		if (!Module['ALLOC_NORMAL'])
			Object.defineProperty(Module, 'ALLOC_NORMAL', {
				get: function () {
					abort(
						"'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
					)
				},
			})
		if (!Module['ALLOC_STACK'])
			Object.defineProperty(Module, 'ALLOC_STACK', {
				get: function () {
					abort(
						"'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
					)
				},
			})
		if (!Module['ALLOC_STATIC'])
			Object.defineProperty(Module, 'ALLOC_STATIC', {
				get: function () {
					abort(
						"'ALLOC_STATIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
					)
				},
			})
		if (!Module['ALLOC_DYNAMIC'])
			Object.defineProperty(Module, 'ALLOC_DYNAMIC', {
				get: function () {
					abort(
						"'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
					)
				},
			})
		if (!Module['ALLOC_NONE'])
			Object.defineProperty(Module, 'ALLOC_NONE', {
				get: function () {
					abort(
						"'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)",
					)
				},
			})
		if (memoryInitializer) {
			if (!isDataURI(memoryInitializer)) {
				memoryInitializer = locateFile(memoryInitializer)
			}
			if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
				var data = Module['readBinary'](memoryInitializer)
				HEAPU8.set(data, GLOBAL_BASE)
			} else {
				addRunDependency('memory initializer')
				var applyMemoryInitializer = function (data) {
					if (data.byteLength) data = new Uint8Array(data)
					for (var i = 0; i < data.length; i++) {
						assert(
							HEAPU8[GLOBAL_BASE + i] === 0,
							"area for memory initializer should not have been touched before it's loaded",
						)
					}
					HEAPU8.set(data, GLOBAL_BASE)
					if (Module['memoryInitializerRequest']) delete Module['memoryInitializerRequest'].response
					removeRunDependency('memory initializer')
				}
				function doBrowserLoad() {
					Module['readAsync'](memoryInitializer, applyMemoryInitializer, function () {
						throw 'could not load memory initializer ' + memoryInitializer
					})
				}
				var memoryInitializerBytes = tryParseAsDataURI(memoryInitializer)
				if (memoryInitializerBytes) {
					applyMemoryInitializer(memoryInitializerBytes.buffer)
				} else if (Module['memoryInitializerRequest']) {
					function useRequest() {
						var request = Module['memoryInitializerRequest']
						var response = request.response
						if (request.status !== 200 && request.status !== 0) {
							var data = tryParseAsDataURI(Module['memoryInitializerRequestURL'])
							if (data) {
								response = data.buffer
							} else {
								console.warn(
									'a problem seems to have happened with Module.memoryInitializerRequest, status: ' +
										request.status +
										', retrying ' +
										memoryInitializer,
								)
								doBrowserLoad()
								return
							}
						}
						applyMemoryInitializer(response)
					}
					if (Module['memoryInitializerRequest'].response) {
						setTimeout(useRequest, 0)
					} else {
						Module['memoryInitializerRequest'].addEventListener('load', useRequest)
					}
				} else {
					doBrowserLoad()
				}
			}
		}
		Module['then'] = function (func) {
			if (Module['calledRun']) {
				func(Module)
			} else {
				var old = Module['onRuntimeInitialized']
				Module['onRuntimeInitialized'] = function () {
					if (old) old()
					func(Module)
				}
			}
			return Module
		}
		function ExitStatus(status) {
			this.name = 'ExitStatus'
			this.message = 'Program terminated with exit(' + status + ')'
			this.status = status
		}
		ExitStatus.prototype = new Error()
		ExitStatus.prototype.constructor = ExitStatus
		var initialStackTop
		dependenciesFulfilled = function runCaller() {
			if (!Module['calledRun']) run()
			if (!Module['calledRun']) dependenciesFulfilled = runCaller
		}
		function run(args) {
			args = args || Module['arguments']
			if (runDependencies > 0) {
				return
			}
			writeStackCookie()
			preRun()
			if (runDependencies > 0) return
			if (Module['calledRun']) return
			function doRun() {
				if (Module['calledRun']) return
				Module['calledRun'] = true
				if (ABORT) return
				ensureInitRuntime()
				preMain()
				if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']()
				assert(
					!Module['_main'],
					'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]',
				)
				postRun()
			}
			if (Module['setStatus']) {
				Module['setStatus']('Running...')
				setTimeout(function () {
					setTimeout(function () {
						Module['setStatus']('')
					}, 1)
					doRun()
				}, 1)
			} else {
				doRun()
			}
			checkStackCookie()
		}
		Module['run'] = run
		function checkUnflushedContent() {
			var print = out
			var printErr = err
			var has = false
			out = err = function (x) {
				has = true
			}
			try {
				var flush = flush_NO_FILESYSTEM
				if (flush) flush(0)
			} catch (e) {}
			out = print
			err = printErr
			if (has) {
				warnOnce(
					'stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.',
				)
				warnOnce(
					'(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)',
				)
			}
		}
		var abortDecorators = []
		function abort(what) {
			if (Module['onAbort']) {
				Module['onAbort'](what)
			}
			if (what !== undefined) {
				out(what)
				err(what)
				what = JSON.stringify(what)
			} else {
				what = ''
			}
			ABORT = true
			EXITSTATUS = 1
			var extra = ''
			var output = 'abort(' + what + ') at ' + stackTrace() + extra
			if (abortDecorators) {
				abortDecorators.forEach(function (decorator) {
					output = decorator(output, what)
				})
			}
			throw output
		}
		Module['abort'] = abort
		if (Module['preInit']) {
			if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']]
			while (Module['preInit'].length > 0) {
				Module['preInit'].pop()()
			}
		}
		Module['noExitRuntime'] = true
		run()

		return libPowerEPD
	}
})()
if (typeof exports === 'object' && typeof module === 'object') module.exports = libPowerEPD
else if (typeof define === 'function' && define['amd'])
	define([], function () {
		return libPowerEPD
	})
else if (typeof exports === 'object') exports['libPowerEPD'] = libPowerEPD
