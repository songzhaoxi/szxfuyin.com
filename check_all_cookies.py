import sqlite3

conn = sqlite3.connect('/data/data/com.ai.assistance.operit/app_webview/Default/Cookies')
cursor = conn.cursor()

# 获取所有cookies
cursor.execute("SELECT host_key, name, value, path, is_secure, is_httponly FROM cookies ORDER BY host_key")
rows = cursor.fetchall()

for row in rows:
    print('Host: ' + str(row[0]))
    print('Name: ' + str(row[1]))
    val = str(row[2])
    if len(val) > 120:
        val = val[:120] + '...'
    print('Value: ' + val)
    print('---')

print('Total cookies: ' + str(len(rows)))
conn.close()