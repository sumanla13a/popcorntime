(function (App) {
    'use strict';

    var NeetCafeCollection = App.Model.Collection.extend({
        model: App.Model.Movie,
        popid: 'mal_id',
        type: 'animes',
        getProviders: function () {
            return {
                torrents: App.Config.getProvider('neetcafe')
            };
        },
    });

    App.Model.NeetCafeCollection = NeetCafeCollection;
})(window.App);
