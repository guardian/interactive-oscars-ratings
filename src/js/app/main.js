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

    var boxWidth = 8;
    var sheetUrl = 'http://interactive.guim.co.uk/spreadsheetdata/1zgobYGCbggOdfB7SRYbOsEPSmkQaanyyfMV5Zq4MlFE.json';
    var i, timeline = [];
    for (i = 15; i <= 95; i += 5) {
        timeline.push(i);
    }

    function yearX(year) {
        return year * boxWidth;
    }

    function app(el, steps) {
        var ractive = new Ractive({
            template: template,
            el: el,
            data: {
                'timeline': timeline,
                'stepNo': 0,
                'debug': true,
                'steps': steps,
                'directors': directors,
                'yearX': yearX,
                'directorX': function (director) {
                    var baseYear = director.scale[this.get('step').view];
                    return yearX(50 - (baseYear - director.birth));
                }
            },
            computed: {
                'step': '${steps}[${stepNo}]'
            }
        });

        function offset(node, end, x, y) {
            if (node === end) {
                return [x, y];
            } else {
                return offset(node.offsetParent, end, x + node.offsetLeft, y + node.offsetTop);
            }
        }

        ractive.on('hoverOver', function (evt) {
            var main = document.querySelector('.main');
            var coords = offset(evt.node, main, 0, 0);
            this.set('info', {
                'films': evt.context.films,
                'year': evt.index.yearNo,
                'age': evt.index.yearNo - directors[evt.index.directorNo].birth,
                'x': coords[0] - (300 / 2) + boxWidth / 2,
                'y': coords[1] + evt.node.clientHeight
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

        toggleDirectors();

        window.ractive = ractive;
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
