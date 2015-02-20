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

    winners.forEach(function (director, id) {
        director.directorId = id;
    });

    winners.forEach(function (director) {
        director.films = [].concat.apply([], director.year.map(function (year) {
            return year.films;
        }));
    });

    var directors = winners.concat(nominees);
    directors.reverse();

    function app(el, steps, furniture, worst) {
        var body = document.getElementById('article-body');
        if (body) {
            body.className += ' interactivePadding';
        }

        var ractive = new Ractive({
            template: mainTemplate,
            el: el,
            data: {
                'mode': window.location.hash === '#explore' ? 'explore' :'tour',
                'furniture': furniture,
                'worst': worst,
                'timeline': timeline,
                'steps': steps,
                'nominees': nominees,
                'directors': directors,
                'stepWinners': function (stepNo, ids) {
                    var subset = winners.filter(function (director, id) {
                        return ids.indexOf(id) !== -1;
                    });

                    if (stepNo === 0) {
                        subset.reverse();
                    }

                    return subset;
                },
                'exploreExpanded': true,
                'isWeb': window.guardian !== undefined
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

        function offset(node, x, y) {
            if (node === el) {
                return [x, y];
            } else {
                return offset(node.offsetParent, x + node.offsetLeft, y + node.offsetTop);
            }
        }

        ractive.on('timeline.hoverOver', function (evt, directorYear, directorBirth) {
            var node = evt.node;
            var coords = offset(node, 0, 0);
            this.set('info', {
                'films': directorYear.films,
                'year': directorYear.yearNo,
                'age': directorYear.yearNo - directorBirth,
                'x': coords[0] + node.clientWidth,
                'y': el.clientHeight - coords[1] - node.clientHeight
            });
        });

        ractive.on('timeline.hoverOut', function () { this.set('info', undefined); });

        ractive.on('mode', function (evt, mode) { this.set('mode', mode); });

        ractive.on('search', function (evt) {
            evt.original.preventDefault();

            var text = this.get('searchText');
            directors.forEach(function (director) {
                director.hide = director.name.toLowerCase().indexOf(text) === -1;
            });
            this.update('directors');
        });

        ractive.on('share', function (evt, network) {
            var twitterBaseUrl = 'https://twitter.com/intent/tweet?text=';
            var twitterMessage = 'What it really means to win the #Oscars’ best director';
            var facebookBaseUrl = 'https://www.facebook.com/sharer/sharer.php?ref=responsive&u=';
            var googleBaseUrl = 'https://plus.google.com/share?url=';
            var emailSubject = 'What it really means to win the Oscars’ best director';
            var url = encodeURIComponent(window.location.href);
            var shareWindow;

            if (network === 'twitter') {
                shareWindow = twitterBaseUrl + encodeURIComponent(twitterMessage + ' ') + url;
            } else if (network === 'facebook') {
                shareWindow = facebookBaseUrl + url;
            } else if (network === 'email') {
                shareWindow = 'mailto:?subject=' + encodeURIComponent(emailSubject) + '&body=' + url;
            } else if (network === 'google') {
                shareWindow = googleBaseUrl + url;
            }

            window.open(shareWindow, network + 'share', 'width=640,height=320');
        });

        window.addEventListener('hashchange', function () {
            ractive.set('mode', window.location.hash === '#explore' ? 'explore' : 'tour');
            window.scrollTo(0, 0);
        });
    }

    function init(el) {
        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();

        el.innerHTML = '<center>Loading&#8230;</center>';

        pegasus(sheetUrl).then(function (spreadsheet) {
            var steps = spreadsheet.sheets.steps.map(function (step) {
                step.notes = {};
                step.collapsed = step.collapsed === 'TRUE';
                step.directorIds = step.directorids.split(',').
                    filter(function (id) { return id.length > 0; }).
                    map(function (id) { return parseInt(id); });
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
