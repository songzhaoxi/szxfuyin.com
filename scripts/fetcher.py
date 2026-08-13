#!/usr/bin/env python3
"""
==========================
福音传播爱 · 自动抓取爬虫
==========================
从多个公开源抓取基督教福音视频/讲道信息
运行环境：GitHub Actions (Ubuntu)
"""

import json, os, re, sys, hashlib, time
from datetime import datetime
from urllib.parse import urlparse, parse_qs

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    os.system("pip install requests beautifulsoup4 lxml feedparser")
    import requests
    from bs4 import BeautifulSoup

OUTPUT_FILE = "scripts/fetched_data.json"

# ========== 数据源配置 ==========
SOURCES = {
    "rss": [
        # 中文福音频道RSS (YouTube公开RSS, 不需要API Key)
        {"name": "唐崇荣", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC4UyM1Z1Q1Q1Q1Q1Q1Q1Q1Q"},
        {"name": "冯秉诚", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UC4UyM1Z1Q1Q1Q1Q1Q1Q1Q1Q"},
    ],
    "web": [
        # 可以从一些基督教网站抓取
    ]
}

# ========== 备选内置数据 ==========
# 当网络爬取失败时使用这些预置数据作为种子
BUILTIN_VIDEOS = [
    {"title":"观念的后果-史普罗","author":"史普罗","date":"05/14","movid":3952},
    {"title":"新约神学-孙宝玲","author":"孙宝玲","date":"04/27","movid":3951},
    {"title":"明白圣经（国语配音）-史普罗","author":"史普罗","date":"04/22","movid":3950},
    {"title":"亲密婚姻（国语配音）-史普罗","author":"史普罗","date":"04/15","movid":3949},
    {"title":"蒙上帝所爱（国语配音）-史普罗","author":"史普罗","date":"04/13","movid":3948},
    {"title":"2026复活节信息-真能天长地久的爱","author":"陈可嘉","date":"04/06","movid":3947},
    {"title":"信仰与生活-康来昌","author":"康来昌","date":"04/02","movid":3946},
    {"title":"君尊的祭司","author":"The Bible Project","date":"03/25","movid":3945},
    {"title":"约翰麦克阿瑟牧师追思礼拜","author":"约翰派博、弗格森等","date":"05/01","movid":3925},
    {"title":"信心是什么","author":"冯秉诚","date":"04/20","movid":3063},
    {"title":"认识耶稣","author":"刘志雄","date":"04/18","movid":3039},
    {"title":"喜获新生","author":"约翰派博","date":"04/15","movid":2999},
    {"title":"教会论与教会生活","author":"林慈信","date":"04/10","movid":2997},
    {"title":"新城要理问答","author":"提摩太·凯勒","date":"04/08","movid":2765},
    {"title":"约翰福音中的生命信息","author":"冬至","date":"04/05","movid":2723},
    {"title":"异端分辨-蔡丽贞博士","author":"蔡丽贞","date":"04/01","movid":2511},
    {"title":"伯克富系统神学-神论","author":"林慈信","date":"03/28","movid":2492},
    {"title":"主祷文-唐崇荣牧师","author":"唐崇荣","date":"03/25","movid":2491},
    {"title":"于宏洁2026年讲道集","author":"于宏洁","date":"05/10","movid":3936},
    {"title":"基督徒的婚姻观","author":"麦安迪","date":"04/12","movid":3050},
    {"title":"子女心 父母情","author":"泰德·特里普","date":"04/08","movid":3035},
    {"title":"合神心意的婚姻","author":"刘志雄","date":"04/05","movid":2935},
    {"title":"放晴了-诗歌舞蹈","author":"游智婷","date":"05/08","movid":3942},
    {"title":"多彩恩典天路同行","author":"西门","date":"05/01","movid":3926},
    {"title":"国度音乐会2024","author":"基督徒","date":"04/20","movid":3889},
    {"title":"如何传福音？","author":"冯秉诚","date":"04/15","movid":3836},
    {"title":"2025恩典的祝福圣诞布道会","author":"苏立忠牧师","date":"03/20","movid":3932},
    {"title":"每日灵修365","author":"苏立忠","date":"05/12","movid":3027},
    {"title":"每日心语2025","author":"吴继扬","date":"05/11","movid":3938},
    {"title":"圣经难题解答","author":"冯秉诚","date":"04/22","movid":3931},
    {"title":"刘志雄长老2026讲道集","author":"刘志雄","date":"05/09","movid":3933},
    {"title":"复活节信息-真能天长地久","author":"陈可嘉","date":"04/06","movid":3947},
]

# ========== 知名基督教YouTube频道 (用于RSS抓取) ==========
# 注意：这些频道ID是示例/公共频道，实际部署时可替换为真实频道
CHRISTIAN_CHANNELS = [
    # 中文基督教频道
    {"name":"唐崇荣","url":"https://www.youtube.com/feeds/videos.xml?channel_id=UC1Yq9PkX2v8AQwWf8bQQqTA"},
    {"name":"冯秉诚","url":"https://www.youtube.com/feeds/videos.xml?channel_id=UCVwY9fQw1cTjH7y8Q0U0xPA"},
    {"name":"刘志雄","url":"https://www.youtube.com/feeds/videos.xml?channel_id=UCLv9z0q0w0c0g0k0s0l0z0A"},
    {"name":"The Bible Project","url":"https://www.youtube.com/feeds/videos.xml?channel_id=UCVH9Y0z0w0c0g0k0s0l0z0A"},
]

def fetch_rss(url, timeout=15):
    """尝试抓取RSS feed"""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        r = requests.get(url, headers=headers, timeout=timeout)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        print(f"  ⚠ RSS抓取失败: {e}")
    return None

def parse_rss_videos(xml_text, source_name):
    """从RSS XML中解析视频"""
    videos = []
    try:
        soup = BeautifulSoup(xml_text, "xml")
        entries = soup.find_all("entry")
        for entry in entries[:20]:
            title_el = entry.find("title")
            if not title_el: continue
            title = title_el.text.strip()
            # 提取视频ID
            video_id_el = entry.find("yt:videoId")
            if not video_id_el:
                # 从链接提取
                link_el = entry.find("link")
                if link_el and link_el.get("href"):
                    parsed = urlparse(link_el["href"])
                    qs = parse_qs(parsed.query)
                    video_id = qs.get("v", [""])[0]
                else:
                    continue
            else:
                video_id = video_id_el.text
            
            # 生成movid (基于video_id的hash)
            movid = abs(hash(video_id)) % 10000
            
            # 获取发布日期
            published_el = entry.find("published")
            date_str = ""
            if published_el:
                try:
                    dt = datetime.fromisoformat(published_el.text.replace("Z", "+00:00"))
                    date_str = dt.strftime("%m/%d")
                except:
                    pass
            
            videos.append({
                "title": title[:60],
                "author": source_name,
                "date": date_str or datetime.now().strftime("%m/%d"),
                "movid": movid,
                "ytid": video_id
            })
            print(f"  ✓ {title[:40]}...")
    except Exception as e:
        print(f"  ⚠ RSS解析失败: {e}")
    return videos

def fetch_web_articles():
    """从基督教网站抓取文章/视频信息"""
    articles = []
    # 尝试从几个公开网站抓取
    urls = [
        # 这些是示例URL, 实际部署时可替换为真实目标
    ]
    for url in urls:
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "lxml")
                # 解析逻辑根据实际网站结构调整
                print(f"  ✓ 访问成功: {url}")
        except Exception as e:
            print(f"  ⚠ 抓取失败 {url}: {e}")
    return articles

def merge_videos(existing, new_videos):
    """合并新旧视频列表，去重，按日期排序"""
    seen_movids = set()
    all_videos = []
    
    for v in existing:
        if v["movid"] not in seen_movids:
            seen_movids.add(v["movid"])
            all_videos.append(v)
    
    for v in new_videos:
        if v["movid"] not in seen_movids:
            seen_movids.add(v["movid"])
            all_videos.append(v)
    
    # 按日期排序（有日期的在前）
    def sort_key(v):
        d = v.get("date", "")
        if d and "/" in d:
            parts = d.split("/")
            try:
                return (int(parts[0]) * 100 + int(parts[1]))
            except:
                return 0
        return 0
    
    all_videos.sort(key=sort_key, reverse=True)
    return all_videos

def main():
    print("=" * 50)
    print("🕷️ 福音传播爱 · 自动更新爬虫")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    all_videos = []
    vid_map = {}  # ytid -> movid for updating YT_IDS
    
    # 1. 从RSS源抓取
    print("\n📡 正在抓取YouTube RSS...")
    for channel in CHRISTIAN_CHANNELS:
        print(f"  → {channel['name']}")
        xml = fetch_rss(channel["url"])
        if xml:
            vids = parse_rss_videos(xml, channel["name"])
            for v in vids:
                if v["ytid"]:
                    vid_map[v["movid"]] = v["ytid"]
                all_videos.append({k:v[k] for k in ["title","author","date","movid"]})
            time.sleep(1)  # 礼貌性延迟
        else:
            print(f"  ⚠ 无法访问 {channel['name']} 的RSS")
    
    # 2. 合并内置数据
    print(f"\n📦 合并内置视频数据 ({len(BUILTIN_VIDEOS)}个)")
    all_videos = merge_videos(all_videos, BUILTIN_VIDEOS)
    
    # 3. 整理输出
    result = {
        "fetched_at": datetime.now().isoformat(),
        "total": len(all_videos),
        "videos": all_videos[:50],  # 最多50个最新
        "yt_mapping": vid_map
    }
    
    # 4. 保存
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 抓取完成！共 {len(all_videos)} 个视频")
    print(f"✅ YouTube映射 {len(vid_map)} 个")
    print(f"✅ 已保存到 {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
