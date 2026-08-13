import sqlite3

conn = sqlite3.connect('/data/data/com.ai.assistance.operit/app_webview/Default/Cookies')
cursor = conn.cursor()

# 查看所有dash.cloudflare.com的cookies
cursor.execute("SELECT host_key, name, value FROM cookies WHERE host_key LIKE '%dash.cloudflare%'")
rows = cursor.fetchall()

print('=== ALL dash.cloudflare.com Cookies ===')
for row in rows:
    print('Host: ' + str(row[0]))
    print('Name: ' + str(row[1]))
    val = str(row[2])
    if len(val) > 200:
        val = val[:200] + '...'
    print('Value: ' + val)
    print('---')

# 也看看有没有__cflb, cf_clearance, CF_Authorization等
cursor.execute("SELECT host_key, name, value FROM cookies WHERE name IN ('__cflb', 'cf_clearance', 'CF_Authorization', 'cf-access-token', 'cf_user_token', 'cloudflare-access-token')")
rows2 = cursor.fetchall()
print()
print('=== Auth Related Cookies ===')
for row in rows2:
    print('Host: ' + str(row[0]))
    print('Name: ' + str(row[1]))
    print('Value: ' + str(row[2]))
    print('---')

# 查看本地存储
cursor.execute("SELECT origin, key, value FROM local_storage WHERE origin LIKE '%cloudflare%' OR origin LIKE '%dash%'")
rows3 = cursor.fetchall()
print()
print('=== Local Storage for Cloudflare ===')
for row in rows3:
    print('Origin: ' + str(row[0]))
    print('Key: ' + str(row[1]))
    val = str(row[2])
    if len(val) > 200:
        val = val[:200] + '...'
    print('Value: ' + val)
    print('---')

conn.close()