import json, re, time, urllib.request, urllib.parse, os, sys

CATEGORIES = {
    "福音慕道": ["福音慕道", "耶稣", "救恩", "永生", "圣经真理"],
    "证道": ["证道", "讲道", "主日讲道", "圣经讲解"],
    "婚姻家庭": ["婚姻家庭", "基督徒婚姻", "家庭建造", "夫妻关系"],
    "赞美诗歌": ["赞美诗", "赞美诗歌", "基督教诗歌", "敬拜赞美", "心灵赞美"],
    "福音电影": ["福音电影", "耶稣电影", "耶稣传", "圣经故事", "基督教电影", "受难记"],
    "福音动漫": ["福音动漫", "妙妙书", "圣经故事动画", "基督教动画", "超级妙妙书"],
    "福音见证": ["福音见证", "冯秉诚", "尼克胡哲", "刘志雄", "基督徒见证"],
    "属灵成长": ["属灵成长", "灵修", "每日灵修", "生命成长", "门徒训练"]
}

def search_bilibili(keyword, page=1):
    params = urllib.parse.urlencode({"search_type": "video", "keyword": keyword, "page": page})
    url = f"https://api.bilibili.com/x/web-interface/search/type?{params}"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    req.add_header("Referer", "https://www.bilibili.com")
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode("utf-8"))
        videos = []
        if data.get("code") == 0 and data.get("data", {}).get("result"):
            for item in data["data"]["result"]:
                bvid = item.get("bvid", "")
                title = re.sub(r'<[^>]+>', '', item.get("title", ""))
                if bvid:
                    videos.append({"bv": bvid, "title": title})
        return videos
    except Exception as e:
        return []

results = {}
for cat, keywords in CATEGORIES.items():
    print(f"\n===== {cat} =====")
    cat_videos = []
    seen_bvs = set()
    for kw in keywords:
        for pg in [1, 2]:
            vids = search_bilibili(kw, pg)
            for v in vids:
                if v["bv"] not in seen_bvs:
                    seen_bvs.add(v["bv"])
                    cat_videos.append(v)
            time.sleep(0.5)
        if len(cat_videos) >= 20:
            break
    results[cat] = cat_videos[:30]
    print(f"  获取 {len(cat_videos[:30])} 个视频")

print("\n========== BVIDS ==========")
for cat, vids in results.items():
    bvs = [v["bv"] for v in vids]
    print(f'"{cat}": {json.dumps(bvs, ensure_ascii=False)}')
