// End-to-end smoke test: loads dist/ as an unpacked extension in Chromium and drives the
// real UI — create, edit, drag, delete a planned video; persistence across reload; live
// sync between the calendar tab and the side panel; screenshots of every view.
//
// YouTube sign-in can't run here (needs your OAuth client), so published videos come from
// a seeded cache of SAMPLE data, and thumbnail requests are answered with generated images.
//
//   pnpm build && CHROMIUM_PATH=/path/to/chrome pnpm smoke
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const DIST = resolve('dist')
const SHOTS = resolve(process.env.SHOTS_DIR ?? 'docs/screenshots')
mkdirSync(SHOTS, { recursive: true })

const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'creatorhq-')), {
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`],
})

// Placeholder thumbnails: a gradient per video id, so screenshots look like a real channel.
await context.route(/i\.ytimg\.com|yt3\.ggpht\.com/, (route) => {
  const seed = [...route.request().url()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const hue = seed % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,42%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360},60%,22%)"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="160" cy="90" r="26" fill="rgba(255,255,255,.18)"/><path d="M151 76v28l24-14z" fill="rgba(255,255,255,.85)"/></svg>`
  return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg })
})

let [worker] = context.serviceWorkers()
worker ??= await context.waitForEvent('serviceworker')
const extensionId = new URL(worker.url()).host
const appUrl = `chrome-extension://${extensionId}/src/pages/app/index.html`
const panelUrl = `chrome-extension://${extensionId}/src/pages/sidepanel/index.html`
console.log('extension id', extensionId)

const errors = []
const page = await context.newPage()
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(appUrl)

const step = (name) => console.log(`✓ ${name}`)

// 1 — first run: signed out, callout visible, month view.
await page.getByText('Connect your channel').waitFor()
assert.equal(await page.getByRole('radio', { name: 'Month' }).getAttribute('aria-checked'), 'true')
step('first run shows connect callout and month view')

// 2 — create with the N shortcut.
await page.keyboard.press('n')
await page.getByLabel('Title').fill('Smoke test video')
await page.getByLabel('Stage').selectOption('scripting')
await page.getByRole('button', { name: 'Add to calendar' }).click()
await page.getByRole('button', { name: 'Smoke test video' }).waitFor()
step('create planned video')

// 3 — persists across reload.
await page.reload()
await page.getByRole('button', { name: 'Smoke test video' }).waitFor()
step('planned video persists across reload')

// 4 — edit.
await page.getByRole('button', { name: 'Smoke test video' }).click()
await page.getByLabel('Title').fill('Smoke test video (edited)')
await page.getByLabel('Stage').selectOption('editing')
await page.getByRole('button', { name: 'Save' }).click()
await page.getByRole('button', { name: 'Smoke test video (edited)' }).waitFor()
step('edit planned video')

// 5 — drag to another day; check the stored date changed.
const stored = () =>
  page.evaluate(async () => Object.values(await chrome.storage.local.get(null)).filter((v) => v?.kind === 'planned'))
const before = (await stored())[0].date
const target = new Date(before + 'T12:00:00')
target.setDate(target.getDate() + (target.getDate() > 20 ? -2 : 2))
const targetLabel = `Plan a video on ${target.toLocaleString('en-US', { month: 'long' })} ${target.getDate()}`
await page
  .getByRole('button', { name: 'Smoke test video (edited)' })
  .dragTo(page.getByRole('button', { name: targetLabel, exact: true }).locator('xpath=../..'))
await page.waitForFunction(
  async (prev) => {
    const all = Object.values(await chrome.storage.local.get(null)).filter((v) => v?.kind === 'planned')
    return all[0] && all[0].date !== prev
  },
  before,
)
const after = (await stored())[0].date
step(`drag reschedules ${before} → ${after}`)

// 6 — delete.
await page.getByRole('button', { name: 'Smoke test video (edited)' }).click()
await page.getByRole('button', { name: 'Delete' }).click()
await page.getByRole('button', { name: 'Smoke test video (edited)' }).waitFor({ state: 'detached' })
assert.equal((await stored()).length, 0)
step('delete planned video')

// 7 — seed sample data (published cache + plans) for the screenshots.
await page.evaluate(seedSampleData)
await page.reload()
await page.getByText('Sample Studio').waitFor()
await page.screenshot({ path: join(SHOTS, 'month.png') })
step('month view with published + planned (screenshot)')

await page.keyboard.press('w')
await page.getByRole('radio', { name: 'Week' }).and(page.locator('[aria-checked="true"]')).waitFor()
await page.screenshot({ path: join(SHOTS, 'week.png') })
step('week view (screenshot)')

await page.locator('main section button:has(img)').first().click()
await page.getByRole('link', { name: 'Open in Studio' }).waitFor()
await page.screenshot({ path: join(SHOTS, 'details.png') })
await page.keyboard.press('Escape')
step('published video details (screenshot)')

await page.keyboard.press('m')
await page.locator('button[title*="Planned"]').first().click()
await page.getByLabel('Notes').waitFor()
await page.screenshot({ path: join(SHOTS, 'editor.png') })
await page.keyboard.press('Escape')
step('planned video editor (screenshot)')

// 8 — side panel: renders the agenda, and a plan created there shows up in the open calendar tab.
const panel = await context.newPage()
panel.on('pageerror', (e) => errors.push(e.message))
await panel.setViewportSize({ width: 400, height: 860 })
await panel.goto(panelUrl)
await panel.getByText('Next 14 days').waitFor()
await panel.screenshot({ path: join(SHOTS, 'sidepanel.png') })
await panel.getByRole('button', { name: 'New' }).click()
await panel.getByLabel('Title').fill('Made in the side panel')
await panel.getByRole('button', { name: 'Add to calendar' }).click()
await page.getByRole('button', { name: 'Made in the side panel' }).waitFor()
step('side panel agenda; edits sync live to the calendar tab')

const overflow = await panel.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
assert.equal(overflow, false, 'side panel overflows horizontally at 400px')
step('side panel has no horizontal overflow at 400px')

assert.deepEqual(errors, [], `page errors:\n${errors.join('\n')}`)
step('no console or page errors')

await context.close()
console.log(`\nAll smoke checks passed. Screenshots in ${SHOTS}`)

/** Runs inside the extension page. SAMPLE data only — titles and IDs are invented. */
async function seedSampleData() {
  const day = (offset, hour = 15) => {
    const d = new Date()
    d.setHours(hour, 0, 0, 0)
    d.setDate(d.getDate() + offset)
    return d
  }
  const key = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const published = [
    [-16, 'I tested every budget mic under $100', 'public', 'PT14M2S'],
    [-12, 'Studio tour 2026', 'public', 'PT9M45S'],
    [-9, 'Editing workflow: from 6 hours to 90 minutes', 'public', 'PT18M31S'],
    [-6, 'Q&A — answering your lighting questions', 'unlisted', 'PT32M10S'],
    [-3, 'The camera settings I actually use', 'public', 'PT11M4S'],
    [-1, 'Behind the scenes: shooting in the rain', 'private', 'PT6M20S'],
    [0, 'Color grading for beginners', 'processing', 'PT0S'],
    [3, 'Why I switched to a smaller camera', 'scheduled', 'PT12M48S'],
    [10, 'One year of daily uploads — what changed', 'scheduled', 'PT21M5S'],
  ].map(([offset, title, status, duration], i) => ({
    kind: 'published',
    id: `sample${i}`,
    title,
    thumbnailUrl: `https://i.ytimg.com/vi/sample${i}/mqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=sample${i}`,
    studioUrl: `https://studio.youtube.com/video/sample${i}/edit`,
    date: day(offset, 14 + (i % 4)).toISOString(),
    status,
    duration,
  }))
  const now = new Date().toISOString()
  const planned = [
    [1, 'Lens buying guide', 'editing', 'B-roll still missing for the 85mm section.'],
    [5, 'Reacting to my first video', 'filming', ''],
    [7, 'Desk setup 2026', 'scripting', 'Sponsor read at 2:00. Mention the cable tray.'],
    [7, 'Shorts: 3 lighting hacks', 'ready', ''],
    [13, 'Travel vlog — Lisbon', 'idea', ''],
    [17, 'Collab with Maya', 'idea', 'Pitch two concepts by Friday.'],
  ]
  const items = {}
  planned.forEach(([offset, title, stage, notes], i) => {
    items[`planned/sample-${i}`] = {
      kind: 'planned',
      id: `sample-${i}`,
      title,
      date: key(day(offset)),
      stage,
      notes,
      createdAt: now,
      updatedAt: now,
    }
  })
  await chrome.storage.local.set({
    ...items,
    settings: { view: 'month', weekStartsOn: 1, youtubeConnected: true },
    'youtube/cache': {
      channel: {
        id: 'UCsample',
        title: 'Sample Studio',
        thumbnailUrl: 'https://yt3.ggpht.com/sample.jpg',
        uploadsPlaylistId: 'UUsample',
      },
      videos: published,
      syncedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    },
  })
}
