# -*- coding: utf-8 -*-
import re
html = open('jw_library.html', encoding='utf-8').read()
print('contentModal id:', 'id="contentModal"' in html)
print('modalTitle id:', 'id="modalTitle"' in html)
print('modalBody id:', 'id="modalBody"' in html)
# filterMedia 任何形式
print('filterMedia occurrences:', len(re.findall(r'filterMedia', html)))
print('filterMedia def forms:')
for m in re.finditer(r'.{60}filterMedia.{60}', html):
    print('  ...', m.group(0).replace('\n','\\n'), '...')
# 找出缺少闭合的 div：逐行扫描栈
html_no_js = re.sub(r'<script>.*?</script>', '', html, flags=re.S)
stack = []
lines = html_no_js.split('\n')
for i, ln in enumerate(lines, 1):
    for m in re.finditer(r'<div(\s[^>]*)?>', ln):
        stack.append((i, 'open'))
    for m in re.finditer(r'</div>', ln):
        if stack:
            stack.pop()
        else:
            print('EXTRA </div> at line', i)
print('unclosed div opens:', [s[0] for s in stack] if stack else 'NONE - all closed')