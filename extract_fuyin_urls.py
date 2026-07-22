import requests, re, json, time, sys

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Referer": "https://www.fuyin.tv/",
}

# 测试movid
movid = "2942"

# 访问页面
url = f"https://www.fuyin.tv/content/view/movid/{movid}/index.html"
r = requests.get(url, headers=headers, timeout=15)
text = r.text

# 尝试提取播放列表JSON
# 搜索 play_list 或类似模式
patterns = [
    r'play_list["\']?\s*[=:]\s*(\[[^\]]+\])',
    r'playlist["\']?\s*[=:]\s*(\[[^\]]+\])',
    r'"play_list"\s*:\s*(\[[^\]]{10,}\])',
    r'"urllist"\s*:\s*(\[[^\]]{10,}\])',
    r'"urls"\s*:\s*(\[[^\]]{10,}\])',
]

# 由于页面是压缩的，让我们搜索更宽泛的模式
# 查找包含urlid和mp4的JSON片段
matches = re.findall(r'\{[^{}]*"urlid"\s*:\s*\d+[^{}]*"movid"\s*:\s*\d+[^{}]*\}', text)
if matches:
    print(f"Found {len(matches)} play items:")
    for m in matches:
        try:
            item = json.loads(m)
            print(f"  urlid={item.get('urlid')}, title={item.get('title')}, mp4={item.get('mp4')}, down_mp4={item.get('down_mp4')}, movid={item.get('movid')}")
        except:
            print(f"  raw: {m[:200]}")

# 搜索下载URL模式 - 看看有没有直接的下载链接
url_patterns = [
    r'https?://[^"\'<>]*down[^"\'<>]*\.(mp4|m3u8)[^"\'<>]*',
    r'https?://[^"\'<>]*download[^"\'<>]*\.(mp4|m3u8)[^"\'<>]*',
    r'https?://[^"\'<>]*tv-file[^"\'<>]*\.(mp4|m3u8)[^"\'<>]*',
    r'https?://[^"\'<>]*aliyuncs[^"\'<>]*\.(mp4|m3u8)[^"\'<>]*',
]

for pat in url_patterns:
    urls = re.findall(pat, text)
    if urls:
        print(f"\nFound URLs ({pat[:50]}):")
        for u in urls[:10]:
            print(f"  {u}")

# 尝试构建下载链接
# 福音TV下载链接可能类似: https://www.fuyin.tv/download/mov_id/2942/
# 或: https://www.fuyin.tv/down/video/52942/
urlid_matches = re.findall(r'"urlid"\s*:\s*(\d+)', text)
if urlid_matches:
    urlid = urlid_matches[0]
    print(f"\nurlid = {urlid}")
    
    # 尝试各种下载URL格式
    download_urls = [
        f"https://www.fuyin.tv/down/video/{urlid}/",
        f"https://www.fuyin.tv/download/video/{urlid}/",
        f"https://www.fuyin.tv/down/mp4/{urlid}/",
        f"https://www.fuyin.tv/down/mov_id/{movid}/",
        f"https://www.fuyin.tv/download/mov_id/{movid}/",
    ]
    
    for du in download_urls:
        try:
            dr = requests.get(du, headers=headers, timeout=10, allow_redirects=True)
            print(f"\nDownload URL: {du}")
            print(f"  Status: {dr.status_code}, Final URL: {dr.url}")
            if 'mp4' in dr.text or 'm3u8' in dr.text or '.mp4' in dr.url:
                print(f"  Content (first 500): {dr.text[:500]}")
            if dr.status_code == 200:
                # 搜索重定向或视频链接
                vid_urls = re.findall(r'https?://[^"\'<>\s]+\.(?:mp4|m3u8)[^"\'<>\s]*', dr.text)
                if vid_urls:
                    print(f"  Video URLs found: {vid_urls[:5]}")
        except Exception as e:
            print(f"  Error: {e}")

# 尝试直接查找下载链接的JavaScript
print("\n\n=== Searching for download JS variables ===")
js_matches = re.findall(r'(downUrl|downloadUrl|videoUrl|playUrl|sourceUrl|mp4Url|fileUrl)\s*[=:]\s*["\']([^"\']+)["\']', text)
for name, val in js_matches[:20]:
    print(f"  {name} = {val}")

# 检查任何包含 http 的URL
all_urls = re.findall(r'https?://[^"\'<>\s\)]+', text)
print(f"\n=== All URLs found ({len(all_urls)}) ===")
for u in all_urls:
    if 'tv-file' in u or 'fuyin' in u or 'ali' in u or 'mp4' in u or 'm3u8' in u:
        print(f"  {u}")
