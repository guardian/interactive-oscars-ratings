define([
    'iframe-messenger',
    'json!data/winners.json',
    'json!data/nominees.json',
    'text!templates/template.html',
    'text!templates/timeline.html',
    'ractive',
    'pegasus'
], function(
    iframeMessenger,
    winners,
    nominees,
    mainTemplate,
    timelineTemplate,
    Ractive,
    pegasus
) {
   'use strict';

    var sheetUrl = 'http://interactive.guim.co.uk/spreadsheetdata/1zgobYGCbggOdfB7SRYbOsEPSmkQaanyyfMV5Zq4MlFE.json';
    var i, timeline = [];
    for (i = 15; i <= 95; i += 5) {
        timeline.push(i);
    }

    function app(el, steps, furniture, worst) {
        var ractive = new Ractive({
            template: mainTemplate,
            el: el,
            data: {
                'furniture': furniture,
                'worst': worst,
                'timeline': timeline,
                'steps': steps,
                'nominees': nominees,
                'nomineeIds': [0, 1, 2, 3, 4].map(function (i) { return { directorId: i }; }),
                'winners': winners,
                'isWeb': true//window.guardian !== undefined
            },
            components: {
                'timeline': Ractive.extend({
                    'template': timelineTemplate,
                    'computed': {
                        'yearw': '100 / ${maxAge}'
                    }
                })
            }
        });

        function offset(node, end, x, y) {
            if (node === end) {
                return [x, y];
            } else {
                return offset(node.offsetParent, end, x + node.offsetLeft, y + node.offsetTop);
            }
        }

        ractive.on('timeline.hoverOver', function (evt, directorYear, directorBirth) {
            var node = evt.node;
            var coords = offset(node, el, 0, 0);
            this.set('info', {
                'films': directorYear.films,
                'year': directorYear.yearNo,
                'age': directorYear.yearNo - directorBirth,
                'x': coords[0] + node.clientWidth,
                'y': el.clientHeight - coords[1] - node.clientHeight
            });
        });

        ractive.on('timeline.hoverOut', function () { this.set('info', undefined); });
    }

    function init(el) {
        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();

        pegasus(sheetUrl).then(function (spreadsheet) {
            var steps = spreadsheet.sheets.steps.map(function (step) {
                step.notes = {};
                step.collapsed = step.collapsed === 'TRUE';
                step.directorIds = step.directorids.split(',').
                    filter(function (id) { return id.length > 0; }).
                    map(function (id) { return { directorId: parseInt(id) }; });
                return step;
            });

            spreadsheet.sheets.notes.forEach(function (note) {
                var step = steps[note.step];
                if (!step.notes[note.directorid]) {
                    step.notes[note.directorid] = {};
                }
                step.notes[note.directorid][note.year] = {
                    'note': note.note,
                    'left': note.left === 'TRUE',
                    'img': note.img
                };
            });

            app(el, steps, spreadsheet.sheets.furniture, spreadsheet.sheets.worst);
        });

    }

    return {
        init: init
    };
});
