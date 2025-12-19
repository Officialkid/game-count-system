#!/usr/bin/env node
const { spawn } = require('child_process');

(async () => {
  console.log('🔐 Starting HTTPS dev (proxy https://localhost:3002 → next dev on 3001)');
  let cert, key;
  try {
    const devcert = require('devcert');
    const { key: k, cert: c } = await devcert.certificateFor('localhost');
    key = k; cert = c;
    console.log('✓ Generated/loaded localhost certificate');
  } catch (e) {
    console.warn('⚠️ devcert not available or failed to generate certificate:', e.message);
    console.warn('Attempting to use existing files in .cert/localhost.pem and .cert/localhost-key.pem');
    const fs = require('fs');
    if (!fs.existsSync('.cert/localhost.pem') || !fs.existsSync('.cert/localhost-key.pem')) {
      console.error('❌ No certificate files found. Install OpenSSL or mkcert, or run dev server without HTTPS.');
      process.exit(1);
    }
  }

  const nextDev = spawn('npx', ['next', 'dev', '-p', '3001'], { stdio: 'inherit', shell: true });

  // If devcert returned buffers, write temp files for local-ssl-proxy
  const fs = require('fs');
  let certPath = '.cert/localhost.pem';
  let keyPath = '.cert/localhost-key.pem';
  try {
    if (cert && key) {
      if (!fs.existsSync('.cert')) fs.mkdirSync('.cert');
      fs.writeFileSync(certPath, cert);
      fs.writeFileSync(keyPath, key);
    }
  } catch (e) {
    console.warn('⚠️ Failed to write cert files:', e.message);
  }

  const sslProxy = spawn(
    'npx',
    ['local-ssl-proxy', '--source', '3002', '--target', '3001', '--cert', certPath, '--key', keyPath],
    { stdio: 'inherit', shell: true }
  );

  nextDev.on('exit', (code) => {
    console.log(`next dev exited with code ${code}`);
    sslProxy.kill('SIGINT');
    process.exit(code || 0);
  });
})();
