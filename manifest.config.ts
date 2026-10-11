import { defineManifest } from '@crxjs/vite-plugin'
import { loadEnv } from 'vite'
import pkg from './package.json' with { type: 'json' }

const YOUTUBE_READONLY = 'https://www.googleapis.com/auth/youtube.readonly'

export default defineManifest(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const clientId = env.VITE_GOOGLE_CLIENT_ID
  const key = env.VITE_EXTENSION_KEY

  if (!clientId) {
    console.warn(
      '\n[creatorhq] VITE_GOOGLE_CLIENT_ID is not set. The extension will build and planning works,\n' +
        '            but "Connect YouTube" will fail until you add it to .env.local (see README).\n',
    )
  }

  return {
    manifest_version: 3,
    name: 'CreatorHQ — Content Calendar',
    short_name: 'CreatorHQ',
    version: pkg.version,
    description: pkg.description,
    ...(key ? { key } : {}),
    icons: {
      16: 'src/assets/icons/icon-16.png',
      32: 'src/assets/icons/icon-32.png',
      48: 'src/assets/icons/icon-48.png',
      128: 'src/assets/icons/icon-128.png',
    },
    // No default_popup: clicking the icon opens the full calendar tab (see background).
    action: {
      default_title: 'Open CreatorHQ',
      default_icon: { 16: 'src/assets/icons/icon-16.png', 32: 'src/assets/icons/icon-32.png' },
    },
    background: { service_worker: 'src/background/index.ts', type: 'module' },
    side_panel: { default_path: 'src/pages/sidepanel/index.html' },
    permissions: ['identity', 'storage', 'sidePanel', 'contextMenus'],
    host_permissions: ['https://www.googleapis.com/*'],
    oauth2: {
      client_id: clientId || 'MISSING_CLIENT_ID.apps.googleusercontent.com',
      scopes: [YOUTUBE_READONLY],
    },
  }
})
