#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""福音TV官方API全面验证：10大分类 + 播放地址 + MP4直链"""
import urllib.request, urllib.parse, json, ssl, sys
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API = 'https://data-api.sanmanuela.net'

def enc(url):
    return urllib.parse.quote(url, safe=':/?&=%')

def get(url, headers=None, timeout=25):
    req = urllib.request.Request(enc(url), headers=headers or {})
    try:
        r = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return r.status, r.read()
    except Exception as e:
        return 'ERR', str(e)[:300].encode()

CATS = [
    (133, '福音慕道'), (22, '福音证道'), (34, '婚姻家庭'), (24, '赞美诗歌'),
    (42, '福音见证'), (21, '福音视频'), (26, '圣乐崇拜'), (25, '初信造就'),
    (23, '福音动漫'), (290, '神学课程'),
]

print('='*70)
print('【1】核心API：tops?did=0 最新推荐')
print('='*70)
s, b = get(API + '/api/movie/tops?did=0')
print('status:', s)
if s == 200:
    d = json.loads(b)
    nl = d.get('new_list', [])
    print('new_list 数量:', len(nl))
    if nl:
        v = nl[0]
        print('首个视频:', v.get('movid'), v.get('title'), '| pic:', str(v.get('pic'))[:80])
        print('urlcount_1:', v.get('urlcount_1'), '| actor:', v.get('actor'))
    # 分类入口
    for key in ('cat_list', 'category', 'cats'):
        if key in d:
            print('分类字段 %s:' % key, json.dumps(d[key], ensure_ascii=False)[:500])

print()
print('='*70)
print('【2】10大分类 lists 接口逐一验证')
print('='*70)
first_movid = None
for cid, name in CATS:
    s, b = get(API + '/api/movie/lists?catid=%d&page=1&pagesize=3' % cid)
    cnt = 0
    if s == 200:
        try:
            d = json.loads(b)
            cnt = len(d.get('data') or [])
            total = d.get('total', '?')
        except Exception:
            total = '?'
    else:
        total = 'ERR'
    print('catid=%-4s %-6s status=%s 本页=%s 总数=%s' % (cid, name, s, cnt, total))
    if s == 200 and cnt and not first_movid:
        d = json.loads(b)
        first_movid = d['data'][0].get('movid')
        print('   → 首个视频 movid=%s title=%s' % (first_movid, d['data'][0].get('title', '')[:40]))

print()
print('='*70)
print('【3】播放地址 url/index?movid= 验证')
print('='*70)
if first_movid:
    s, b = get(API + '/api/url/index?movid=%d' % first_movid)
    print('status:', s)
    if s == 200:
        urls = json.loads(b)
        print('集数:', len(urls))
        for u in urls[:3]:
            print(' -', u.get('title'), '| url_2:', str(u.get('url_2'))[:110])
        # MP4直链 Range 测试
        if urls:
            mp4 = urls[0].get('url_2', '')
            if mp4:
                print()
                print('【4】MP4直链 Range 测试（无Referer）')
                s2, b2 = get(mp4, {'Range': 'bytes=0-2047'}, timeout=20)
                print('status:', s2, '| 前16字节:', b2[:16])
                print('【5】MP4直链 Range 测试（带Referer 4.fuyin.tv）')
                s3, b3 = get(mp4, {'Referer': 'https://4.fuyin.tv', 'Range': 'bytes=0-2047'}, timeout=20)
                print('status:', s3, '| 前16字节:', b3[:16])
else:
    print('未取得movid，跳过播放测试')

print()
print('='*70)
print('【6】搜索接口验证')
print('='*70)
s, b = get(API + '/api/search/all?kw=' + urllib.parse.quote('耶稣'))
print('status:', s)
if s == 200:
    try:
        d = json.loads(b)
        results = d.get('results', [])
        for g in results[:3]:
            print(' - indexUid:', g.get('indexUid'), '| hits:', len(g.get('hits') or []))
            if g.get('indexUid') == 'movie' and g.get('hits'):
                print('   首个: ', g['hits'][0].get('title', '')[:40])
    except Exception as e:
        print('解析失败:', e)
print()
print('✅ 全部验证完成')
