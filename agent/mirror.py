import re, os, subprocess, sys
raw = 'site_raw'
txt = ''.join(open(os.path.join(raw, f), errors='ignore').read() for f in os.listdir(raw) if f.endswith(('.js', '.css', '.html')))
paths = set()
paths |= {'/' + m for m in re.findall(r'assets/[A-Za-z0-9_.-]+\.(?:js|css|mp3|mp4|webp|png|jpg|glb|woff2?|ttf|svg|json|wasm|bin|ktx2|hdr)', txt)}
for m in re.findall(r'\$\{xc\}([A-Za-z0-9_-]+)\.glb', txt): paths.add(f'/models/{m}.glb')
for m in re.findall(r'faces/([A-Za-z0-9_-]+)\.webp', txt): paths.add(f'/faces/{m}.webp')
for m in re.findall(r'(?:href|src|content)="(/[^"#?]+\.(?:png|svg|ico|webp|jpg|webmanifest|json|mp4))"', txt): paths.add(m)
for m in re.findall(r'url\((/[^)]+)\)', txt): paths.add(m.split('?')[0].strip('"\''))
paths.add('/index.html')
ok = bad = 0
for p in sorted(paths):
    dst = 'mirror' + p
    if os.path.exists(dst) and os.path.getsize(dst) > 0: ok += 1; continue
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    code = subprocess.run(['curl', '-s', '-m', '60', '-A', 'Mozilla/5.0', '-o', dst, '-w', '%{http_code}', 'https://fightkaro.com' + p], capture_output=True, text=True).stdout
    if code != '200': bad += 1; print('MISS', code, p); os.path.exists(dst) and os.remove(dst)
    else: ok += 1
print('ok', ok, 'bad', bad, 'of', len(paths))
