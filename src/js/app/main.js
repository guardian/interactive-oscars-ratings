define([
    'iframe-messenger',
    'json!data/films.json',
    'text!templates/template.html',
    'ractive',
    'jquery',
    'noUiSlider',
], function(
    iframeMessenger,
    allFilms,
    template,
    Ractive,
    $
) {
   'use strict';

    var boxWidth = 12;
    var lowColor = [255, 255, 255];
    var hiColor = [0, 69, 110];
    var baseYear = 1860;

    var timeline = [];
    for (var year = 1890; year < 2015; year += 10) {
        timeline.push(year);
    }


    function app(el) {
        var ractive = new Ractive({
            template: template,
            el: el,
            data: {
                'timeline': timeline,
                'ratings': [2, 3, 4, 5, 6, 7, 8, 9],
                'allFilms': allFilms,
                'minRange': 6,
                'maxRange': 7,
                'getRatingColor': function (rating) {
                    if (rating) {
                        // scale ratings from 2-9 to 0-1
                        var normRating = Math.min((rating - 2) / 7, 1);
                        var i, color = [0, 0, 0];
                        for (i = 0; i < 3; i++) {
                            color[i] = Math.round(lowColor[i] * (1 - normRating) + hiColor[i] * normRating);
                        }
                        return 'rgb(' + color.join(',') + ')';
                    } else {
                        return 'transparent';
                    }
                },
                'getOffset': function (year) {
                    return (year - baseYear) * boxWidth;
                },
                'isHighlighted': function (director) {
                    return director.preOscarFilms >= this.get('minRange') &&
                           director.preOscarFilms <= this.get('maxRange');
                }
            }
        });

        ractive.on('hover', function (evt) {
            this.set('info', {
                'films': evt.context.films,
                'year': evt.index.yearNo,
                'age': evt.index.yearNo - allFilms[evt.index.directorNo].birth
            });
        });

        ractive.on('hover_out', function () { this.set('info', undefined); } );

        ractive.on('toggle', function (evt, ids) {
            // Minimise the amount of layout that gets marked as dirty
            ids.forEach(function (id) {
                ractive.toggle('allFilms.' + id + '.hide');
            });
        });

        $('.range').noUiSlider({
            start: [38, 40],
            step: 1,
            connect: true,
            range: {
                min: 0,
                max: 100
            }
        }).on('slide', function (evt) {
            var range = $(this).val();
            ractive.set('minRange', range[0]);
            ractive.set('maxRange', range[1]);
        });

        (function () {
            var timelineEle = document.getElementById('timeline');
            var sidebarEle = document.getElementById('sidebar');

            window.onscroll = function () {
                timelineEle.style.left = -window.pageXOffset + 'px';
                sidebarEle.style.top = -window.pageYOffset + 'px';
            };
        })();
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
