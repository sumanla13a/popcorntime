(function (App) {
    'use strict';

    var NeetCafeBrowser = App.View.PCTBrowser.extend({
        collectionModel: App.Model.NeetCafeCollection,
        filters: {}
    });

    App.View.NeetCafeBrowser = NeetCafeBrowser;
})(window.App);
