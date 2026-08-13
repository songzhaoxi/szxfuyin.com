import requests, re, json, time, sys

# 测试几个movid
test_movids = ["2942", "2904", "3932", "2944"]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Referer": "https://www.fuyin.tv/",
}

for movid in test_movids:
    print(f"\n===== movid={movid} =====")
    
    # 尝试1: 直接访问视频页面
    urls_to_try = [
        f"https://www.fuyin.tv/content/view/movid/{movid}/index.html",
        f"https://www.fuyin.tv/api/content/{movid}",
        f"https://www.fuyin.tv/api/video/{movid}",
        f"https://www.fuyin.tv/api/movie/{movid}",
    ]
    
    for url in urls_to_try:
        try:
            r = requests.get(url, headers=headers, timeout=15)
            print(f"  URL: {url}")
            print(f"  Status: {r.status_code}")
            
            # 搜索所有可能的视频地址模式
            patterns = [
                r'https?://[^"\']*\.(mp4|m3u8)[^"\']*',
                r'source[^>]*src="([^"]+)"',
                r'videoUrl["\']?\s*[:=]\s*["\']([^"\']+)',
                r'playUrl["\']?\s*[:=]\s*["\']([^"\']+)',
                r'media_url["\']?\s*[:=]\s*["\']([^"\']+)',
                r'url["\']?\s*[:=]\s*["\']([^"\']*\.(mp4|m3u8)[^"\']*)',
                r'source["\']?\s*[:=]\s*["\']([^"\']+)',
                r'"vid"\s*:\s*"([^"]+)"',
                r'"videoId"\s*:\s*"([^"]+)"',
                r'tv-file\.sanmanuela\.com[^"\'<>\s]+',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, r.text)
                if matches:
                    print(f"  Found ({pattern[:30]}...): {matches[:5]}")
                    
            # 检查是否包含视频播放器相关关键词
            keywords = ["aliplayer", "source", "vid", "playUrl", "mp4", "m3u8", "videoUrl"]
            for kw in keywords:
                if kw in r.text:
                    idx = r.text.find(kw)
                    context = r.text[max(0,idx-50):idx+100]
                    print(f"  '{kw}' found: ...{context}...")
                    
        except Exception as e:
            print(f"  Error: {e}")
    
    time.sleep(1)
