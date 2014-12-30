/*global define, navigator, window, Teavents, Worker*/
define("helper/logger", ["backbone", "collection/events", "model/event"], function (Backbone, EventCollection, EventModel) {
    "use strict";

    function createEvent(eventData) {
        eventData.sent = "nope";
        eventData.timestamp = Date.now();
        return new EventModel(eventData);
    }

    function send2server() {
        var events = new EventCollection(),
            eventsData,
            sendLogsWorker;

        events.fetch({ conditions: { sent: "nope" } }).done(function () {
            eventsData = events.toJSON();

            events.models.forEach(function (event) {
                event.save({ sent: "yes" });
            });

            sendLogsWorker = new Worker("sendLogs.js");
            sendLogsWorker.postMessage(eventsData);
        });
    }

    function clearPassedEvents() {
        var eventCollection = new EventCollection(),
            eventsToDestroy = [],
            i;

        eventCollection.fetch({ conditions: { sent: "yes" } }).done(function () {
            eventCollection.models.forEach(function (event) {
                eventsToDestroy.push(event);
            });
            for (i = 0; i < eventsToDestroy.length; i += 1) {
                eventsToDestroy[i].destroy();
            }
        });
    }

    function log2db(eventData, send) {
        var event = createEvent(eventData);
        event.save(null, {
            success: function () {
                if (send && navigator.onLine) {
                    send2server();
                } else if (send === false) {
                    clearPassedEvents();
                }
            }
        });
    }

    function filterBookData(bookData) {
        var data = {
            title: bookData.title,
            publisher: bookData.publisher,
            identifier: bookData.identifier,
            language: bookData.language,
            authors: bookData.authors ? bookData.authors.join(", ") : ""
        };

        if (bookData.read && bookData.read > 1000000000) {
            data.read = bookData.read;
        }

        return data;
    }

    function handleVisibilityChange() {
        var appClosed = window.document.hidden === true;
        log2db({
            "name": appClosed ? Teavents.Events.CLOSE_APP : Teavents.Events.OPEN_APP,
            "data": { "online": navigator.onLine }
        }, appClosed);
    }

    function logTap(center) {
        log2db({
            "name": Teavents.Events.TAP,
            "data": center
        });
    }

    Backbone.on(Teavents.VISIBILITY_VISIBLE, handleVisibilityChange);
    Backbone.on(Teavents.VISIBILITY_HIDDEN, handleVisibilityChange);
    Backbone.on(Teavents.Readium.GESTURE_TAP, logTap);

    return {
        log: function (name, data) {
            log2db({
                "name": name,
                "data": data
            });
        },

        startApp: function () {
            log2db({
                "name": Teavents.Events.START_APP,
                "data": {
                    "userAgent": navigator.userAgent,
                    "language": navigator.language,
                    "platform": navigator.platform,
                    "online": navigator.onLine,
                    "screen": {
                        width: window.screen.availWidth,
                        height: window.screen.availHeight,
                        pixelDepth: window.screen.pixelDepth
                    }
                }
            });
        },

        deleteBook: function (bookData) {
            log2db({
                "name": Teavents.Events.DELETE_BOOK,
                "data": {
                    book: filterBookData(bookData)
                }
            });
        },

        addBook: function (bookData) {
            log2db({
                "name": Teavents.Events.ADD_BOOK,
                "data": {
                    book: filterBookData(bookData)
                }
            });
        },

        openBook: function (bookData) {
            log2db({
                "name": Teavents.Events.OPEN_BOOK,
                "data": {
                    book: filterBookData(bookData),
                    online: navigator.onLine
                }
            });
        },

        closeBook: function (bookData) {
            log2db({
                "name": Teavents.Events.CLOSE_BOOK,
                "data": {
                    book: filterBookData(bookData),
                    online: navigator.onLine
                }
            });
        }
    };
});
