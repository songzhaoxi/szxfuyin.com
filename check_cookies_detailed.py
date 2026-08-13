import sqlite3

conn = sqlite3.connect('/data/data/com.ai.assistance.operit/app_webview/Default/Cookies')
cursor = conn.cursor()

# 检查cookies表的所有列
cursor.execute("PRAGMA table_info(cookies)")
cols = cursor.fetchall()
print('=== Cookies Table Columns ===')
for c in cols:
    print(c)

# 获取所有dash.cloudflare.com的cookies，包括所有列
cursor.execute("SELECT * FROM cookies WHERE host_key LIKE '%dash.cloudflare%' OR host_key LIKE '%cloudflare.com%'")
rows = cursor.fetchall()
print()
print('=== ALL Cloudflare Cookies (all columns) ===')
for row in rows:
    for i, col in enumerate(cols):
        val = str(row[i])
        if len(val) > 150:
            val = val[:150] + '...'
        print(col[1] + ': ' + val)
    print('---')

print()
print('Total Cloudflare cookies: ' + str(len(rows)))

# 检查has_expires, is_httponly, samesite, priority, source_scheme等
conn.close()