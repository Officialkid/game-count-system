import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    r = urllib.request.urlopen('https://localhost:3002/register', context=ctx, timeout=5)
    print(f'Status: {r.status}')
    print('✅ HTTPS endpoint is responding')
except Exception as e:
    print(f'❌ Error: {e}')
