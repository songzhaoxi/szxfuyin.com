import requests, json, re, time, sys

API_HOST = "https://www.fuyin.tv"
# 所有分类
CATEGORIES = {
    133: "福音慕道", 22: "福音证道", 34: "婚姻家庭",
    24: "赞美诗歌", 42: "福音见证", 21: "福音视频",
    26: "圣乐崇拜", 25: "初信造就", 23: "福音动漫",
    290: "神学课程"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml"
}

# 访问各分类页面获取视频列表
all_videos = {}
for cat_id, cat_name in CATEGORIES.items():
    url = f"{API_HOST}/content/category/id/{cat_id}/index.html"
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            # 提取movid
            movids = set(re.findall(r'/content/view/movid/(\d+)/index\.html', r.text))
            titles = re.findall(r'<div class="name[^"]*"><!--\[-->([^<]+)<!--\]--></div>', r.text)
            authors = re.findall(r'<div class="author[^"]*">([^<]+)</div>', r.text)
            print(f"✅ {cat_name} (id={cat_id}): {len(movids)} videos, {len(titles)} titles, {len(authors)} authors")
            all_videos[cat_id] = {
                "name": cat_name,
                "movids": list(movids)[:50],
                "titles": titles[:50],
                "authors": authors[:50]
            }
    except Exception as e:
        print(f"❌ {cat_name}: {e}")
    time.sleep(1)

print("\n\n===== 全站数据汇总 =====")
for cat_id, data in all_videos.items():
    print(f"\n--- {data['name']} ---")
    for i, mid in enumerate(data['movids'][:20]):
        title = data['titles'][i] if i < len(data['titles']) else "?"
        author = data['authors'][i] if i < len(data['authors']) else "?"
        print(f"  movid={mid}: {title} - {author}")

# 输出JSON
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/fuyintv_data.json', 'w') as f:
    json.dump(all_videos, f, ensure_ascii=False, indent=2)
print("\n✅ 数据已保存到 fuyintv_data.json")
