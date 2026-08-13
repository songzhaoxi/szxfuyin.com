import re

path = '/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html'

with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find the player section
player_start = html.find('// ===== 播放器（B站优先，福音TV备用） =====')
cp_end = html.find('function cp()', player_start)
cp_end2 = html.find('}', cp_end) + 1

print(f'Player section found at {player_start}')
print(f'cp() ends at {cp_end2}')

# Extract everything from "// =====" to the end of cp()
section_start = player_start
section_end = cp_end2

# The new replacement code
new_code = '''// ===== 播放器（B站优先，福音TV备用） =====
let curSource='bilibili';
function switchSource(src,btn,id){
  document.querySelectorAll('.src-btn').forEach(b=>{b.style.background='transparent';b.style.color=src==='bilibili'?'#00a1d6':'#b8860b';b.style.borderColor=src==='bilibili'?'#00a1d6':'#b8860b'});
  btn.style.background=btn.style.borderColor;btn.style.color='#fff';
  curSource=src;
  const v=V.find(x=>x.id===id); if(!v) return;
  const f=document.getElementById('playerFrame'); if(!f) return;
  const tip=document.getElementById('playerTip');
  if(src==='bilibili'){
    const bv=bvidMap[v.id];
    if(bv){
      f.src='https://player.bilibili.com/player.html?bvid='+bv+'&autoplay=0&high_quality=1';
      if(tip) tip.style.display='none';
    } else {
      f.src='about:blank';
      if(tip){tip.textContent='\\u26a0\\ufe0f \\u8be5\\u89c6\\u9891\\u6682\\u65e0B\\u7ad9\\u64ad\\u653e\\u6e90';tip.style.display='block'}
    }
  } else if(src==='fuyintv'){
    f.src='about:blank';
    if(tip){tip.textContent='\\u26a0\\ufe0f \\u798f\\u97f3TV\\u5b98\\u7f51\\uff08fuyin.tv\\uff09\\u5f53\\u524d\\u65e0\\u6cd5\\u8bbf\\u95ee';tip.style.display='block'}
  }
}
function pv(id){
  const v=V.find(x=>x.id===id);
  if(!v) return;
  const p=document.getElementById('playerOverlay');
  const f=document.getElementById('playerFrame');
  const t=document.getElementById('playerTitle');
  const desc=document.getElementById('playerDesc');
  const sb=document.getElementById('sourceBtns');
  const tip=document.getElementById('playerTip');
  const catName=labels[catLabels[v.c]]||v.cat||'\\u798f\\u97f3\\u4f20\\u64ad\\u7231';
  const hasBv=!!(typeof bvidMap!=='undefined'&&bvidMap[v.id]);
  if(t) t.textContent=v.t;
  if(desc) desc.textContent=catName+(v.s==='B\\u7ad9'?'':' - \\u6765\\u81ea\\u798f\\u97f3TV');
  if(tip) tip.style.display='none';
  let html='';
  if(hasBv){
    html='<button class="src-btn" style="padding:6px 16px;border:1px solid #00a1d6;border-radius:6px;background:#00a1d6;color:#fff;font-size:13px;cursor:pointer;margin-right:6px" onclick="switchSource(\\'bilibili\\',this,'+id+')">\\u25b6 B\\u7ad9\\u64ad\\u653e</button>';
    html+='<button class="src-btn" style="padding:6px 16px;border:1px solid #b8860b;border-radius:6px;background:transparent;color:#b8860b;font-size:13px;cursor:pointer;margin-right:6px" onclick="switchSource(\\'fuyintv\\',this,'+id+')">\\u25b6 \\u798f\\u97f3TV</button>';
    curSource='bilibili';
    const bv=bvidMap[v.id];
    if(f && bv) f.src='https://player.bilibili.com/player.html?bvid='+bv+'&autoplay=0&high_quality=1';
  } else {
    html='<button class="src-btn" style="padding:6px 16px;border:1px solid #888;border-radius:6px;background:#888;color:#fff;font-size:13px;cursor:default">\\u26a0 \\u6682\\u65e0\\u53ef\\u7528\\u64ad\\u653e\\u6e90</button>';
    curSource='fuyintv';
    if(f) f.src='about:blank';
    if(tip){tip.textContent='\\u26a0\\ufe0f \\u8be5\\u89c6\\u9891\\u6682\\u65e0B\\u7ad9\\u64ad\\u653e\\u6e90\\uff0c\\u798f\\u97f3TV\\u5b98\\u7f51\\u5f53\\u524d\\u65e0\\u6cd5\\u8bbf\\u95ee';tip.style.display='block'}
  }
  if(sb) sb.innerHTML=html;
  if(p) p.classList.add('open');
}
function cp(){document.getElementById('playerOverlay').classList.remove('open');const f=document.getElementById('playerFrame');if(f)f.src=''}'''

html = html[:section_start] + new_code + html[section_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'DONE! Wrote new player section from line {section_start} to {section_end}')
print('Verifying...')

# Verify
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

# Check key functions exist
checks = ['function switchSource', 'function pv(id)', 'function cp()', 'bvidMap[v.id]', 'playerFrame']
for c in checks:
    if c in verify:
        print(f'  OK: {c} found')
    else:
        print(f'  FAIL: {c} NOT found!')
