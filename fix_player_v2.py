#!/usr/bin/env python3
"""
修复方案v2：
1. 保留原有的V数组（id1-227的福音TV视频）
2. 追加data.json中的89个带bvid的视频（id从228开始）
3. 更新bvidMap
4. 修改无B站视频分支的提示
"""
import json
import re

# 读取data.json
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 读取当前index.html（已经跑过一次，需要先恢复原始V数组）
# 实际是从当前文件中读取，但V数组已被破坏
# 我们需要一个备份！从fuyin_tv_source.html或其他源恢复

# 先看看当前文件状态
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 检查V数组当前内容
v_start = html.find('const V = [')
v_end = html.find('// ===== B站', v_start)
if v_end == -1:
    v_end = html.find('const bvidMap', v_start)

print(f"V数组起始位置: {v_start}")
print(f"V数组结束位置: {v_end}")
v_content = html[v_start:v_end] if v_end > 0 else html[v_start:v_start+200]
print(f"V数组开头: {v_content[:200]}")

# 从备份文件恢复 - 检查是否有fuyin_tv_source.html（这是从福音TV抓取的完整页面）
# 或者从_old_script.txt恢复

# 其实最简单的办法：从git恢复
# 看看有没有git

# 方案：用git checkout恢复原始版本
