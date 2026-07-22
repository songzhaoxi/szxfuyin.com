#!/usr/bin/env python3
"""
修复v3：追加新视频到V数组尾部，不替换旧数据
"""
import json

# 读取data.json
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 读取index.html
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 从data.json提取所有带bvid的视频
videos_with_bvid = [v for v in data['videos'] if v.get('bvid')]
print(f"找到 {len(videos_with_bvid)} 个带B站BV号的视频")

# 分类映射
cat_map = {
    'animation': 'animation', 'movie': 'movie', 'testimony': 'jianzheng',
    'music': 'zanmei', 'preach': 'zhengdao', 'family': 'hunyin',
    'growth': 'zaojiu', 'study': 'shenxue', 'video': 'shipin',
    'hymns': 'shengyue', 'beginner': 'zaojiu'
}
cat_name_map = {
    'animation': '福音动漫', 'movie': '福音电影', 'testimony': '福音见证',
    'music': '赞美诗歌', 'preach': '福音证道', 'family': '婚姻家庭',
    'growth': '属灵成长', 'study': '神学课程', 'video': '福音视频',
    'hymns': '圣乐崇拜', 'beginner': '初信造就'
}

# 找到V数组最后一个id
# 寻找最后一个 ]; 之前的内容，提取最后一个id
v_start = html.find('const V = [')
v_end = html.find('];', v_start) 
v_content = html[v_start:v_end+2]  # 包含 const V = [ ... ];
# 提取最后一个id
import re
all_ids = re.findall(r'id:(\d+)', v_content)
if all_ids:
    last_id = max(int(x) for x in all_ids)
else:
    last_id = 0
print(f"V数组当前最后一个id: {last_id}")

# 生成新的V数组条目
new_v_entries_text = ""
bvid_map_lines = []
next_id = last_id + 1

for i, v in enumerate(videos_with_bvid):
    vid = v['id']
    cat = cat_map.get(v.get('c', ''), 'mudao')
    cat_name = cat_name_map.get(v.get('c', ''), '福音传播爱')
    title = v['t'].replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"')
    desc = v.get('desc', '').replace('\\', '\\\\').replace("'", "\\'").replace('"', '\\"')
    views = v.get('v', '')
    
    entry = f'  {{id:{next_id},t:"{title}",c:"{cat}",cat:"{cat_name}",movid:"",urlid:"",s:"B站",d:"{desc}",v:"{views}",l:""}}'
    
    if i < len(videos_with_bvid) - 1:
        new_v_entries_text += entry + ',\n'
    else:
        new_v_entries_text += entry + '\n'
    
    bvid_map_lines.append(f'  {next_id}:"{v["bvid"]}"')
    
    next_id += 1

print(f"生成 {len(videos_with_bvid)} 个新V条目，id范围: {last_id+1} ~ {next_id-1}")

# 在最后一个条目和];之间插入新数据
insert_pos = v_end  # ]; 的位置
# 在];之前插入新数据
new_v_section = ',\n' + new_v_entries_text
html = html[:insert_pos] + new_v_section + html[insert_pos:]

# 现在找到bvidMap并替换
b_start = html.find('const bvidMap = {')
b_content_start = html.find('{', b_start)
b_end = html.find('};', b_content_start) + 2

bvid_text = 'const bvidMap = {\n' + ',\n'.join(bvid_map_lines) + '\n};'
html = html[:b_start] + bvid_text + html[b_end:]

# 修改pv函数中的无B站分支
old_pv_code = """  } else {
    // 没有B站映射 → 保留福音TV播放地址
    html='<button class="src-btn" style="padding:6px 16px;border:1px solid #b8860b;border-radius:6px;background:#b8860b;color:#fff;font-size:13px;cursor:pointer;margin-right:6px" onclick="switchSource(\\'fuyintv\\',this,'+id+')">📺 福音TV播放</button>';
    curSource='fuyintv';
    f.src='https://www.fuyin.tv/player/player.php?urlid='+v.urlid+'&movid='+v.movid+'&autoplay=0';
  }"""

new_pv_code = """  } else {
    // 没有B站映射 → 显示友好提示
    html='<button class="src-btn" style="padding:6px 16px;border:1px solid #888;border-radius:6px;background:#888;color:#fff;font-size:13px;cursor:default;margin-right:6px">📺 暂无可用播放源</button>';
    curSource='fuyintv';
    f.src='about:blank';
    var tip=document.getElementById(\\'playerTip\\');
    if(tip){tip.textContent=\\'⚠️ 该视频暂无B站播放源，福音TV官网（fuyin.tv）当前无法访问\\';tip.style.display=\\'block\\';}
  }"""

if old_pv_code in html:
    html = html.replace(old_pv_code, new_pv_code)
    print("✅ pv函数无B站分支已修改")
else:
    print("❌ 未找到pv函数无B站分支，尝试其他匹配")
    # 尝试简化匹配
    old_simple = "没有B站映射 → 保留福音TV播放地址"
    new_simple = "没有B站映射 → 显示友好提示"
    if old_simple in html:
        print("找到简化文本")
    # 打印相关上下文
    idx = html.find('curSource')
    if idx > 0:
        print(f"curSource附近上下文: ...{html[idx:idx+300]}...")

# 修改switchSource中的福音TV分支
old_switch = """  } else if(src==='fuyintv'){
    f.src='https://www.fuyin.tv/player/player.php?urlid='+v.urlid+'&movid='+v.movid+'&autoplay=0';
    if(tip){tip.textContent='⚠️ 福音TV官网（fuyin.tv）当前无法访问，如视频无法加载请尝试B站源';tip.style.display='block'}
  }"""

new_switch = """  } else if(src==='fuyintv'){
    f.src='about:blank';
    if(tip){tip.textContent='⚠️ 福音TV官网（fuyin.tv）当前无法访问，请使用B站播放';tip.style.display='block'}
  }"""

if old_switch in html:
    html = html.replace(old_switch, new_switch)
    print("✅ switchSource福音TV分支已修改")
else:
    print("❌ 未找到switchSource分支")

# 修改section描述  
old_desc = '优质基督教视频资源 📺 福音TV国内流畅播放（227部视频）· 部分支持B站 · YouTube海外可看'
new_desc = f'优质基督教视频资源 📺 B站流畅播放（{len(videos_with_bvid)}部精品视频）· 更多资源陆续上架'
html = html.replace(old_desc, new_desc)

# 写回
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 最终验证
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    final = f.read()

# 统计V数组中的条目数
v_count = len(re.findall(r'{id:\d+', final))
print(f"\n✅ 最终V数组条目数: {v_count}")
print(f"✅ 新增 {len(videos_with_bvid)} 个可B站播放的视频")
print(f"✅ bvidMap 已更新 {len(videos_with_bvid)} 条映射")