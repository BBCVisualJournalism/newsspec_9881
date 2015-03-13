define(['jquery', 'lib/news_special/iframemanager__jsonparser'], function ($, parser) {

    IFrameCommunicator = {

        init: function () {
            var externalIFrameCommunicator = this;
            window.addEventListener('message', externalIFrameCommunicator.messageReceivedFromHost, false);
        },

        emittedFromHost: false,

        forwardToHost: function (announcement, details) {
            if (!IFrameCommunicator.emittedFromHost && announcement !== 'event_to_send_to_host') {
                $.emit('event_to_send_to_host', [announcement, details]);
            }

            IFrameCommunicator.emittedFromHost = false;
        },

        messageReceivedFromHost: function (event) {
            var data = parser.parseJSON(event);
            IFrameCommunicator.emittedFromHost = true;

            // shouldn't need this conditional, but PhantomJS/Jasmine complains otherwise.
            if (data.announcement) {
                $.emit(data.announcement, data.details);
            }
        }
    };

    IFrameCommunicator.init();

    return IFrameCommunicator;
});
