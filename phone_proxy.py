import http.server
import urllib.request
import sys

class Proxy(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url = self.path[1:]  # remove leading /
            if not url.startswith('http'):
                self.send_error(400, 'Missing URL')
                return
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.fuyin.tv/',
                'Origin': 'https://www.fuyin.tv',
            })
            resp = urllib.request.urlopen(req, timeout=30)
            self.send_response(resp.status)
            for k, v in resp.headers.items():
                if k.lower() not in ('transfer-encoding', 'content-encoding'):
                    self.send_header(k, v)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(resp.read())
        except Exception as e:
            self.send_error(502, str(e))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[PROXY] %s - %s\n" % (self.client_address[0], format % args))

server = http.server.HTTPServer(('127.0.0.1', 8899), Proxy)
print('Phone proxy running on http://127.0.0.1:8899/http://...')
server.serve_forever()
