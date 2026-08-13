import sqlite3

conn = sqlite3.connect('/data/data/com.ai.assistance.operit/app_webview/Default/Cookies')
cursor = conn.cursor()

cursor.execute("SELECT host_key, name, value, path, expires_utc, is_secure, is_httponly FROM cookies WHERE host_key LIKE '%cloudflare%' OR host_key LIKE '%dash%'")
rows = cursor.fetchall()

print('=== Cloudflare Cookies ===')
for row in rows:
    print('Host: ' + str(row[0]))
    print('Name: ' + str(row[1]))
    val = str(row[2])
    if len(val) > 100:
        val = val[:100] + '...'
    print('Value: ' + val)
    print('Path: ' + str(row[3]))
    print('---')

conn.close()
