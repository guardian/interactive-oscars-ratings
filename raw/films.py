#!/usr/bin/python
import sys, json, csv, re
from collections import defaultdict, OrderedDict
from itertools import islice

low_color = [255, 255, 255];
hi_color = [0, 69, 110];

# 1st oscars has 2 winners
order = [[] for i in xrange(86)]
for film in csv.reader(sys.stdin, delimiter='\t'):
    _, _, _, director_name, _, _, _, oscar, _, _, _ = film
    m = re.search('\(([0-9]+)..\)', oscar)
    if m:
        oscar = int(m.group(1))
        order[oscar - 1].append(director_name)

flat_order = [item for sublist in order for item in sublist]
dedup_order = list(OrderedDict.fromkeys(flat_order))

films = {}

def window(seq, n):
    "Returns a sliding window (of width n) over data from the iterable"
    "   s -> (s0,s1,...s[n-1]), (s1,s2,...,sn), ...                   "
    it = iter(seq)
    result = tuple(islice(it, n))
    if len(result) == n:
        yield result
    for elem in it:
        result = result[1:] + (elem,)
        yield result

sys.stdin.seek(0)
for film in csv.reader(sys.stdin, delimiter='\t'):
    director_birth, director_death, birth_place, director_name, film_year, film_name, url, oscar, rating, votes, best_picture = film
    film_year = int(film_year)

    film = {'name': film_name}

    m = re.search('\(([0-9]+..)\)', oscar)
    if m:
        film['oscar'] = m.group(1)
        film['bestPicture'] = best_picture == 'True'

    try:
        film['rating'] = float(rating)
    except ValueError:
        continue

    birth = int(director_birth.split('-')[0])
    if director_death:
        death = int(director_death.split('-')[0])
    else:
        death = 2014

    if director_name not in films:
        films[director_name] = {
            'name': director_name,
            'year': defaultdict(lambda: {'films': []}),
            'birth': birth,
            'birthPlace': re.sub('.*, ', '', birth_place),
            'age': death - birth,
            'dead': len(director_death) > 0,
            'scale': {}
        }

    if film_year <= death:
        films[director_name]['year'][film_year]['films'].append(film)

# precompute a year summaries (oscars/ratings)
for director in films.values():
    print >> sys.stderr, director['name']

    # find gaps between years, including birth - first film
    ordered_years = [director['birth']] + sorted(director['year'].keys())
    year_gaps = dict(map(lambda (a, b): (b, b - a - 1), tuple(window(ordered_years, n=2))))

    first_oscar = 3000
    for year_no, year in director['year'].iteritems():
        all_films = year['films']

        rated_films = filter(lambda film: 'rating' in film, all_films)
        if len(rated_films) > 0:
            max_rating = max(film['rating'] for film in rated_films)

        oscar_film = filter(lambda film: 'oscar' in film, all_films)
        if len(oscar_film) > 0:
            first_oscar = min(first_oscar, year_no)
            max_rating = oscar_film[0]['rating'] # override for oscar winning year
            year['oscar'] = True

        if max_rating:
            max_rating *= 10/9.5
            year['rating'] = max_rating * max_rating * max_rating / 10 # x^3 / 10

        year['gap'] = year_gaps[year_no]

    director['scale']['film'] = ordered_years[1] # 0 is birth
    director['scale']['oscar'] = first_oscar
    director['scale']['birth'] = director['birth'] + 45

print json.dumps(sorted(films.values(), key=lambda x: flat_order.index(x['name'])))
