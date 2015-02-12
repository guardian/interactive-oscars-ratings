#!/usr/bin/python
import sys, os, bs4, csv, json, re

awards = {award[2]: award[0] for award in csv.reader(open('data/awards.tsv'), delimiter='\t')}
omdb = {film['imdbID']: film for film in json.load(open('data/omdb.json'))}

w = csv.writer(sys.stdout, delimiter='\t', lineterminator='\n')

for fn in os.listdir('directors/'):
    soup = bs4.BeautifulSoup(open('directors/%s' % fn).read(), 'html5lib')
    overview = soup.find(id='overview-top')

    name = overview.h1.span.text.encode('utf-8')

    print >> sys.stderr, fn, name

    birth_place = overview.find('a', attrs={'href': lambda x: x and 'birth_place' in x}).text.encode('utf-8')
    birth_place = re.sub(' [[(][^\]]+[)\]]', '' , birth_place)

    try:
        birth_date = overview.find(attrs={'itemprop': 'birthDate'})['datetime']
    except:
        birth_date = 'UNKNOWN'

    try:
        death_date = overview.find(attrs={'itemprop': 'deathDate'})['datetime']
    except:
        death_date = ''

    films = soup.find(id='filmo-head-director').next_sibling.next_sibling
    for film in films.find_all(class_='filmo-row'):
        film_year = re.sub('/[^0-9-]+', '', film.span.extract().text.strip())
        film_name = re.sub('\s+', ' ', film.text.strip().encode('utf-8'))
        film_name_l = film_name.lower()
        if film_year and 'TV' not in film_name and 'documentary' not in film_name_l and 'short' not in film_name_l:
            href = film.a['href']
            imdb_id = re.search('tt[0-9]+', href).group(0)
            film_year = film_year.split('-')[0]
            award = awards.get(film_name, '')
            w.writerow((birth_date, death_date, birth_place, name, film_year, film_name, href, award, omdb[imdb_id]['imdbRating']))
