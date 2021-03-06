/*global describe, beforeEach, afterEach, should, it, curl, sinon, Backbone, DeviceStorage, ArrayBuffer*/
(function() {
    "use strict";
    describe('Device helper', function () {
        var sandbox, server;

        beforeEach(function () {
            // create a sandbox
            sandbox = sinon.sandbox.create();

            // fake server
            server = sinon.fakeServer.create();
            server.autoRespond = true;
            server.respondWith("GET", "books/list", [200, { "Content-Type": "text/plain" }, 'myepub1.epub\nmyepub2.epub']);
        });

        afterEach(function () {
            // restore the environment as it was before
            server.restore();
            sandbox.restore();
        });

        describe('should', function () {
            it('scan SD card and find 2 books', function (done) {
                curl(['helper/device', 'model/book', 'collection/books'], function (DeviceHelper, BookModel, BookCollection) {
                    var counter = 0;

                    // skip indexedDB
                    sandbox.stub(BookModel.prototype, "save", function (attr, options) {
                        options.success();
                    });

                    // fake device storage get request
                    sandbox.stub(DeviceStorage.prototype, "get", function () {
                        var request = {
                            onsuccess: false,
                            onerror: function (err) {
                                console.error(err);
                            }
                        };
                        request.result = {
                            name: "/sdcard/mybook.epub",
                            content: new ArrayBuffer(1024)
                        };
                        setTimeout(function () {
                            if (request.onsuccess) {
                                request.onsuccess();
                            }
                        }, 5);
                        return request;
                    });

                    // fake call to web worker
                    sandbox.stub(DeviceHelper, "scanFile", function (file, book, callback) {
                        callback();
                    });

                    // Given 2 fake books on the sd card and a book collection
                    var books = new BookCollection();

                    // When we scan the card
                    DeviceHelper.scanSdCard(books);

                    // Then the collection should have 2 books
                    books.on("add", function () {
                        counter += 1;
                        if (counter === 2) {
                            books.models.should.have.length(2);
                            done();
                        }
                    });
                });
            });

            it('generate a search string with book metadata', function (done) {
                curl(['helper/device'], function (DeviceHelper) {
                    // Given some book metadata
                    var metadata, searchString;
                    metadata = {
                        'title': "L'attaque du Jihad Butlérien",
                        'authors': [ "Herbert,Brian", "Kevin J Anderson" ],
                        'publisher': "Robert Laffont"
                    };

                    // When we generate a search string
                    searchString = DeviceHelper.generateSearchString(metadata);

                    // Then we should find the title, the authors and the publisher in the string
                    searchString.should.match(/attaque/);
                    searchString.should.match(/du/);
                    searchString.should.match(/jihad/);
                    searchString.should.match(/butlerien/);
                    searchString.should.match(/herbert/);
                    searchString.should.match(/brian/);
                    searchString.should.match(/kevin/);
                    searchString.should.match(/anderson/);
                    searchString.should.match(/robert/);
                    searchString.should.match(/laffont/);
                    searchString.should.not.match(/J/);
                    searchString.should.not.match(/Butlérien/);

                    done();
                });
            });
        });
    });
}());