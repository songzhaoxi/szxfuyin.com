#!/usr/bin/env python3
import re, sys

with open('/tmp/a01.html', 'r', errors='ignore') as f:
    content = f.read()

print(f"File size: {len(content)} bytes")
print()

# Search for various video-related patterns
patterns = [
    (r'wxv_\w+', 'WeChat Video ID'),
    (r'vid["\']?\s*[:=]\s*["\'](\w+)["\']', 'Video ID'),
    (r'data-src=["\']([^"\']+)["\']', 'data-src'),
    (r'src=["\']([^"\']+)["\']', 'src attribute'),
    (r'(https?://[^"\'<> ]+\.(mp4|m3u8))', 'Direct video URL'),
    (r'findervv|finderurl', 'Finder URL'),
    (r'__biz=([^&]+)', 'biz'),
    (r'mp.weixin.qq.com/mp/readtemplate', 'Read Template'),
]

for pattern, label in patterns:
    matches = re.findall(pattern, content, re.IGNORECASE)
    if matches:
        print(f"=== {label} ({len(matches)} matches) ===")
        for m in matches[:10]:
            val = m[0] if isinstance(m, tuple) else m
            print(f"  {val[:200]}")
        print()

# Search for ainfos with video references
ainfos_section = re.search(r'ainfos\s*:', content)
if ainfos_section:
    print("=== Found ainfos section at position", ainfos_section.start(), "===")

# Search for "mpvedio" references
if 'mpvedio' in content:
    print("=== Found mpvedio references ===")
    for m in re.finditer(r'.{0,100}mpvedio.{0,100}', content):
        print(f"  {m.group()[:200]}")
        print()

print("=== Looking for any URL patterns ===")
# Find all URLs
urls = re.findall(r'https?://[^\s"\'<>]+', content)
video_urls = [u for u in urls if any(x in u.lower() for x in ['video', 'mp4', 'm3u8', 'wxv', 'finder', 'vod'])]
for u in video_urls[:20]:
    print(f"  {u[:200]}")

print()
print("DONE")
