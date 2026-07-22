#!/usr/bin/env python3
import json

with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/fuyintv_data.json') as f:
    cats = json.load(f)
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/movid_urlid_map.json') as f:
    map_data = json.load(f)

movid_to_urlid = map_data['movid_to_urlid']
cat_names = {'133':'福音慕道','22':'福音证道','34':'婚姻家庭','24':'赞美诗歌','42':'福音见证','21':'福音视频','26':'圣乐崇拜','25':'初信造就','23':'福音动漫','290':'神学课程'}
cat_ids = {'133':'mudao','22':'zhengdao','34':'hunyin','24':'zanmei','42':'jianzheng','21':'shipin','26':'shengyue','25':'chuxin','23':'dongman','290':'shenxue'}

videos = []
vid = 1
seen = set()
for cat_id, cat_info in cats.items():
    cn = cat_names.get(cat_id, cat_info['name'])
    cs = cat_ids.get(cat_id, cat_id)
    for idx, movid in enumerate(cat_info['movids']):
        if movid in seen:
            continue
        seen.add(movid)
        urlid = movid_to_urlid.get(movid, '')
        if not urlid:
            continue
        videos.append('  {id:%d,t:"%s #%d",c:"%s",cat:"%s",movid:"%s",urlid:"%s",s:"福音TV",d:"%s - 来自福音TV的属灵资源",v:"",l:""}' % (vid, cn, idx+1, cs, cn, movid, urlid, cn))
        vid += 1

print('const V = [')
print(',\n'.join(videos))
print('];')
