# -*- coding: utf-8 -*-
import re
html = open('jw_library.html', encoding='utf-8').read()
# 去掉 script 块，只统计真正的 HTML 结构
html_no_js = re.sub(r'<script>.*?</script>', '', html, flags=re.S)
opens = len(re.findall(r'<div[ >]', html_no_js))
closes = html_no_js.count('</div>')
print('HTML-only div open:', opens, 'close:', closes, '=>', 'OK' if opens == closes else 'MISMATCH!')
# 校验所有页面容器
for pid in ['page-home','page-bible','page-media','page-meetings','page-study']:
    m = re.search(r'<div class="page[^"]*" id="%s">(.*?)</div>\s*(?=<!--|\s*$)' % pid, html, re.S)
    print(pid, '=>', 'OK' if m else 'CHECK')
# 校验关键 DOM id
for i in ['dtDate','dtContent','dtRef','bookSelect','chapterSelect','bibleSearchInput','bibleReader','bookmarkList','mediaChips','mediaGrid','playerBox','audioPlayer','playlistList','weekLabel','lifeMeetingList','watchtowerList','noteInput','noteList','toast','globalSearchInput','modal','modalBody']:
    if ('id="'+i+'"') not in html:
        print('MISSING ID:', i)
print('ID check done')
# 校验函数定义
funcs = ['renderDaily','renderHome','renderPlaylist','renderBookmarks','renderMeetings','renderStudy','renderMedia','initBible','switchPage','openMedia','filterMedia','shiftWeek','bookmarkDaily','shareDaily','readFullChapter','speakText','prevDaily','nextDaily','globalSearch','searchInBook','prevChapter','nextChapter','bookChanged','loadChapter','openBookPicker','toggleFontSize','addToPlaylist','saveDownload','toggleSpeed','clearPlaylist','addNote','exportNotes','openPub','clearBookmarks','switchHomeTab']
missing = [f for f in funcs if ('function '+f) not in html]
print('missing functions:', missing if missing else 'NONE - all OK!')