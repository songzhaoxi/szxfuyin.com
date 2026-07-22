import requests, re, json, time, sys

sys.path.insert(0, '/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827')

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Referer": "https://www.fuyin.tv/"}

# 读取所有movid
with open("/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/fuyintv_data.json") as f:
    data = json.load(f)

all_movids = {}
for cat_id, cat_data in data.items():
    for movid in cat_data["movids"]:
        if movid not in all_movids:
            all_movids[movid] = cat_data["name"]

print(f"总数: {len(all_movids)}")

movid_to_urlid = {}
for i, movid in enumerate(sorted(all_movids.keys())):
    url = f"https://www.fuyin.tv/content/view/movid/{movid}/index.html"
    try:
        r = requests.get(url, headers=headers, timeout=15)
        urlids = re.findall(r'"urlid"\s*:\s*(\d+)', r.text)
        if urlids:
            movid_to_urlid[movid] = urlids[0]
            print(f"  [{i+1}] {movid} -> {urlids[0]}")
        else:
            print(f"  [{i+1}] {movid} -> ❌")
    except Exception as e:
        print(f"  [{i+1}] {movid} -> ❌ {e}")
    time.sleep(0.3)

with open("/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/movid_urlid_map.json", "w") as f:
    json.dump({"map": movid_to_urlid, "count": len(movid_to_urlid)}, f, ensure_ascii=False, indent=2)

print(f"\n✅ 成功: {len(movid_to_urlid)}/{len(all_movids)}")

# 输出JavaScript代码
js = "const FUYIN_IDS = {\n"
for movid, urlid in sorted(movid_to_urlid.items()):
    js += f"  {movid}: '{urlid}',\n"
js += "};"
print("\n=== JS CODE ===")
print(js)