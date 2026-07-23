#!/usr/bin/env python3
import os, json, re

W = '/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827'

with open(os.path.join(W, 'V_array.json'), 'r', encoding='utf-8') as f:
    V = json.load(f)

# 分类映射
cm = {}
for v in V:
    if 'cat' in v and v['cat']:
        cm[v['c']] = v['cat']
cats = sorted(set(v['c'] for v in V))
cm_str = '{' + ','.join(f'"{k}":"{cm.get(k,k)}"' for k in cats) + '}'
co_str = '["' + '","'.join(cats) + '"]'

# 读index.html
with open(os.path.join(W, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

# 旧分类代码（精确匹配）
old_cat = '''// ===== \u5206\u7c7b\u5207\u6362 =====
function renderCatTabs(){
  const tabs=document.getElementById('catTabs');
  tabs.innerHTML=DATA.categories.map((c,i)=>`
    <button class="tab-btn${i===0?' active':''}" onclick="switchCat(${i},this)">${c.name}</button>`).join('');
}
function switchCat(idx,el){
  document.querySelectorAll('#catTabs .tab-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  const cat=DATA.categories[idx];
  document.getElementById('catTitle').textContent=cat.name;
  renderGrid('catGrid',cat.videos);
}'''

new_cat = f'''// ===== \u5206\u7c7b\u5207\u6362\uff08\u4eceV\u6570\u7ec4\u52a8\u6001\u6e32\u67d3\uff09 =====
const CAT_MAP = {cm_str};
const CAT_ORDER = {co_str};
function renderCatTabs(){{
  const tabs=document.getElementById('catTabs');
  tabs.innerHTML=CAT_ORDER.map((c,i)=>{{
    const count=V.filter(v=>v.c===c).length;
    return '<button class="tab-btn'+(i===0?' active':'')+'" onclick="switchCatByC(\\''+c+'\\',this)">'+(CAT_MAP[c]||c)+' <small>('+count+')</small></button>';
  }}).join('');
  if(CAT_ORDER.length>0) switchCatByC(CAT_ORDER[0], document.querySelector('#catTabs .tab-btn'));
}}
function switchCatByC(c, el){{
  document.querySelectorAll('#catTabs .tab-btn').forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('catTitle').textContent=CAT_MAP[c]||c;
  const videos=V.filter(v=>v.c===c);
  renderGrid('catGrid', videos);
}}'''

if old_cat in html:
    html = html.replace(old_cat, new_cat)
    print('OK-1: Cat tabs rewritten')
else:
    print('FAIL-1: Old cat code not matched')

# 下载函数
old_dl = "window.open(_curVideoUrl.replace('/index.m3u8','.mp4').replace('/index.m3u8?','.mp4?'),'_blank');"
new_dl = '''const mp4Url=_curVideoUrl.replace('/index.m3u8','.mp4').replace('/index.m3u8?','.mp4?');
    const a=document.createElement('a');
    a.href=mp4Url;
    a.download=_curVideoTitle.replace(/[\\\\\\/:*?"<>|]/g,'_')+'.mp4';
    a.target='_blank';
    a.click();
    document.getElementById('playerTip').style.display='block';
    document.getElementById('playerTip').innerHTML='\U0001f4a1 \u670d\u52a1\u5668: <code style="font-size:11px">ffmpeg -i \\"'+_curVideoUrl+'\\" -c copy \\"'+_curVideoTitle.replace(/[\\\\\\/:*?"<>|]/g,'_')+'.mp4\\"</code>';'''

if old_dl in html:
    html = html.replace(old_dl, new_dl)
    print('OK-2: Download enhanced')
else:
    print('FAIL-2: Old download not matched')

# 写回
with open(os.path.join(W, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('OK-3: index.html saved')

# 生成下载脚本
lines = ['#!/bin/bash','# \u798f\u97f3\u4f20\u64ad\u7231 - HLS\u89c6\u9891\u6279\u91cf\u4e0b\u8f7d\u811a\u672c','mkdir -p downloaded_videos','cd downloaded_videos','']
for v in V:
    st = re.sub(r'[\\/:*?"<>|]', '_', v['t'])
    lines.append(f'# [{v.get("cat","\u672a\u5206\u7c7b")}] {v["t"]}')
    lines.append(f'ffmpeg -i "{v["v"]}" -c copy "{st}.mp4" -loglevel error')

with open(os.path.join(W, 'download_all_videos.sh'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
os.chmod(os.path.join(W, 'download_all_videos.sh'), 0o755)
print(f'OK-4: download_all_videos.sh generated ({len(V)} videos)')

# 统计
print('\n\u5206\u7c7b\u7edf\u8ba1:')
for k in cats:
    print(f'  {cm.get(k,k)}: {sum(1 for v in V if v["c"]==k)}\u4e2a')
print(f'  \u603b\u8ba1: {len(V)}\u4e2a\u89c6\u9891')