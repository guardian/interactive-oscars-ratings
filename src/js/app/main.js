define([
    'iframe-messenger',
    'json!data/films.json',
    'text!templates/template.html',
    'ractive'
], function(
    iframeMessenger,
    films,
    template,
    Ractive
) {
   'use strict';

    function app(el) {
        var boxWidth = 12;
        var lowColor = [255, 255, 255];
        var hiColor = [0, 69, 110];
        var baseYear = 1860;

        var timeline = [];
        for (var year = 1890; year < 2015; year += 10) {
            timeline.push(year);
        }

        function getRatingColor(rating) {
            // scale ratings from 2-9 to 0-1
            var normRating = Math.min((rating - 2) / 7, 1);
            var i, color = [0, 0, 0];
            for (i = 0; i < 3; i++) {
                color[i] = Math.round(lowColor[i] * (1 - normRating) + hiColor[i] * normRating);
            }
            return 'rgb(' + color.join(',') + ')';
        }

        var ractive = new Ractive({
            template: template,
            el: el,
            data: {
                'timeline': timeline,
                'ratings': [2, 3, 4, 5, 6, 7, 8, 9],
                'allFilms': films,
                'getRatingColor': getRatingColor,
                'getRating': function (films) {
                    var ratedFilms = films.filter(function (film) { return film.rating !== undefined; });
                    if (ratedFilms.length > 0) {
                        var sumRating = ratedFilms.reduce(function (sum, film) {
                            return sum + film.rating;
                        }, 0);

                        var avgRating = Math.floor(sumRating / ratedFilms.length);
                        return getRatingColor(avgRating);
                    } else {
                        return 'transparent';
                    }
                },
                'getOffset': function (year) {
                    return (year - baseYear) * boxWidth;
                },
                'getOscar': function (films) {
                    return films.filter(function (film) { return film.oscar; })[0].oscar;
                }
            }
        });

        ractive.on('hover', function (evt) {
            this.set('info', {
                'films': evt.context,
                'year': evt.index.year,
                'age': evt.index.year - films[evt.index.directorNo].birth
            });
        });

        ractive.on('hover_out', function () { this.set('info', undefined); } );

        var timelineEle = document.getElementById('timeline');
        var sidebarEle = document.getElementById('sidebar');

        window.onscroll = function () {
            timelineEle.style.left = -window.pageXOffset + 'px';
            sidebarEle.style.top = -window.pageYOffset + 'px';
        };
    }

    function init(el) {
        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();
        app(el);
    }

    return {
        init: init
    };
});
