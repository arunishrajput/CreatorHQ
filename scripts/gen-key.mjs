// Generates a signing key for the extension and prints:
//   - the manifest "key" (public key, base64) → put in .env.local as VITE_EXTENSION_KEY
//   - the extension ID it produces             → paste into the Google Cloud OAuth client
//
// Why: an unpacked extension's ID is derived from its folder path unless the manifest has
// a "key". The OAuth client is bound to one ID, so we pin it.
//
// The private key goes to .keys/ (gitignored). Keep it if you ever want to pack a .crx
// with the same ID; it is not needed for loading unpacked.
import { createHash, generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const OUT_DIR = new URL('../.keys/', import.meta.url)
const PRIVATE_KEY = new URL('extension.pem', OUT_DIR)

if (existsSync(PRIVATE_KEY) && !process.argv.includes('--force')) {
  console.error('.keys/extension.pem already exists. Re-run with --force to replace it (this changes the extension ID).')
  process.exit(1)
}

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const der = publicKey.export({ type: 'spki', format: 'der' })

// Chrome's extension ID: first 128 bits of SHA-256(public key DER), hex digits 0-f mapped to a-p.
const id = createHash('sha256')
  .update(der)
  .digest('hex')
  .slice(0, 32)
  .replace(/[0-9a-f]/g, (c) => String.fromCharCode('a'.charCodeAt(0) + parseInt(c, 16)))

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(PRIVATE_KEY, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })

console.log(`
Extension ID (use this for the Google Cloud OAuth client):
  ${id}

Add this line to .env.local:
  VITE_EXTENSION_KEY=${der.toString('base64')}

Private key saved to .keys/extension.pem (gitignored).
`)
