#!/usr/bin/env python3
"""暴力写入所有视频到DATA.categories"""
import json, re

# 读取data.json获取所有视频数据
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/data.json','r',encoding='utf-8') as f:
    raw = json.load(f)

# 读取index.html
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html','r',encoding='utf-8') as f:
    html = f.read()

# 所有视频
all_videos = raw['videos']

# 分类ID映射
cat_names = {
    'animation':'福音动漫', 'movie':'福音电影', 'testimony':'福音见证',
    'music':'赞美诗歌', 'preach':'福音证道', 'family':'婚姻家庭',
    'growth':'属灵成长', 'study':'神学课程', 'video':'福音视频',
    'hymns':'圣乐崇拜', 'beginner':'初信造就'
}

# 讲员映射（从speakers提取，用于author字段）
speaker_keywords = {
    '唐崇榮':'唐崇榮','冯秉诚':'冯秉诚','冯秉誠':'冯秉诚',
    '史普罗':'史普罗','約翰·派博':'约翰·派博','约翰·派博':'约翰·派博',
    '赞美之泉':'赞美之泉','天韻詩歌':'天韵诗歌','天韻':'天韵诗歌',
    '刘志雄':'刘志雄','于宏洁':'于宏洁','林慈信':'林慈信',
    '康来昌':'康来昌','孙宝玲':'孙宝玲','大卫鲍森':'大卫鲍森',
    '寇绍恩':'寇绍恩','程蒙恩':'程蒙恩','苏立忠':'苏立忠',
    '尼克胡哲':'尼克胡哲','耶稣传':'耶稣传','耶稣':'耶稣传',
    '抹大拉':'抹大拉的馬利亞','使徒行传':'使徒行传',
    '妙妙书':'超级妙妙书','圣经工程':'圣经工程',
    '吴继扬':'吴继扬','孙越':'孙越'
}

def detect_author(v):
    """从视频标题/描述中检测作者"""
    t = (v.get('t','') + ' ' + v.get('desc','')).lower()
    for kw, author in speaker_keywords.items():
        if kw.lower() in t:
            return author
    # fallback
    cat = v.get('c','')
    if cat in ['music','hymns']: return '赞美诗'
    if cat in ['animation']: return '超级妙妙书'
    if cat in ['movie']: return '福音电影'
    if cat in ['testimony','preach']: return '讲员'
    return '福音视频'

def transform_video(v):
    """把data.json格式转为前端需要的格式"""
    author = detect_author(v)
    # 尝试从标题提取作者
    title = v.get('t','')
    for kw, author_name in speaker_keywords.items():
        if kw in title:
            author = author_name
            break
    
    return {
        'movid': v['id'],
        'title': title,
        'author': author,
        'v': v.get('v','0'),
        'dur': v.get('dur','0:00'),
        'date': get_date(v['id'])
    }

def get_date(vid):
    """模拟日期分配"""
    dates = {
        1001:'06/15',1002:'06/14',1003:'06/13',1004:'06/12',1005:'06/11',
        1006:'06/10',1007:'06/09',1008:'06/08',1009:'06/07',1010:'06/06',
        1011:'06/05',1012:'06/04',1013:'06/03',1014:'06/02',1015:'06/01',
        1016:'05/31',1017:'05/30',1018:'05/29',1019:'05/28',1020:'05/27',
        1021:'05/26',1022:'05/25',1023:'05/24',1024:'05/23',1025:'05/22',
        1026:'05/21',1027:'05/20',1028:'05/19',1029:'05/18',1030:'05/17',
        1031:'05/16',1032:'05/15',1033:'05/14',1034:'05/13',1035:'05/12',
        1036:'06/13',1037:'05/11',1038:'05/10',1039:'05/09',1040:'05/08',
        1041:'05/07',1042:'05/06',1043:'05/05',1044:'05/04',1045:'05/03',
        1046:'05/02',1047:'05/01',1048:'04/30',1049:'04/29',1050:'04/28',
        1051:'04/27',1052:'04/26',1053:'04/25',1054:'04/24',1055:'04/23',
        1056:'04/22',1057:'06/14',1058:'04/21',1059:'04/20',1060:'04/19',
        1061:'06/09',1062:'04/18',1063:'04/17',1064:'04/16',1065:'04/15',
        1066:'04/14',1067:'04/13',1068:'04/12',1069:'04/11',1070:'04/10',
        1071:'04/09',1072:'04/08',1073:'04/07',1074:'04/06',1075:'04/05',
        1076:'04/04',1077:'04/03',1078:'04/02',1079:'04/01',1080:'03/31',
        1081:'03/30',1082:'03/29',1083:'03/28',1084:'03/27',1085:'03/26',
        1086:'03/25',1087:'03/24',1088:'03/23',1089:'03/22'
    }
    return dates.get(vid, '06/01')

# 按分类分组视频
cat_videos = {}
for v in all_videos:
    c = v.get('c','')
    if c not in cat_videos:
        cat_videos[c] = []
    cat_videos[c].append(transform_video(v))

# 构建带videos的categories
cat_list = raw['categories']
enriched_cats = []
for cat in cat_list:
    cid = cat['id']
    videos = cat_videos.get(cid, [])
    # 去重（按movid）
    seen = set()
    unique_videos = []
    for v in videos:
        if v['movid'] not in seen:
            seen.add(v['movid'])
            unique_videos.append(v)
    enriched_cat = dict(cat)
    enriched_cat['videos'] = unique_videos
    enriched_cats.append(enriched_cat)
    print(f"  ✅ {cat['name']}: {len(unique_videos)}个视频")

# 生成JS代码
cats_json_str = json.dumps(enriched_cats, ensure_ascii=False, indent=2)

# 现在替换index.html中的categories部分
# 模式：找到 `const DATA = {\n  categories: [` 开始，到第一个 `],` 结束（后面跟banners等）
# 策略：先找到 const DATA = { 的位置，然后找到 categories: [ 和匹配的 ],

pattern_start = r'const DATA = \{\s*\n\s*categories:\s*\['
match_start = re.search(pattern_start, html)
if not match_start:
    print("❌ 未找到 DATA.categories 起始位置")
    exit(1)

start_pos = match_start.start()
# 找到categories数组的结束: 匹配 `],` 后面跟着换行和任意空格，然后 banners:
# 更安全的做法：找到第一个 `],` 在categories段落后
content_after_start = html[match_start.end():]
# 在categories数组中，每个分类结束有 `},`，而categories数组本身结束是 `],`
# 由于 categories 后面直接是 banners，找 `],` 后面紧跟着 banners:
pattern_end = r'\],\s*\n\s*banners:'
match_end = re.search(pattern_end, html[match_start.end():])
if not match_end:
    print("❌ 未找到categories数组结束位置")
    exit(1)

end_pos = match_start.end() + match_end.end() - len(match_end.group()) + 2  # 保留 `],`
# 更精确：`],` 的位置
end_marker_pos = match_start.end() + match_end.start()
# end_marker_pos 是 `],` 的位置，我们要保留 `],`
# 但更方便的是直接替换从categories开始到 ], 结束

# 构建替换用的新categories部分
indent = '  '
new_cats_js = f'const DATA = {{\n{indent}categories: '
# 格式化JSON，但使用与原有风格一致的缩进
# 直接用json.dumps生成漂亮的格式
cats_formatted = json.dumps(enriched_cats, ensure_ascii=False, indent=2)
# 缩进调整（原有代码使用2空格缩进）
lines = cats_formatted.split('\n')
indented_lines = []
for line in lines:
    indented_lines.append(f'{indent}{line}' if line.strip().startswith('{') or line.strip().startswith('[') or line.strip().startswith('"') or line.strip().startswith('}') or line.strip().startswith(']') else f'{indent}{line}')
cats_formatted_indented = '\n'.join(indented_lines)

new_cats_section = f'const DATA = {{\n  categories: {cats_formatted_indented[2:]},'

# 替换从 start_pos 到 end_pos+2 的内容
old_section = html[start_pos:end_pos+2]
html_new = html[:start_pos] + new_cats_section + html[end_pos+2:]

print(f"\n📊 文件长度: {len(html)} → {len(html_new)}")

# 验证DATA.videos字段是否还在
if 'videos: [' in html_new:
    print("✅ DATA.videos字段保留完好")
else:
    print("❌ DATA.videos可能丢失！")

# 写入
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html','w',encoding='utf-8') as f:
    f.write(html_new)

print(f"\n🎉 全部写入完成！")
