(function(App) {
    'use strict';
    var querystring = require('querystring');
    var request = require('request');
    var Q = require('q');
    var inherits = require('util').inherits;
    var readTorrent = require('read-torrent');

    var statusMap = {
        0: 'Not Airing Yet',
        1: 'Currently Airing',
        2: 'Ended'
    };

    var URL = 'http://ptp.haruhichan.com/';

    var NeetCafe = function() {
        NeetCafe.super_.call(this);
    };

    inherits(NeetCafe, App.Providers.Generic);
    var parseTime = function(duration) {
        var time = duration.match(/(?:([0-9]+) h)?.*?(?:([0-9]+) min)/);
        if (!time) {
            return win.error('couldn\'t parse time:', time);
        }
        return (time[1] ? time[1] : 0) * 60 + Number(time[2]);
    };
    var queryTorrent = function(torrent_id, prev_data) {
        return Q.Promise(function(resolve, reject) {
            var id = torrent_id.split('-')[1];
            var url = URL + 'anime.php?id=' + id;

            win.info('Request to Hurahican API', url);
            request({
                url: url,
                json: true
            }, function(error, response, data) {
                var err;
                if (error || response.statusCode >= 400) {
                    reject(error);
                } else if (!data || (data.error && data.error !== 'No data returned')) {

                    err = data ? data.error : 'No data returned';
                    win.error('API error:', err);
                    reject(err);

                } else if (data.episodes.length === 0) {

                    err = 'No torrents returned';
                    win.error('API error:', err);
                    reject(err);

                } else {

                    // we cache our new element
                    resolve(formatDetailForPopcorn(data, prev_data));
                }
            });
        });
    };
    var movieTorrents = function(id, dl) {
        var torrents = {};
        _.each(dl, function(item) {
            var qualityMatch = item.quality.match(/[0-9]+p/);
            var quality = qualityMatch ? qualityMatch[0] : null;
            var qualityNumber = quality.replace('p', '');
            if (qualityNumber > 480 && qualityNumber < 1000) {
                quality = '720p';
            } else if (qualityNumber >= 1000 && qualityNumber < 1800) {
                quality = '1080p';
            }
            torrents[quality] = {
                seeds: 0,
                peers: 0,
                magnet: item.magnet,
                health: 'good'
            };
        });

        return torrents;
    };

    var showTorrents = function(id, dl) {
        var torrents = {};
        var episodeNb = null;
        _.each(dl, function(item) {
            var qualityMatch = item.quality.match(/[0-9]+p/);
            var quality = qualityMatch ? qualityMatch[0] : null;
            var qualityNumber = quality.replace('p', '');
            if (qualityNumber > 200 && qualityNumber < 600) {
                quality = '480p';
            } else if (qualityNumber >= 600 && qualityNumber < 1000) {
                quality = '720p';
            } else if (qualityNumber >= 1000 && qualityNumber < 1800) {
                quality = '1080p';
            }
            var episode, tryName;
            var match = item.name.match(/[\s_]([0-9]+(-[0-9]+)?|CM|OVA)[\s_]/);
            if (!match) {
                tryName = item.name.split(/:?(\(|\[)/);
                if (tryName.length === 1) {
                    return;
                }
                if (torrents[episodeNb] && torrents[episodeNb].title === tryName[0]) {
                    episode = episodeNb;
                } else {
                    episodeNb++;
                    episode = episodeNb;
                }
            } else {
                episode = match[1];
            }
            if (!torrents[episode]) {
                torrents[episode] = {
                    title: match ? item.name : tryName[0],
                    ordered: match ? true : false
                };
            }
            torrents[episode][quality] = {
                seeds: 0,
                peers: 0,
                url: item.magnet,
                health: 'good'
            };
        });
        return _.map(torrents, function(torrents, s) {
            return {
                title: torrents.ordered ? 'Episode ' + s : torrents.title,
                torrents: torrents,
                season: 1,
                episode: Number(s.split('-')[0]),
                overview: i18n.__('We still don\'t have single episode overviews for anime… Sorry'),
                tvdb_id: id + '-1-' + s
            };
        });
    };

    var formatDetailForPopcorn = function(item, prev) {
        var img = item.malimg;
        var type = prev.type;
        var genres = item.genres.split(', ');

        var ret = _.extend(prev, {
            country: i18n.__('Japan'),
            genre: genres,
            genres: genres,
            num_seasons: 1,
            runtime: parseTime(item.duration),
            status: statusMap[item.status],
            synopsis: item.synopsis,
            network: item.producers, //FIXME
            rating: { // FIXME
                hated: 0,
                loved: 0,
                votes: 0,
                percentage: Math.round(item.score) * 10
            },
            images: {
                poster: img,
                fanart: img,
                banner: img
            },
            year: item.aired.split(', ')[1].replace(/ to.*/, ''),
            type: type
        });

        if (type === 'movie') {
            ret = _.extend(ret, {
                cover: img,
                rating: item.score,
                subtitle: undefined,
                torrents: movieTorrents(item.id, item.episodes),
            });
        } else {
            ret = _.extend(ret, {
                episodes: showTorrents(item.id, item.episodes)
            });
        }

        return Common.sanitize(ret);
    };


    NeetCafe.prototype.extractIds = function(items) {
        return _.pluck(items.results, 'haru_id');
    };

    NeetCafe.prototype.fetch = function(filters) {
        var deferred = Q.defer();
        readTorrent(process.cwd()+'/one.torrent', function(e, r) {
            var torrentHash = r.infoHash;
            var data = [{
            "type": "movie",
            "id": "124808",
            "imdb_id": "tt4870838",
            "title": "One Punch Man",
            "slug": "Not Two Only One Punch",
            "year": 2016,
            "genre": [" Animation \n\t\t\t\t"],
            "directors": [""],
            "cast": [" Stuart Allan", " Morena Baccarin", " Steve Blum\n\t\t\t\t"],
            "rating": 7,
            "runtime": 0,
            "image": "http://cdn.myanimelist.net/images/anime/12/76049.jpg",
            "cover": "http://cdn.myanimelist.net/images/anime/12/76049.jpg",
            "backdrop": "http://cdn.myanimelist.net/images/anime/12/76049.jpg",
            "synopsis": "\n          One Punch Man Punching Through Everything",
            "trailer": "https://www.youtube.com/watch?v=7_oWZUVI2k4",
            "google_video": false,
            "certification": "R",
            "torrents": {
                "720p": {
                    "url": "http://yify.is/data/torrents/0F570536370AB5593F36E0D165853B498721F53C.torrent",
                    "magnet": "magnet:?xt=urn:btih:"+torrentHash,
                    "size": "569670369",
                    "filesize": "294.8 MB",
                    "seed": 0,
                    "peer": 0,
                    "health": "bad"
                }
            },
            "provider": "Yts",
            "subtitle": {
                "en": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-76768.zip",
                "pt-br": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-77081.zip",
                "el": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-77086.zip",
                "id": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-76798.zip",
                "es": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-76869.zip",
                "ar": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-76951.zip",
                "hr": "http://www.yifysubtitles.com/subtitle-api/batman-bad-blood-yify-76975.zip"
            }
        }]; 
        var result = {
            results: Common.sanitize(data),
            hasMore: true
        };
        deferred.resolve(result);
        });
        
        return deferred.promise;
    };

    NeetCafe.prototype.detail = function(torrent_id, prev_data) {
        console.log(torrent_id);
        console.log(prev_data);
        return Q(prev_data);
    };

    App.Providers.NeetCafe = NeetCafe;

})(window.App);