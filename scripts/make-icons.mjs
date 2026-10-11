// Renders src/assets/icons/icon.svg to the PNG sizes Chrome wants, using headless Chromium.
// Run: node scripts/make-icons.mjs  (needs CHROMIUM_PATH or Playwright's bundled browser)
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const SIZES = [16, 32, 48, 128]
const svg = await readFile(new URL('../src/assets/icons/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH })
const page = await browser.newPage()

for (const size of SIZES) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  )
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
  await writeFile(new URL(`../src/assets/icons/icon-${size}.png`, import.meta.url), png)
  console.log(`icon-${size}.png`)
}
await browser.close()
