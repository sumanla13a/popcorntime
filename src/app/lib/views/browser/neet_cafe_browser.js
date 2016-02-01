(function (App) {
    'use strict';

    var NeetCafeBrowser = App.View.PCTBrowser.extend({
        collectionModel: App.Model.ShowCollection,
        filters: {
            genres: App.Config.genres_anime,
            sorters: App.Config.sorters_tv,
            types: App.Config.types_anime
        }
    });

    App.View.NeetCafeBrowser = NeetCafeBrowser;
})(window.App);
