#!/usr/bin/env python3
"""
🎯 终极修复方案 - 一步到位！
1. 保留原始227个福音TV视频
2. 追加89个B站视频（id228-316）
3. 添加bvidMap
4. 添加playerTip到播放器
5. 重写pv函数支持B站源切换
6. 添加switchSource函数
"""
import json, re

# 读取数据
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 提取带bvid的视频
videos_with_bvid = [v for v in data['videos'] if v.get('bvid')]
print(f"✅ 找到 {len(videos_with_bvid)} 个带B站BV号的视频")

# 分类映射
cat_map = {
    'animation':'animation','movie':'movie','testimony':'jianzheng',
    'music':'zanmei','preach':'zhengdao','family':'hunyin',
    'growth':'zaojiu','study':'shenxue','video':'shipin',
    'hymns':'shengyue','beginner':'zaojiu'
}
cat_name_map = {
    'animation':'福音动漫','movie':'福音电影','testimony':'福音见证',
    'music':'赞美诗歌','preach':'福音证道','family':'婚姻家庭',
    'growth':'属灵成长','study':'神学课程','video':'福音视频',
    'hymns':'圣乐崇拜','beginner':'初信造就'
}

# ===== 1. 在播放器overlay中添加playerTip =====
old_overlay = """    <div class="player-info">
      <h3 id="playerTitle">视频标题</h3>
      <p id="playerDesc">视频描述</p>
    </div>"""

new_overlay = """    <div class="player-info">
      <h3 id="playerTitle">视频标题</h3>
      <p id="playerDesc">视频描述</p>
      <div id="sourceBtns" style="margin-top:4px"></div>
      <div id="playerTip" style="margin-top:8px;padding:6px 12px;border-radius:6px;font-size:12px;background:rgba(184,134,11,0.1);color:#b8860b;display:none"></div>
    </div>"""

html = html.replace(old_overlay, new_overlay)
print("✅ playerTip和sourceBtns已添加")

# ===== 2. 追加新视频到V数组 =====
v_end = html.find('];', html.find('const V = ['))
# 在最后一个条目和];之间插入
# 找到最后一个 "  }, 或 "  }" 模式 - 简单些，直接找到最后一个id:227的行
last_v_line_pos = html.rfind('{id:227,', 0, v_end)
if last_v_line_pos > 0:
    # 找到这一行末尾的逗号和换行
    line_end = html.find('\n', last_v_line_pos)
    insert_pos = line_end + 1
    
    new_entries = []
    bvid_lines = []
    next_id = 228
    
    for v in videos_with_bvid:
        cat = cat_map.get(v.get('c', ''), 'mudao')
        cat_name = cat_name_map.get(v.get('c', ''), '福音传播爱')
        t = v['t'].replace('"', '\\"').replace('\\', '\\\\')
        d = v.get('desc', '').replace('"', '\\"').replace('\\', '\\\\')
        vw = v.get('v', '')
        
        new_entries.append(f'  {{id:{next_id},t:"{t}",c:"{cat}",cat:"{cat_name}",movid:"",urlid:"",s:"B站",d:"{d}",v:"{vw}",l:""}}')
        bvid_lines.append(f'  {next_id}:"{v["bvid"]}"')
        next_id += 1
    
    new_v_text = ',\n'.join(new_entries)
    html = html[:insert_pos] + new_v_text + ',\n' + html[insert_pos:]
    print(f"✅ 新增 {len(new_entries)} 个B站视频到V数组 (id228~{next_id-1})")
    
    # ===== 3. 添加bvidMap =====
    bvid_text = '\n\n// ===== B站（Bilibili）BV号映射 =====\nconst bvidMap = {\n' + ',\n'.join(bvid_lines) + '\n};\n'
    
    # 在const SP之后、rv函数之前插入
    sp_end = html.find('const SP =') 
    sp_end = html.find('];', sp_end) + 2
    html = html[:sp_end] + bvid_text + html[sp_end:]
    print(f"✅ bvidMap已添加 ({len(bvid_lines)}条映射)")
else:
    print("❌ 未找到V数组末尾")

# ===== 4. 替换pv函数 =====
old_pv = """// ===== 播放器 =====
function pv(id){
  const v=V.find(x=>x.id===id);
  if(!v) return;
  const p=document.getElementById('playerOverlay');
  const f=document.getElementById('playerFrame');
  const t=document.getElementById('playerTitle');
  const desc=document.getElementById('playerDesc');
  const catName=labels[catLabels[v.c]]||v.cat||'福音传播爱';
  if(f) f.src='https://www.fuyin.tv/player/player.php?urlid='+v.urlid+'&movid='+v.movid;
  if(t) t.textContent=v.t;
  if(desc) desc.textContent=catName+' - 来自福音TV的属灵资源';
  if(p) p.classList.add('open');
}
function cp(){document.getElementById('playerOverlay').classList.remove('open');const f=document.getElementById('playerFrame');if(f)f.src=''}"""

new_pv = """// ===== 播放器（B站优先，福音TV备用） =====
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
      if(tip){tip.textContent='\\u26a0\\ufe0f 该视频暂无B站播放源';tip.style.display='block'}
    }
  } else if(src==='fuyintv'){
    f.src='about:blank';
    if(tip){tip.textContent='\\u26a0\\ufe0f 福音TV官网（fuyin.tv）当前无法访问';tip.style.display='block'}
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
  const catName=labels[catLabels[v.c]]||v.cat||'\\u798f\\u97f3\\u4f20\\u64ad\\u7231';
  const hasBv=!!(typeof bvidMap!=='undefined'&&bvidMap[v.id]);
  if(t) t.textContent=v.t;
  if(desc) desc.textContent=catName+(v.s==='B站'?'':' - 来自福音TV');
  let html='';
  if(hasBv){
    html='<button class="src-btn" style="padding:6px 16px;border:1px solid #00a1d6;border-radius:6px;background:#00a1d6;color:#fff;font-size:13px;cursor:pointer;margin-right:6px" onclick="switchSource(\\'bilibili\\',this,'+id+')">\\u25b6 B站播放</button>';
    html+='<button class="src-btn" style="padding:6px 16px;border:1px solid #b8860b;border-radius:6px;background:transparent;color:#b8860b;font-size:13px;cursor:pointer;margin-right:6px" onclick="switchSource(\\'fuyintv\\',this,'+id+')">\\u25b6 福音TV</button>';
    curSource='bilibili';
    if(f) f.src='https://player.bilibili.com/player.html?bvid='+bvidMap[v.id]+'&autoplay=0&high_quality=1';
  } else {
    html='<button class="src-btn" style="padding:6px 16px;border:1px solid #888;border-radius:6px;background:#888;color:#fff;font-size:13px;cursor:default">\\u26a0 \\u6682\\u65e0\\u53ef\\u7528\\u64ad\\u653e\\u6e90</button>';
    curSource='fuyintv';
    if(f) f.src='about:blank';
    const tip=document.getElementById('playerTip');
    if(tip){tip.textContent='\\u26a0\\ufe0f \\u8be5\\u89c6\\u9891\\u6682\\u65e0B\\u7ad9\\u64ad\\u653e\\u6e90\\uff0c\\u798f\\u97f3TV\\u5b98\\u7f51\\uff08fuyin.tv\\uff09\\u5f53\\u524d\\u65e0\\u6cd5\\u8bbf\\u95ee';tip.style.display='block'}
  }
  if(sb) sb.innerHTML=html;
  if(p) p.classList.add('open');
}
function cp(){document.getElementById('playerOverlay').classList.remove('open');const f=document.getElementById('playerFrame');if(f)f.src=''}"""

if old_pv in html:
    html = html.replace(old_pv, new_pv)
    print("✅ pv/cp函数已替换为完整版")
else:
    # 尝试简化匹配
    print("⚠️ 精确匹配失败，尝试模糊匹配...")
    idx = html.find('// ===== 播放器 =====')
    if idx > 0:
        idx2 = html.find('function cp()', idx)
        if idx2 > 0:
            idx3 = html.find("f.src=''", idx2) + len("f.src=''")
            html = html[:idx] + new_pv + html[idx3:]
            print("✅ 通过模糊匹配替换成功")
        else:
            print("❌ 模糊匹配也失败")
    else:
        print("❌ 未找到播放器函数区域")

# ===== 5. 更新section描述 =====
old_desc = '优质基督教视频资源 📺 福音TV国内流畅播放（227部视频）· 部分支持B站 · YouTube海外可看'
new_desc = f'优质基督教视频资源 📺 B站流畅播放（{len(videos_with_bvid)}部精品视频）· 更多资源陆续上架'
html = html.replace(old_desc, new_desc)
print("✅ 描述已更新")

# ===== 6. 写回 =====
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 验证
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    final = f.read()

v_count = len(re.findall(r'{id:\d+,', final))
bvid_count = len(re.findall(r'\d+:"BV', final))
has_bvid_map = 'const bvidMap' in final
has_switches = 'function switchSource' in final
has_tip = 'playerTip' in final
has_new_pv = 'B站' in final[final.find('function pv'):final.find('function pv')+2000] if 'function pv' in final else False

print(f"\n{'='*40}")
print(f"📊 验证结果:")
print(f"  V数组条目数: {v_count}")
print(f"  bvidMap条数: {bvid_count}")
print(f"  bvidMap存在: {'✅' if has_bvid_map else '❌'}")
print(f"  switchSource存在: {'✅' if has_switches else '❌'}")
print(f"  playerTip存在: {'✅' if has_tip else '❌'}")
print(f"  pv函数含B站逻辑: {'✅' if has_new_pv else '❌'}")
print(f"{'='*40}")
print(f"🎉 修复完成！现在有 {v_count} 个视频，其中 {bvid_count} 个可通过B站播放！")