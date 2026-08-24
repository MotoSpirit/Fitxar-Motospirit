import http.server
import socketserver

PORT = 5500

EXTRA_TYPES = {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        for ext, mime in EXTRA_TYPES.items():
            if path.endswith(ext):
                return mime
        return super().guess_type(path)


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


with Server(("", PORT), Handler) as httpd:
    print(f"Serving on http://localhost:{PORT}")
    httpd.serve_forever()
