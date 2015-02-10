#!/bin/bash
cat films.tsv | cut -f3 | uniq | sed 's#.*, ##' | sort | uniq -c | nl
