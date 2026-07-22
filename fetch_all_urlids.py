import requests, re, json, time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.fuyin.tv/"
}

# 从fuyintv_data.json读取所有movid
all_movids = {}
try:
    with open("/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/fuyintv_data.json", "r") as f:
        data = json.load(f)
        for cat_id, cat_data in data.items():
            for movid in cat_data["movids"]:
                if movid not in all_movids:
                    all_movids[movid] = cat_data["name"]
    print(f"✅ 共有 {len(all_movids)} 个唯一movid")
except Exception as e:
    print(f"❌ 读取失败: {e}")
    sys.exit(1)

# 对每个movid，访问页面获取urlid
movid_to_urlid = {}
failed = []

for i, movid in enumerate(all_movids):
    url = f"https://www.fuyin.tv/content/view/movid/{movid}/index.html"
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            # 查找urlid
            urlids = re.findall(r'"urlid"\s*:\s*(\d+)', r.text)
            if urlids:
                movid_to_urlid[movid] = urlids[0]
                print(f"  [{i+1}/{len(all_movids)}] movid={movid} -> urlid={urlids[0]} ({all_movids[movid]})")
            else:
                failed.append(movid)
                print(f"  [{i+1}/{len(all_movids)}] movid={movid} ❌ 未找到urlid")
        else:
            failed.append(movid)
            print(f"  [{i+1}/{len(all_movids)}] movid={movid} ❌ HTTP {r.status_code}")
    except Exception as e:
        failed.append(movid)
        print(f"  [{i+1}/{len(all_movids)}] movid={movid} ❌ {e}")
    time.sleep(0.3)

# 保存映射
output = {
    "movid_to_urlid": movid_to_urlid,
    "failed": failed,
    "total": len(all_movids),
    "success": len(movid_to_urlid)
}
with open("/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/movid_urlid_map.json", "w") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ 完成！成功: {len(movid_to_urlid)}/{len(all_movids)}")
if failed:
    print(f"❌ 失败: {len(failed)}个: {failed}")