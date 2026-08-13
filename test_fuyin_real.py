import urllib.request, urllib.parse, json, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def enc(url):
    return urllib.parse.quote(url, safe=':/?&=%')

def get(url, headers=None):
    req = urllib.request.Request(enc(url), headers=headers or {})
    try:
        r = urllib.request.urlopen(req, timeout=25, context=ctx)
        return r.status, r.headers.get('Content-Type'), r.read()
    except Exception as e:
        return 'ERR', str(e)[:200], b''

# 1. 获取最新movid
_, _, body = get('https://data-api.sanmanuela.net/api/movie/tops?did=0')
d = json.loads(body)
movid = d['new_list'][0]['movid']
print('最新视频 movid =', movid, d['new_list'][0]['title'])

# 2. 获取播放地址
_, _, body = get('https://data-api.sanmanuela.net/api/url/index?movid=%d' % movid)
urls = json.loads(body)
u = urls[0]
print('第1集:', u['title'])
print('url_2(MP4直链):', u['url_2'][:130])
print('url_1(HLS):', u['url_1'][:130])

# 3. 立即测试MP4直链（无Referer, Range前2KB）
s, ct, b = get(u['url_2'], {'Range': 'bytes=0-2047'})
print('\n[MP4直链 无Referer] status=%s content-type=%s' % (s, ct))
print('body前80:', b[:80])

# 4. 立即测试MP4直链（带Referer 4.fuyin.tv, Range前2KB）
s, ct, b = get(u['url_2'], {'Referer': 'https://4.fuyin.tv', 'Range': 'bytes=0-2047'})
print('\n[MP4直链 带Referer] status=%s content-type=%s' % (s, ct))
print('body前80:', b[:80])

# 5. 立即测试HLS流（带Referer）
s, ct, b = get(u['url_1'], {'Referer': 'https://4.fuyin.tv'})
print('\n[HLS流 带Referer] status=%s content-type=%s' % (s, ct))
print('body前200:', b[:200])
