define(['jquery', 'lib/news_special/iframemanager__jsonparser'], function ($, parser) {
    var hostCommunicator = {
        iFrameIndex: false,
        postMessageAvailable: (window.postMessage ? true : false),
        init: function () {
            this.setHeight();
            this.startWatching();
            if (this.postMessageAvailable) {
                this.setupPostMessage();
            }
            else {
                this.setupIframeBridge();
            }

            this.subscribeToEvents();

            this.sendDataToHost({
                iFrameReady: true
            });
        },
        subscribeToEvents: function () {
            var externalHostCommunicator = this;

            $.on('istats', function (actionType, actionName, viewLabel) {
                externalHostCommunicator.setHeight();
                externalHostCommunicator.registerIstatsCall(actionType, actionName, viewLabel);
            });

            $.on('event_to_send_to_host', function (announcement, details) {
                externalHostCommunicator.sendDataToHost({
                    pubsub: {
                        originator:   externalHostCommunicator.iFrameIndex,
                        announcement: announcement,
                        details:      details
                    }
                });
            });

            $.on('window:scrollTo', this.sendScrollToHost);

            $.on('sidebar:position', this.sendPositionSidebarToHost);
        },
        sendDataToHost: function (data) {
            if (this.postMessageAvailable) {
                this.sendDataByPostMessage(data);
            }
        },
        sendDataByPostMessage: function (message) {
            var talker_uid = window.location.pathname;
            message = hostCommunicator.constructMessage(message);
            window.parent.postMessage(talker_uid + '::' + JSON.stringify(message), '*');
        },
        sendScrollToHost: function (scrollPosition, scrollDuration, offset) {
            var talker_uid = window.location.pathname,
            message = {
                scrollPosition: scrollPosition,
                scrollDuration: scrollDuration,
                offset: offset,
                hostPageCallback: false
            };
            if (talker_uid.indexOf('index') > -1) window.parent.postMessage(talker_uid + '::' + JSON.stringify(message), '*');
        },
        sendPositionSidebarToHost: function (obj) {
            var talker_uid = window.location.pathname,
                width = obj.width,
                introHeight = obj.introHeight,
                display = obj.display,
                direction = obj.direction,
                message = {
                    sidebarPosition: width,
                    introHeight: introHeight,
                    display: display,
                    direction: direction,
                    hostPageCallback: false
                };
            if (talker_uid.indexOf('index') > -1) window.parent.postMessage(talker_uid + '::' + JSON.stringify(message), '*');
        },
        constructMessage: function (additionalMessage) {
            var message = {
                height:           hostCommunicator.height,
                hostPageCallback: hostCommunicator.hostPageCallback
            };
            if (additionalMessage && additionalMessage.actionType) {
                message.istats = additionalMessage;
            }
            $.extend(message, additionalMessage || {});
            return message;
        },
        height: 0,
        registerIstatsCall: function (actionType, actionName, viewLabel) {
            var istatsData = {
                'actionType': actionType,
                'actionName': actionName,
                'viewLabel':  viewLabel
            };
            if (this.postMessageAvailable) {
                this.sendDataByPostMessage(istatsData);
            }
        },
        setupPostMessage: function () {
            window.setInterval(this.sendDataByPostMessage, 500); // CHANGE THIS BACK TO 32
            window.addEventListener('message', this.setIFrameIndexFromPost, false);
            window.addEventListener('message', this.scrollEndFromPost, false);
        },
        setIFrameIndexFromPost: function (event) {
            hostCommunicator.setIFrameIndex(parser.parseJSON(event));
        },
        setIFrameIndex: function (data) {
            if (data.announcement === 'setting_index_from_host') {
                hostCommunicator.iFrameIndex = data.details[0];
                // only need to set the iframe index once
                window.removeEventListener('message', hostCommunicator.setIFrameIndex, false);
            }
        },
        scrollEndFromPost: function (event) {
            hostCommunicator.scrollEnd(parser.parseJSON(event));
        },
        scrollEnd: function (data) {
            if (data.announcement === 'scroll_end') {
                $.emit('scroll:end', []);
            }
        },
        startWatching: function () {
            window.setInterval(this.setHeight, 32);
        },
        staticHeight: null,
        setStaticHeight: function (newStaticHeight) {
            this.staticHeight = newStaticHeight;
        },
        setHeight: function () {
            var heightValues = [this.staticHeight || 0];
            if ($('.main').length > 0) {
                heightValues.push($('.main')[0].scrollHeight);
            }
            hostCommunicator.height = Math.max.apply(Math, heightValues);
        },
        hostPageCallback: false,
        setHostPageInitialization: function (callback) {
            hostCommunicator.hostPageCallback = callback.toString();
        },
        sendMessageToremoveLoadingImage: function () {
            var message,
                funcToExecute;

            funcToExecute = function () {
                var iframeDivContainer = document.getElementById('bbc-news-visual-journalism-loading-spinner');
                if (iframeDivContainer) {
                    iframeDivContainer.parentNode.removeChild(iframeDivContainer);
                }
            };

            message = {
                'hostPageCallback' : funcToExecute.toString()
            };

            if (this.postMessageAvailable) {
                window.parent.postMessage(window.location.pathname + '::' + JSON.stringify(message), '*');
            }
        }
    };
    return hostCommunicator;
});
