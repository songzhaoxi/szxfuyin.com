#!/usr/bin/env python3
"""
===========================
福音传播爱 · 数据更新脚本
===========================
读取抓取结果(fetched_data.json)，更新index.html中的视频数据
"""

import json, re, os
from datetime import datetime

INDEX_FILE = "index.html"
FETCHED_FILE = "scripts/fetched_data.json"

def load_index():
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return f.read()

def save_index(content):
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ index.html 已更新")

def load_fetched():
    if not os.path.exists(FETCHED_FILE):
        print("⚠ 没有抓取数据文件，跳过更新")
        return None
    with open(FETCHED_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def build_yt_ids_js(videos_with_ytid):
    """生成YT_IDS的JavaScript代码"""
    lines = ["const YT_IDS = {"]
    for v in videos_with_ytid:
        if "ytid" in v and v["ytid"]:
            lines.append(f"  {v['movid']}:\"{v['ytid']}\",")
    lines.append("};")
    return "\n".join(lines)

def build_data_js(fetched):
    """生成DATA对象的JS，只更新视频部分，保留原有其他数据"""
    videos = fetched.get("videos", [])
    
    # 生成newVideos（最新的8个）
    new_vids = videos[:8]
    new_vids_js = "[\n" + ",\n".join(
        f'    {{title:"{v["title"]}",author:"{v["author"]}",date:"{v.get("date","")}",movid:{v["movid"]}}}'
        for v in new_vids
    ) + "\n  ]"
    
    # 生成hotVideos（热门10个）
    hot_vids = videos[:10]
    hot_vids_js = "[\n" + ",\n".join(
        f'    {{title:"{v["title"]}",author:"{v["author"]}",movid:{v["movid"]}}}'
        for v in hot_vids
    ) + "\n  ]"
    
    return new_vids_js, hot_vids_js

def update_index(content, fetched):
    """更新index.html中的数据部分"""
    videos = fetched.get("videos", [])
    yt_mapping = fetched.get("yt_mapping", {})
    
    # 1. 更新YT_IDS
    if yt_mapping:
        # 找到YT_IDS的定义区域
        pattern = r"const YT_IDS = \{.*?\};"
        replacement = "const YT_IDS = {\n"
        for movid, ytid in yt_mapping.items():
            replacement += f"  {movid}:\"{ytid}\",\n"
        # 保留原有的映射
        existing_match = re.search(r"const YT_IDS = \{(.*?)\};", content, re.DOTALL)
        if existing_match:
            existing_content = existing_match.group(1)
            # 提取现有的movid->ytid映射
            existing_pairs = re.findall(r'(\d+):"([^"]+)"', existing_content)
            for movid, ytid in existing_pairs:
                if int(movid) not in yt_mapping:
                    replacement += f"  {movid}:\"{ytid}\",\n"
        replacement += "};"
        
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        print(f"✅ YT_IDS 已更新 ({len(yt_mapping)}个新映射)")
    
    # 2. 更新newVideos
    if videos:
        new_vids = videos[:8]
        # 构建新的newVideos数组的JS代码
        new_vids_str = "[\n" + ",\n".join(
            f'    {{title:"{v["title"]}",author:"{v["author"]}",date:"{v.get("date","")}",movid:{v["movid"]}}}'
            for v in new_vids
        ) + "\n  ]"
        
        # 替换newVideos
        pattern_new = r"newVideos:\[.*?\]"
        content = re.sub(pattern_new, f"newVideos:{new_vids_str}", content, flags=re.DOTALL)
        print(f"✅ newVideos 已更新 ({len(new_vids)}个)")
    
    # 3. 更新hotVideos
    if videos:
        hot_vids = videos[:10]
        hot_vids_str = "[\n" + ",\n".join(
            f'    {{title:"{v["title"]}",author:"{v["author"]}",movid:{v["movid"]}}}'
            for v in hot_vids
        ) + "\n  ]"
        
        pattern_hot = r"hotVideos:\[.*?\]"
        content = re.sub(pattern_hot, f"hotVideos:{hot_vids_str}", content, flags=re.DOTALL)
        print(f"✅ hotVideos 已更新 ({len(hot_vids)}个)")
    
    # 4. 添加更新时间戳注释
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    ts_comment = f"\n// 自动更新于: {now}\n"
    content = re.sub(r"(const YT_IDS)", f"{ts_comment}const YT_IDS", content)
    
    return content

def main():
    print("=" * 50)
    print("📝 福音传播爱 · 数据更新脚本")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    fetched = load_fetched()
    if not fetched:
        print("✅ 无新数据，跳过更新")
        return
    
    content = load_index()
    content = update_index(content, fetched)
    save_index(content)
    
    print(f"\n🎉 数据更新完成！共 {fetched.get('total', 0)} 个视频")

if __name__ == "__main__":
    main()