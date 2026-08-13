import requests, re, json, time

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.fuyin.tv/",
}

# 测试下载链接 - 尝试各种格式
movid = "2942"
urlid = "52942"  # 从上次输出中知道的

# 尝试直接下载
test_urls = [
    f"https://www.fuyin.tv/mp4/{urlid}/",
    f"https://www.fuyin.tv/video/{urlid}/",
    f"https://www.fuyin.tv/player/mov_id/{movid}/",
    f"https://www.fuyin.tv/player/?mov_id={movid}",
    
    # 尝试直接访问tv-file域名
    f"https://tv-file.sanmanuela.com/video/{movid}.mp4",
    f"https://tv-file.sanmanuela.com/video/{urlid}.mp4",
    f"https://tv-file.sanmanuela.com/uploads/video/{movid}.mp4",
    f"https://tv-file.sanmanuela.com/mp4/{movid}.mp4",
    f"https://tv-file.sanmanuela.com/{movid}.mp4",
]

# 直接请求并检查是否有Content-Type: video/ 或重定向到视频
for url in test_urls:
    try:
        r = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        ct = r.headers.get('Content-Type', '')
        print(f"URL: {url}")
        print(f"  Status: {r.status_code}, Content-Type: {ct}")
        if 'video' in ct or 'octet-stream' in ct:
            print(f"  ✅ VIDEO FOUND! Size: {len(r.content)} bytes")
            print(f"  Final URL: {r.url}")
        # 检查是否重定向到视频
        if r.status_code in [301, 302, 303, 307, 308]:
            print(f"  Redirect to: {r.headers.get('Location', 'N/A')}")
        print()
    except Exception as e:
        print(f"URL: {url}")
        print(f"  Error: {e}\n")
    time.sleep(0.5)

# 尝试通过福音TV的下载页面
print("\n=== 尝试下载页面 ===")
dl_pages = [
    f"https://www.fuyin.tv/down/mp4/{urlid}",
    f"https://www.fuyin.tv/down/video/{urlid}",
    f"https://www.fuyin.tv/download/{movid}",
]
for url in dl_pages:
    try:
        r = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        print(f"URL: {url}")
        print(f"  Status: {r.status_code}, Final: {r.url}")
        # 搜索页面中的视频链接
        vid_urls = re.findall(r'(https?://[^"\'<>\s]+\.(?:mp4|m3u8)[^"\'<>\s]*)', r.text)
        if vid_urls:
            print(f"  Video URLs: {vid_urls[:5]}")
        # 搜索任何包含 mp4 的URL模式
        all_urls = re.findall(r'https?://[^"\'<>\s\)]+', r.text)
        for u in all_urls:
            if any(x in u.lower() for x in ['mp4', 'm3u8', 'tv-file', 'aliyuncs', 'video']):
                print(f"  Relevant URL: {u}")
        print()
    except Exception as e:
        print(f"Error: {e}\n")
    time.sleep(0.5)