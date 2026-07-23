#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, json, re

WORKSPACE = '/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827'

with open(os.path.join(WORKSPACE, 'V_array.json'), 'r', encoding='utf-8') as f:
    V_arr = json.load(f)

# 统计所有分类
cat_keys = sorted(set(v['c'] for v in V_arr))
print(f'所有分类c字段: {cat_keys}')
print(f'视频总数: {len(V_arr)}')

# 建立c->中文名映射
cat_name_map = {}
for v in V_arr:
    if 'cat' in v and v['cat']:
        cat_name_map[v['c']] = v['cat']
print(f'分类名映射: {cat_name_map}')

# 读取index.html
with open(os.path.join(WORKSPACE, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

# 读一下文件的行来确定精确代码
with open(os.path.join(WORKSPACE, 'index.html'), 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('\n===== line1158-1185 =====')
for i, line in enumerate(lines[1157:1185], start=1158):
    print(f'{i}:{repr(line)}')

print('\n===== line972-980 (downloadVideo) =====')
for i, line in enumerate(lines[971:981], start=972):
    print(f'{i}:{repr(line)}')
