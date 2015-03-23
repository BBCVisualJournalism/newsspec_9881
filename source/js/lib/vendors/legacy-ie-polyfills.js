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
    (function(win, doc){
        if(win.addEventListener)return;     //No need to polyfill

        function docHijack(p){var old = doc[p];doc[p] = function(v){return addListen(old(v))}}
        function addEvent(on, fn, self){
            return (self = this).attachEvent('on' + on, function(e){
                var e = e || win.event;
                e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
                e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
                fn.call(self, e);
            });
        }
        function addListen(obj, i){
            if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
            else obj.addEventListener = addEvent;
            return obj;
        }

        addListen([doc, win]);
        if('Element' in win)win.Element.prototype.addEventListener = addEvent;          //IE8
        else{                                                                           //IE < 8
            doc.attachEvent('onreadystatechange', function(){addListen(doc.all)});      //Make sure we also init at domReady
            docHijack('getElementsByTagName');
            docHijack('getElementById');
            docHijack('createElement');
            addListen(doc.all);
        }
    })(window, document);
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
