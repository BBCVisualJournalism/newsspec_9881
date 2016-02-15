(function () {

    var IframeWatcher = function (linkId) {
        if (this.istatsCanBeUsed()) {
            this.addIstatsDependency(linkId);
        }
        else {
            this.createIframe(linkId);
        }
        this.updateSizeWhenWindowResizes();
    };

    IframeWatcher.prototype = {
        postMessageAvailable: (window.postMessage ? true : false),
        sidebarOffset: 0,
        istatsCanBeUsed: function () {
            return ('require' in window) && this.onBbcDomain();
        },
        addIstatsDependency: function (linkId) {
            var iframeWatcher = this;
            require(['istats-1'], function (istats) {
                iframeWatcher.istats = istats;
                iframeWatcher.createIframe(linkId);
            });
        },
        updateSizeWhenWindowResizes: function () {
            var iframeWatcher = this;
            window.addEventListener('resize', function () {
                iframeWatcher.setDimensions();
            }, false);
        },
        data: {},
        istatsQueue: [],
        updateFrequency: 32,
        createIframe: function (linkId) {

            var link         = document.getElementById(linkId),
                href         = link.href,
                token        = link.parentNode.className,
                staticHeight = link.getAttribute('data-static-iframe-height'),
                iframeWatcher = this,
                hostId        = this.getWindowLocationOrigin(),
                urlParams     = window.location.hash || '',
                onBBC         = this.onBbcDomain();

            if (this.hostIsNewsApp(token)) {
                hostId = token;
            }

            this.elm = document.createElement('iframe');
            this.elm.className = 'responsive-iframe';
            this.elm.style.width = '100%';
            this.elm.scrolling = 'no';
            //this.elm.allowFullScreen = true;
            this.elm.setAttribute('allowfullscreen', '');
            this.elm.frameBorder = '0';

            this.decideHowToTalkToIframe(href);

            this.elm.src = href + '?hostid=' + hostId.split('//')[1] + '&onbbcdomain=' + onBBC + urlParams;

            link.parentNode.appendChild(this.elm);
            link.parentNode.removeChild(link);

            this.lastRecordedHeight = this.elm.height;
            this.iframeInstructionsRan = false;

            this.handleIframeLoad(function startIframing() {
                iframeWatcher.getAnyInstructionsFromIframe();
                iframeWatcher.setDimensions();
            });
        },
        handleIframeLoad: function (startIframing) {
            // IMPORTANT: Had to make this an onload because the
            // polyfilling and jquery on one page causes issues
            window.addEventListener('load', function () {
                startIframing();
            }, true);
            if (this.elm.onload) {
                this.elm.onload = startIframing;
            }
            // Bug in IE7 means onload doesn't fire when an iframe
            // loads, but the event will fire if you attach it correctly
            else if ('attachEvent' in this.elm) {
                this.elm.attachEvent('onload', startIframing);
            }
        },
        decideHowToTalkToIframe: function (href) {
            if (window.postMessage) { // if window.postMessage is supported, then support for JSON is assumed
                var uidForPostMessage = this.getPath(href);
                this.uidForPostMessage = this.getPath(href);
                this.setupPostMessage(uidForPostMessage);
            }
            else {
                this.data.height = staticHeight;
                this.elm.scrolling = 'yes';
            }
        },
        onBbcDomain: function () {
            return window.location.host.search('bbc.co') > -1;
        },
        setupPostMessage: function (uid) {
            var iframeWatcher = this;
            window.addEventListener('message', function (e) {
                iframeWatcher.postMessageCallback(e.data);
            }, false);
        },
        postMessageCallback: function (data) {
            if (this.postBackMessageForThisIframe(data)) {
                this.processCommunicationFromIframe(
                    this.getObjectNotationFromDataString(data)
                );

                if (this.istatsInTheData()) {
                    this.addToIstatsQueue();
                    this.emptyThisIstatsQueue(this.istatsQueue);
                }
                if (this.scrollInTheData()) {
                    if (this.data.scrollDuration <= 0) {
                        this.scrollToInstant(this.data.scrollPosition);
                    } else {
                        //this.scrollToAnimated(this.data.scrollPosition, this.data.scrollDuration);
                        this.scrollToAnimatedWithRAF(this.data.scrollPosition, this.data.scrollDuration);
                    }
                }
                if (this.sidebarPositionInTheData()) {
                    this.repositionSidebar(null, this.data.sidebarPosition, this.data.introHeight, this.data.display, this.data.direction);
                }
            }
        },
        postBackMessageForThisIframe: function (data) {
            return data && (data.split('::')[0] === this.uidForPostMessage);
        },
        getObjectNotationFromDataString: function (data) {
            return JSON.parse(data.split('::')[1]);
        },
        scrollInTheData: function () {
            return (typeof(this.data.scrollPosition) !== 'undefined');
        },
        sidebarPositionInTheData: function () {
            return (typeof(this.data.sidebarPosition) !== 'undefined');
        },
        istatsInTheData: function () {
            if (this.uidForPostMessage.indexOf('index') > -1) return this.data.istats && this.data.istats.actionType;
        },
        addToIstatsQueue: function () {
            this.istatsQueue.push({
                'actionType': this.data.istats.actionType,
                'actionName': this.data.istats.actionName,
                'viewLabel':  this.data.istats.viewLabel
            });
        },
        istatsQueueLocked: false,
        emptyThisIstatsQueue: function (queue) {
            var istatCall;
            if (this.istats && queue) {
                this.istatsQueueLocked = true;
                for (var i = 0, len = queue.length; i < len; i++) {
                    istatCall = queue.pop();
                    this.istats.log(istatCall.actionType, istatCall.actionName, {'view': istatCall.viewLabel});
                }
                this.istatsQueueLocked = false;
            }
        },
        hostIsNewsApp: function (token) {
            return (token.indexOf('bbc_news_app') > -1);
        },
        getIframeContentHeight: function () {
            if (this.data.height) {
                this.lastRecordedHeight = this.data.height;
            }
            return this.lastRecordedHeight;
        },
        setDimensions: function () {
            this.elm.width  = this.elm.parentNode.clientWidth;
            this.elm.height = this.getIframeContentHeight();

            if (this.uidForPostMessage.indexOf('index') > -1) {
                var parentScrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop,
                    mainFrameContainer = document.getElementById('iframe_newsspec_9881'),
                    sidebarFrameContainer = document.getElementById('fixedFrame'),
                    bodyRect        = document.body.getBoundingClientRect(),
                    elemRect        = mainFrameContainer.getBoundingClientRect(),
                    iFrameOffset    = elemRect.top - bodyRect.top,
                    andIntroOffset    = iFrameOffset + this.sidebarOffset,
                    position        = '',
                    delta;

                if (parentScrollTop < andIntroOffset) {
                    delta = andIntroOffset;
                    position = 'absolute';
                    sidebarFrameContainer.style.marginTop = '';
                } else {
                    delta = 0;
                    position = 'fixed';
                    sidebarFrameContainer.style.marginTop = 'initial';
                }
                sidebarFrameContainer.style.top = delta + 'px';
                sidebarFrameContainer.style.position = position;
            }

            this.repositionSidebar;
        },
        getAnyInstructionsFromIframe: function () {
            if (
                this.data.hostPageCallback &&
                (!this.iframeInstructionsRan)
            ) {
                this.iframeInstructionsRan = true;
            } else if (this.data.iFrameReady) {
                this.setupIframeCommunication();
            }
        },
        getPath: function (url) {
            var urlMinusProtocol = url.replace('http://', '');
            return urlMinusProtocol.substring(urlMinusProtocol.indexOf('/')).split('?')[0];
        },
        getWindowLocationOrigin: function () {
            if (window.location.origin) {
                return window.location.origin;
            }
            else {
                return window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }
        },
        processCommunicationFromIframe: function (data) {
            this.data = data;
            this.setDimensions();
            this.getAnyInstructionsFromIframe();
            this.forwardAnyPubsubsFromIframe();
        },
        setupIframeCommunication: function () {
            this.initSubscribersList();
            this.addIframeToSubscribers(this.elm);
            this.giveIFrameItsIndex(this.elm);
        },
        initSubscribersList: function () {
            if (window.newsspec_iframes_subscribed === undefined) {
                window.newsspec_iframes_subscribed = [];
            }
        },
        addIframeToSubscribers: function (iFrame) {
            window.newsspec_iframes_subscribed.push(this.elm);
        },
        giveIFrameItsIndex: function (iFrame) {
            var iFrameIndex = window.newsspec_iframes_subscribed.length - 1;

            this.forwardPubsubToIFrame(iFrame, {
                announcement: 'setting_index_from_host',
                details:      [iFrameIndex]
            });
        },
        forwardAnyPubsubsFromIframe: function () {
            var iFrameThatSentThePubsub;

            if (this.data.pubsub) {
                iFrameThatSentThePubsub = this.data.pubsub.originator;
                this.forwardPubsubToAllBut(iFrameThatSentThePubsub);
            }
        },
        forwardPubsubToAllBut: function (iFrameOriginatorIndex) {
            var iframes = window.newsspec_iframes_subscribed;

            for (var i = 0; i < iframes.length; i++) {
                if (i !== iFrameOriginatorIndex) {
                    this.forwardPubsubToIFrame(iframes[i], this.data.pubsub);
                }
            }
        },
        forwardPubsubToIFrame: function (iFrame, pubsubMessage) {
            if (this.postMessageAvailable) {
                iFrame.contentWindow.postMessage('newsspec_iframe::' + JSON.stringify(pubsubMessage), '*');
            }
        },
        getScrollY: function () {
            return window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || 0;
        },
        scrollToInstant: function (iframeScrollPosition) {
            var scrollPosition = this.elm.getBoundingClientRect().top + this.getScrollY() + iframeScrollPosition;
            window.scrollTo(0, scrollPosition);
        },
        scrollToAnimated: function (iframeScrollPosition, scrollDuration) {
            var self = this;

            var scrollY = this.getScrollY(),
                scrollPosition = this.elm.getBoundingClientRect().top + scrollY + iframeScrollPosition;

            var scrollStep = (scrollPosition - scrollY) / (scrollDuration / 15);

            /* Timeout to cancel if something wierd happens  - prevent infinite loops */
            var timeout = false;
            setTimeout(function () { timeout = true; }, scrollDuration * 2);

            var scrollInterval = setInterval(function () {
                scrollY = self.getScrollY();
                if (scrollY <= scrollPosition && !timeout) {
                    window.scrollBy(0, scrollStep);
                } else {
                    self.sendScrollEndEventToIframe();
                    self.showSidebar();
                    clearInterval(scrollInterval);
                }
            }, 15);
        },
        scrollToAnimatedWithRAF: function (iframeScrollPosition, scrollDuration) {
            var self = this;

            var iframeContainer = document.getElementById('iframe_newsspec_9881'),
                iframeRect = iframeContainer.getBoundingClientRect(),
                scrollY = this.getScrollY(),
                scrollTop = iframeRect.top,
                scrollPosition = this.elm.getBoundingClientRect().top + scrollY + iframeScrollPosition,
                baseScrollStepCostant = this.elm.getBoundingClientRect().top + scrollY + 600,
                baseScrollStep = baseScrollStepCostant / (scrollDuration / 20),
                scrollStep = ((scrollPosition - scrollY) * baseScrollStep) / baseScrollStepCostant;
                //scrollStep = (scrollPosition - scrollY) / (scrollDuration / 20);

            var scroll = window.requestAnimationFrame ||
                         window.webkitRequestAnimationFrame ||
                         window.mozRequestAnimationFrame ||
                         window.msRequestAnimationFrame ||
                         window.oRequestAnimationFrame ||
                         // IE Fallback, you can even fallback to onscroll
                         function(callback){ window.setTimeout(callback, 1000/60) };

            var scrollInterval = function () {
                scrollY = self.getScrollY();
                /*if (scrollY <= scrollPosition) {
                    window.scrollBy(0, scrollStep);
                    scroll(scrollInterval);
                } else {
                    self.sendScrollEndEventToIframe();
                    self.showSidebar();
                }*/

                if (Math.abs(scrollY - scrollPosition) < scrollStep || scrollY === 0) {
                    self.sendScrollEndEventToIframe();
                    self.showSidebar();
                } else {
                    window.scrollBy(0, scrollStep);
                    scroll(scrollInterval);
                }
            };

            scrollInterval();
        },
        sendScrollEndEventToIframe: function (uid) {
            var iframeContainer = document.getElementById('iframe_newsspec_9881'),
                message = {
                    announcement: 'scroll_end'
                };
            iframeContainer.querySelector('iframe').contentWindow.postMessage(uid + '::' + JSON.stringify(message), '*');
        },
        showSidebar: function () {
            var sidebarContainer = document.getElementById('fixedFrame');

            sidebarContainer.className = "show";
        },
        hideSidebar: function () {
            var sidebarContainer = document.getElementById('fixedFrame');

            sidebarContainer.className = "";
        },
        sendScrollEventToIframe: function (uid) {
            var parentScrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop,
                iframeContainer = document.getElementById('iframe_newsspec_9881'),
                bodyRect        = document.body.getBoundingClientRect(),
                elemRect        = iframeContainer.getBoundingClientRect(),
                iFrameOffset    = elemRect.top - bodyRect.top,
                message = {
                    parentScrollTop: parentScrollTop,
                    iFrameOffset:    iFrameOffset,
                    // http://stackoverflow.com/a/8876069
                    viewportHeight:  Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
                };
            iframeContainer.querySelector('iframe').contentWindow.postMessage(uid + '::' + JSON.stringify(message), '*');
        },
        repositionSidebar: function (uid, width, introHeight, display, direction) {
            var viewportWidth =  Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                iframeContainer = document.getElementById('iframe_newsspec_9881'),
                sidebarContainer = document.getElementById('fixedFrame'),
                iframeRect      = iframeContainer.getBoundingClientRect(),
                sidebarRect      = sidebarContainer.getBoundingClientRect(),
                leftMargin       = ((viewportWidth - width) / 2) + 32;

                if (display === 'hide') {
                    this.hideSidebar();
                } else {
                    this.sidebarOffset = introHeight;
                    if (leftMargin === 0) leftMargin = 25;
                    if (direction === 'rtl') {
                        sidebarContainer.style.left = leftMargin + 'px';
                    } else {
                        sidebarContainer.style.right = leftMargin + 'px';
                    }
                }
        }
    };

    var iframe = new IframeWatcher('<%= iframeUid %>');

})();
