#!/usr/bin/env python3
"""注入V_array.json的视频地址到index.html，并修改openPlayer直接从v字段播放"""

import json

# 1. 读取V_array.json
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/V_array.json', 'r', encoding='utf-8') as f:
    v_array = json.load(f)

# 过滤出有效视频（有movid+urlid+v地址）
valid_videos = [v for v in v_array if v.get('movid') and v.get('urlid') and v.get('v', '').startswith('http')]
print(f"有效视频数（有movid+urlid+v地址）：{len(valid_videos)}")

# 2. 读取index.html
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 3. 生成新的V数组JS代码
v_lines = ['const V = [']
for v in valid_videos:
    # 转义特殊字符
    t = v.get('t', '').replace("'", "\\'")
    c = v.get('c', '').replace("'", "\\'")
    cat = v.get('cat', '').replace("'", "\\'")
    s = v.get('s', '').replace("'", "\\'")
    d = v.get('d', '').replace("'", "\\'")
    l = v.get('l', '').replace("'", "\\'")
    
    line = f"  {{id:{v['id']},t:'{t}',c:'{c}',cat:'{cat}',movid:'{v['movid']}',urlid:'{v['urlid']}',s:'{s}',d:'{d}',v:'{v['v']}',l:'{l}'}},"
    v_lines.append(line)
v_lines.append('];')

new_v_array_code = '\n'.join(v_lines)

# 4. 替换index.html中的V数组（从"const V = ["到"];"）
import re
# 找到const V = [ 到 ]; 的匹配
old_v_pattern = r"const V = \[.*?\];"
# 使用re.DOTALL让.匹配换行
html_new = re.sub(old_v_pattern, new_v_array_code, html, flags=re.DOTALL)

if html_new == html:
    print("❌ 替换失败！没找到V数组模式")
else:
    print("✅ V数组替换成功！")

# 5. 修改openPlayer函数，直接从v字段取地址
old_openplayer = """  if(v && v.movid && v.urlid){
    // 通过本地代理API获取视频直链（绕过GFW+防盗链）
    const apiUrl='/api/fuyin/url?movid='+v.movid+'&urlid='+v.urlid;
    
    fetch(apiUrl)
      .then(r=>r.json())
      .then(data=>{
        if(data.success && data.data && data.data.url){
          const videoUrl=data.data.url;
          // 销毁旧HLS实例
          if(window._hls){window._hls.destroy();window._hls=null;}
          
          // 检查浏览器原生HLS支持 (Safari)
          if(videoEl.canPlayType('application/vnd.apple.mpegurl')){
            videoEl.src=videoUrl;
          } else if (Hls.isSupported()) {
            // 使用HLS.js
            const hls=new Hls({xhrSetup:function(x,u){x.withCredentials=false;}});
            hls.loadSource(videoUrl);
            hls.attachMedia(videoEl);
            window._hls=hls;
            hls.on(Hls.Events.MANIFEST_PARSED,function(){videoEl.play();});
          } else {
            if(pl){pl.textContent='❌ 您的浏览器不支持HLS视频播放';return;}
          }
          
          if(pl)pl.style.display='none';
          if(videoEl){videoEl.style.display='block';videoEl.play();}
        } else {
          if(pl){pl.textContent='⚠️ 获取视频地址失败，请稍后再试';}
        }
      })
      .catch(err=>{
        console.error('视频加载失败:',err);
        if(pl){pl.textContent='❌ 无法连接到视频服务，请检查网络设置';}
      });
  } else {"""

new_openplayer = """  if(v && v.v){
    // 直接从V数组获取视频地址（直链HLS流）
    const videoUrl=v.v;
    
    // 销毁旧HLS实例
    if(window._hls){window._hls.destroy();window._hls=null;}
    
    // 检查浏览器原生HLS支持 (Safari)
    if(videoEl.canPlayType('application/vnd.apple.mpegurl')){
      videoEl.src=videoUrl;
    } else if (Hls.isSupported()) {
      // 使用HLS.js
      const hls=new Hls({xhrSetup:function(x,u){x.withCredentials=false;}});
      hls.loadSource(videoUrl);
      hls.attachMedia(videoEl);
      window._hls=hls;
      hls.on(Hls.Events.MANIFEST_PARSED,function(){videoEl.play();});
    } else {
      if(pl){pl.textContent='❌ 您的浏览器不支持HLS视频播放';return;}
    }
    
    if(pl)pl.style.display='none';
    if(videoEl){videoEl.style.display='block';videoEl.play();}
  } else {"""

if old_openplayer in html_new:
    html_new = html_new.replace(old_openplayer, new_openplayer)
    print("✅ openPlayer函数修改成功！")
else:
    print("⚠️ openPlayer替换失败，手动检查...")
    # 尝试部分匹配
    if "通过本地代理API获取视频直链" in html_new:
        print("  找到了关键词，但完整匹配失败")
    if "v.movid && v.urlid" in html_new:
        print("  找到了 movid && urlid 条件")

# 6. 写回index.html
with open('/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827/index.html', 'w', encoding='utf-8') as f:
    f.write(html_new)

print("🎉 完成！index.html已更新")
print(f"📊 共注入 {len(valid_videos)} 个视频的HLS地址")
