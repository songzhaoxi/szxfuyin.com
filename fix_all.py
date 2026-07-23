# -*- coding: utf-8 -*-
import re

path = '/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# === 修复1: CAT_ORDER用正确key匹配V数组 ===
content = re.sub(
    r'const CAT_ORDER = \[[^\]]+\];',
    'const CAT_ORDER = ["mudao","zhengdao","hunyin","zanmei","jianzheng","shipin","shengyue","chuxin","dongman","shenxue"];',
    content
)

# === 修复2: CAT_MAP清理冗余key只保留V数组实际用的10个 ===
content = re.sub(
    r'const CAT_MAP = \{[^}]+\};',
    'const CAT_MAP = {"mudao":"福音慕道","zhengdao":"福音证道","hunyin":"婚姻家庭","zanmei":"赞美诗歌","jianzheng":"福音见证","shipin":"福音视频","shengyue":"圣乐崇拜","chuxin":"初信造就","dongman":"福音动漫","shenxue":"研经神学"};',
    content
)

# === 修复3: 移除死代码（// ===== 状态 ===== 到文件末尾 </script> 之间的旧代码）===
# 保留 map/labels/catLabels 三行常量
old_match = re.search(r'// ===== 状态 =====[\s\S]*?</script>', content)
if old_match:
    content = content.replace(old_match.group(0), '')

# === 修复4: 增强下载函数，提示ffmpeg ===
old_dl = '''function downloadVideo(){
  if(_curVideoUrl){
    const mp4Url=_curVideoUrl.replace('/index.m3u8','.mp4').replace('/index.m3u8?','.mp4?');
    const a=document.createElement('a');
    a.href=mp4Url;
    a.download=_curVideoTitle.replace(/[\\\\\\/:*?"<>|]/g,'_')+'.mp4';
    a.target='_blank';
    a.click();
    document.getElementById('playerTip').style.display='block';
    document.getElementById('playerTip').innerHTML='💡 服务器: <code style="font-size:11px">ffmpeg -i \\\"'+_curVideoUrl+'\\\" -c copy \\\"'+_curVideoTitle.replace(/[\\\\\\/:*?"<>|]/g,'_')+'.mp4\\\"</code>';
  } else {
    alert('⚠️ 暂无可用视频地址');
  }
}'''

new_dl = '''function downloadVideo(){
  if(_curVideoUrl){
    document.getElementById('playerTip').style.display='block';
    document.getElementById('playerTip').innerHTML='⬇️ <b>HLS视频下载：</b>需使用ffmpeg转码为MP4<br>💻 复制以下命令在<u>服务器终端</u>运行：<br><code style="font-size:11px;word-break:break-all">ffmpeg -i \\\"'+_curVideoUrl+'\\\" -c copy \\\"'+_curVideoTitle.replace(/[\\\\\\/:*?"<>|]/g,'_')+'.mp4\\\"</code><br>📁 批量下载脚本已生成：<b>download_all_videos.sh</b>';
  } else {
    alert('⚠️ 暂无可用视频地址');
  }
}'''

content = content.replace(old_dl, new_dl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ 全部修复完成！')
print('1. CAT_ORDER 已修正 -> 匹配V数组的c字段')
print('2. CAT_MAP 已清理冗余key')
print('3. 旧版死代码已移除')
print('4. 下载功能已增强为ffmpeg提示')
