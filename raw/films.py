#!/usr/bin/python
import sys, json, csv, re
from collections import defaultdict, OrderedDict

# 1st oscars has 2 winners
order = [[] for i in xrange(86)]
for film in csv.reader(sys.stdin, delimiter='\t'):
    _, _, _, director_name, _, _, _, oscar, _ = film
    m = re.search('\(([0-9]+)..\)', oscar)
    if m:
        oscar = int(m.group(1))
        order[oscar - 1].append(director_name)

flat_order = [item for sublist in order for item in sublist]

films = {}

sys.stdin.seek(0)
for film in csv.reader(sys.stdin, delimiter='\t'):
    director_birth, director_death, birth_place, director_name, film_year, film_name, url, oscar, rating = film

    m = re.search('\(([0-9]+..)\)', oscar)
    if m:
        oscar = m.group(1)

    film = {
        'name': film_name,
        'oscar': oscar
    }

    try:
        film['rating'] = float(rating)
    except ValueError:
        pass

    birth = int(director_birth.split('-')[0])
    if director_death:
        death = int(director_death.split('-')[0])
    else:
        death = 2014

    if director_name not in films:
        films[director_name] = {
            'name': director_name,
            'films': defaultdict(list),
            'birth': birth,
            'birth_place': re.sub('.*, ', '', birth_place),
            'death': death
        }

    if int(film_year) <= death:
        films[director_name]['films'][film_year].append(film)

print 'var films =', json.dumps(sorted(films.values(), key=lambda x: flat_order.index(x['name'])))

