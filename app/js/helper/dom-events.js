/*global define, window, Teavents*/
/*jslint nomen: true*/
define('helper/dom-events', ['backbone', 'underscore', 'jquery'], function (Backbone, _, $) {
    "use strict";
    var DomEvents = {};

    _.extend(DomEvents, Backbone.Events);

    DomEvents.initialize = function () {
        $(window).on(Teavents.MESSAGE, this.handlePostMessage);
        $(window.document).on(Teavents.VISIBILITY_CHANGE, this.handleVisibilityChange);

        this.listenTo(Backbone, Teavents.FULLSCREEN_ENTER, this.enterFullScreen);
        this.listenTo(Backbone, Teavents.FULLSCREEN_EXIT, this.exitFullScreen);

        this.listenTo(Backbone, Teavents.SCROLL_TOP, this.scrollTop);
        this.listenTo(Backbone, Teavents.FREEZE_BODY, this.freezeBody);
        this.listenTo(Backbone, Teavents.UNFREEZE_BODY, this.unfreezeBody);

        this.listenToSdCardChange();
    };

    DomEvents.handlePostMessage = function (event) {
        var readiumEvent = event.originalEvent.data;
        Backbone.trigger(readiumEvent.type, readiumEvent.data);
    };

    DomEvents.handleVisibilityChange = function () {
        Backbone.trigger((window.document.hidden ? Teavents.VISIBILITY_HIDDEN : Teavents.VISIBILITY_VISIBLE));
    };

    DomEvents.enterFullScreen = function () {
        // full screen on body element
        var body = window.document.body;
        if (!window.document.fullscreenElement && !window.document.mozFullScreenElement && !window.document.webkitFullscreenElement) {
            if (body.requestFullscreen) {
                body.requestFullscreen();
            } else if (body.mozRequestFullScreen) {
                body.mozRequestFullScreen();
            } else if (body.webkitRequestFullscreen) {
                body.webkitRequestFullscreen();
            }
        }
    };

    DomEvents.exitFullScreen = function () {
        if (window.document.fullscreenElement || window.document.mozFullScreenElement || window.document.webkitFullscreenElement) {
            if (window.document.exitFullscreen) {
                window.document.exitFullscreen();
            } else if (window.document.mozCancelFullScreen) {
                window.document.mozCancelFullScreen();
            } else if (window.document.webkitExitFullscreen) {
                window.document.webkitExitFullscreen();
            }
        }
    };

    DomEvents.stop = function () {
        $(window).off(Teavents.MESSAGE);
        $(window.document).off(Teavents.VISIBILITY_CHANGE);
        this.stopListening(Backbone);
    };

    DomEvents.scrollTop = function () {
        window.scrollTo(0, 0);
    };

    DomEvents.freezeBody = function () {
        DomEvents.scrollTop();
        $("body").addClass("noscroll");
    };

    DomEvents.unfreezeBody = function () {
        $("body").removeClass("noscroll");
        DomEvents.scrollTop();
    };

    DomEvents.listenToSdCardChange = function () {
        if (window.navigator.getDeviceStorage) {
            var sdCard = window.navigator.getDeviceStorage('sdcard');
            sdCard.addEventListener("change", function (event) {
                if (event.reason === "available") {
                    Backbone.trigger(Teavents.SDCARD_AVAILABLE);
                } else {
                    Backbone.trigger(Teavents.SDCARD_UNAVAILABLE);
                }
            });
        }
    };

    return DomEvents;
});
/*jslint nomen: false*/