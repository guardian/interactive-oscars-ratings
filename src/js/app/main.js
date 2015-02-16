define([
    'iframe-messenger',
    'json!data/films.json',
    'text!templates/template.html',
    'ractive',
    'pegasus'
], function(
    iframeMessenger,
    directors,
    template,
    Ractive,
    pegasus
) {
   'use strict';

    var boxWidth = 12;
    var sheetUrl = 'http://interactive.guim.co.uk/spreadsheetdata/1zgobYGCbggOdfB7SRYbOsEPSmkQaanyyfMV5Zq4MlFE.json';

    function yearX(year) {
        return year * boxWidth;
    }

    function app(el, steps) {
        var ractive = new Ractive({
            template: template,
            el: el,
            data: {
                'ratings': [1, 2, 3, 4, 5, 6, 7, 8, 9],
                'stepNo': 0,
                'steps': steps,
                'scale': 'film',
                'directors': directors,
                'yearX': yearX,
                'directorX': function (director) {
                    var baseYear = this.get('step').view === 'film' ? director.firstFilm : director.firstOscar;
                    return yearX(50 - (baseYear - director.birth));
                }
            },
            computed: {
                'step': '${steps}[${stepNo}]'
            }
        });

        ractive.on('hoverOver', function (evt) {
            this.set('info', {
                'films': evt.context.films,
                'year': evt.index.yearNo,
                'age': evt.index.yearNo - directors[evt.index.directorNo].birth
            });
        });

        ractive.on('hoverOut', function () { this.set('info', undefined); } );

        function toggleDirectors() {
            var visibleDirectors = ractive.get('step').directors;

            directors.forEach(function (director, i) {
                var hide = visibleDirectors.length !== 0 && visibleDirectors.indexOf(i) === -1;
                director.hide = hide;
            });

            ractive.update('directors');
        }

        ractive.on('step', function (evt, change) {
            this.add('stepNo', change);
            toggleDirectors();
        });

        var sidebarEle = document.getElementById('sidebar');
        window.addEventListener('scroll', function () {
            sidebarEle.style.top = -window.pageYOffset + 'px';
        });

        toggleDirectors();
    }

    function init(el) {
        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();

        pegasus(sheetUrl).then(function (steps) {
            app(el, steps.sheets.Copy.map(function (row) {
                row.collapsed = row.collapsed === 'TRUE';
                row.directors = row.directors.split(',').
                    filter(function (id) { return id.length > 0; }).
                    map(function (id) { return parseInt(id); });
                return row;
            }));
        });

    }

    return {
        init: init
    };
});
