#!/usr/bin/env python3
"""合并模板文件 + 316个视频数据 + 播放器功能"""
import re

# 读取模板文件
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/szxfuyin_template.html', 'r', encoding='utf-8') as f:
    template = f.read()

# 读取index.html的JS部分（const V及之后所有函数）
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# 提取const V数组
v_match = re.search(r'const V = \[.*?\];', index_html, re.DOTALL)
if v_match:
    v_code = v_match.group()
    print(f"const V found: {len(v_code)} chars")
else:
    print("ERROR: const V not found!")
    v_code = ""

# 提取bvidMap
bvid_match = re.search(r'const bvidMap = \{.*?\};', index_html, re.DOTALL)
if bvid_match:
    bvid_code = bvid_match.group()
    print(f"bvidMap found: {len(bvid_code)} chars")
else:
    print("ERROR: bvidMap not found!")
    bvid_code = ""

# 提取SP（讲员列表）
sp_match = re.search(r'const SP = \[.*?\];', index_html, re.DOTALL)
sp_code = sp_match.group() if sp_match else "const SP = [];"

# 提取OT和NT（圣经书目）
ot_match = re.search(r'const OT = \[.*?\];', index_html, re.DOTALL)
nt_match = re.search(r'const NT = \[.*?\];', index_html, re.DOTALL)
ot_code = ot_match.group() if ot_match else ""
nt_code = nt_match.group() if nt_match else ""

# 提取map/labels/catLabels
map_match = re.search(r'const map = \[.*?\];', index_html, re.DOTALL)
labels_match = re.search(r'const labels = \[.*?\];', index_html, re.DOTALL)
catlabels_match = re.search(r'const catLabels = \{.*?\};', index_html, re.DOTALL)
map_code = map_match.group() if map_match else ""
labels_code = labels_match.group() if labels_match else ""
catlabels_code = catlabels_match.group() if catlabels_match else ""

# 提取状态变量
state_match = re.search(r"/\/ ===== 状态 =====.*?let curTab=0, curSlide=0, slideTimer, mobOpen=false, dark=false;", index_html, re.DOTALL)
if not state_match:
    state_match = re.search(r"let curTab=0, curSlide=0, slideTimer, mobOpen=false, dark=false;", index_html)
    state_match2 = re.search(r"const PAGE_SIZE=20; let curPage=0, searchResults=null;", index_html)
else:
    state_match2 = re.search(r"const PAGE_SIZE=20; let curPage=0, searchResults=null;", index_html)

state1 = state_match.group() if state_match else "let curTab=0, curSlide=0, slideTimer, mobOpen=false, dark=false;"
state2 = state_match2.group() if state_match2 else "const PAGE_SIZE=20; let curPage=0, searchResults=null;"

# 提取所有函数（从rv到doSearch等）
func_start = index_html.find("// ===== 渲染函数 =====")
func_end = index_html.find("</script>", func_start)
if func_start > 0 and func_end > 0:
    func_code = index_html[func_start:func_end]
    print(f"Functions found: {len(func_code)} chars")
else:
    print("ERROR: Functions not found!")
    func_code = ""

# 提取switchSource和pv函数（在上面的func_code之前）
src_start = index_html.find("// ===== 播放器")
if src_start > 0:
    src_end = index_html.find("// ===== 状态", src_start)
    if src_end < 0:
        src_end = index_html.find("// ===== 渲染函数", src_start)
    src_code = index_html[src_start:src_end]
    print(f"Player functions found: {len(src_code)} chars")
else:
    src_code = ""

# 在模板的script标签里，在const DATA之后、DOMContentLoaded之前插入
# 找到DOMContentLoaded初始化
init_pos = template.find("document.addEventListener('DOMContentLoaded'")
if init_pos < 0:
    init_pos = template.find("// ===== 初始化 =====")

# 找到DATA结束的位置
data_end = template.find("};", template.find("const DATA = {"))
data_end = template.find("};", data_end) + 2  # 找到第二个};

# 构建要插入的代码
insert_code = f"""

// ===== 完整视频数据（316个视频） =====
{v_code}

// ===== B站BV号映射 =====
{bvid_code}

// ===== 讲员列表 =====
{sp_code}

// ===== 圣经书目 =====
{ot_code}
{nt_code}

// ===== 类别映射 =====
{map_code}
{labels_code}
{catlabels_code}

// ===== 状态变量 =====
{state1}
{state2}

// ===== 播放器功能 =====
{src_code}

// ===== 渲染与分页 =====
{func_code}
"""

# 在const DATA之后插入V数组和播放器功能
# 找到init位置的注释
init_comment = "// ===== 初始化 ====="
init_pos = template.find(init_comment)
if init_pos > 0:
    # 在初始化之前插入
    merged = template[:init_pos] + insert_code + "\n" + template[init_pos:]
else:
    # 在</script>之前插入
    script_end = template.rfind("</script>")
    merged = template[:script_end] + insert_code + "\n" + template[script_end:]

# 需要修复id:227行缺少逗号的问题
merged = merged.replace('{id:227,t:"神学课程 #24",c:"shenxue",cat:"神学课程",movid:"3044",urlid:"57308",s:"福音TV",d:"神学课程 - 来自福音TV的属灵资源",v:"",l:""}\n  {id:228', '{id:227,t:"神学课程 #24",c:"shenxue",cat:"神学课程",movid:"3044",urlid:"57308",s:"福音TV",d:"神学课程 - 来自福音TV的属灵资源",v:"",l:""},\n  {id:228')

# 写入输出文件
output = '/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index_merged.html'
with open(output, 'w', encoding='utf-8') as f:
    f.write(merged)

print(f"\n✅ 合并完成！输出文件: {output}")
print(f"文件大小: {len(merged)} bytes")
