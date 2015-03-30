if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    }
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        'use strict';
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}

// addEventListener polyfill 1.0 / Eirik Backer / MIT Licence
if (!document.addEventListener) {
    !window.addEventListener && (function (WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
    	WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function (type, listener) {
    		var target = this;

    		registry.unshift([target, type, listener, function (event) {
    			event.currentTarget = target;
    			event.preventDefault = function () { event.returnValue = false };
    			event.stopPropagation = function () { event.cancelBubble = true };
    			event.target = event.srcElement || target;

    			listener.call(target, event);
    		}]);

    		this.attachEvent("on" + type, registry[0][3]);
    	};

    	WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function (type, listener) {
    		for (var index = 0, register; register = registry[index]; ++index) {
    			if (register[0] == this && register[1] == type && register[2] == listener) {
    				return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
    			}
    		}
    	};

    	WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function (eventObject) {
    		return this.fireEvent("on" + eventObject.type, eventObject);
    	};
    })(Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);
}

if (!Array.isArray) {
    Array.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };
}

if (!Function.prototype.bind) {
    Function.prototype.bind=(function(){}).bind||function(b){if(typeof this!=="function"){throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");}function c(){}var a=[].slice,f=a.call(arguments,1),e=this,d=function(){return e.apply(this instanceof c?this:b||window,f.concat(a.call(arguments)));};c.prototype=this.prototype;d.prototype=new c();return d;};
}

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(callback, thisArg) {
        var T, k;

        if (this == null) {
            throw new TypeError("this is null or not defined");
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if ( {}.toString.call(callback) !== "[object Function]") {
            throw new TypeError(callback + " is not a function");
        }

        if (thisArg) {
            T = thisArg;
        }

        k = 0;

        while (k < len) {

            var kValue;

            if (Object.prototype.hasOwnProperty.call(O, k)) {

                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}

if (!Object.keys) {
    Object.keys = (function () {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
                ],
            dontEnumsLength = dontEnums.length;

        return function (obj) {
            if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

        var result = [];

        for (var prop in obj) {
            if (hasOwnProperty.call(obj, prop)) result.push(prop);
        }

        if (hasDontEnumBug) {
            for (var i=0; i < dontEnumsLength; i++) {
                if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
            }
        }
        return result;
        }
    })()
};
