#!/usr/bin/env python3
"""Local editor daemon for the Flash Index page.

Serves the site root on localhost:8934 and accepts parameter saves from
flash.html. The public page (GitHub Pages) has no daemon, so saving —
and with it name/category editing — exists only on Jackson's machine.

  GET  /api/ping   -> {"ok": true, "editor": true}
  POST /api/save   -> body {"changes": {"014": {"cur": {...}, "n": "...",
                      "cat": "..."}, ...}} ; merges into flash-db.json
                      (timestamped backup kept, atomic rename write)
"""
import json, os, shutil, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'flash', 'flash-db.json')
BAK = os.path.join(ROOT, 'flash', 'backups')
PORT = 8935


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def end_headers(self):
        p = self.path.split('?')[0]
        if p.endswith(('.html', '.json')) or p.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split('?')[0] == '/api/ping':
            return self._json(200, {'ok': True, 'editor': True})
        return super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/api/save':
            return self._json(404, {'ok': False, 'error': 'unknown endpoint'})
        try:
            n = int(self.headers.get('Content-Length', 0))
            changes = json.loads(self.rfile.read(n)).get('changes', {})
            with open(DB) as f:
                db = json.load(f)
            cats = set(db['cats'])
            byid = {e['id']: e for e in db['entries']}
            saved = 0
            for eid, ch in changes.items():
                e = byid.get(eid)
                if not e:
                    continue
                if isinstance(ch.get('cur'), dict):
                    cur = dict(e['cur'])
                    cur.update(ch['cur'])
                    e['cur'] = cur
                if isinstance(ch.get('n'), str) and ch['n'].strip():
                    e['n'] = ch['n'].strip()[:60]
                if ch.get('cat') in cats:
                    e['cat'] = ch['cat']
                saved += 1
            db['updated'] = time.strftime('%Y-%m-%dT%H:%M:%S')
            os.makedirs(BAK, exist_ok=True)
            shutil.copy2(DB, os.path.join(
                BAK, time.strftime('flash-db.%Y%m%d-%H%M%S.json')))
            baks = sorted(os.listdir(BAK))
            for old in baks[:-10]:
                os.remove(os.path.join(BAK, old))
            tmp = DB + '.tmp'
            with open(tmp, 'w') as f:
                json.dump(db, f, separators=(',', ':'))
            os.replace(tmp, DB)
            self._json(200, {'ok': True, 'saved': saved,
                             'updated': db['updated']})
        except Exception as ex:
            self._json(500, {'ok': False, 'error': str(ex)})


if __name__ == '__main__':
    print(f'flash editor daemon — http://localhost:{PORT}/flash.html')
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
