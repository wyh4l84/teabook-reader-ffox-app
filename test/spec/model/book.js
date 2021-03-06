/*global describe: true, should: true, it: true, curl: true, Backbone: true */
(function() {
    "use strict";
    describe('Book model', function () {
        describe('instance', function () {
            it('should be an instance of Backbone.Model', function (done) {
                curl(['model/book'], function (BookModel) {
                    var book = new BookModel();
                    book.should.be.an.instanceof(Backbone.Model);
                    done();
                });
            });
        });
    });
}());