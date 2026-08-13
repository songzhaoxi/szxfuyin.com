# -*- coding: utf-8 -*-
import re
html = open('jw_library.html', encoding='utf-8').read()
opens = len(re.findall(r'<div[ >]', html))
closes = html.count('</div>')
print('div open:', opens, 'close:', closes, '=>', 'OK' if opens == closes else 'MISMATCH!')
ids = ['page-home','page-bible','page-media','page-meeting','page-study','audioPlayer','toast','bibleContent','searchInput','bookList','chapterContent']
for i in ids:
    print(('FOUND  ' if ('id="'+i+'"') in html else 'MISSING'), i)
funcs = ['renderDaily','renderHome','renderPlaylist','renderBookmarks','renderMeetings','renderStudy','renderMedia','initBible','switchPage','playMedia','prevChapter','nextChapter']
for f in funcs:
    print(('FUNC-OK ' if ('function '+f) in html else 'FUNC-MISS'), f)
print('total lines:', html.count('\n')+1)
print('total size KB:', round(len(html.encode('utf-8'))/1024, 1))
