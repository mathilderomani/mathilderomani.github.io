# Petit serveur local pour prévisualiser le site, sans cache navigateur
import http.server

class SansCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("", 4173), SansCache).serve_forever()
