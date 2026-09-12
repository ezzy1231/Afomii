/* eslint-disable */
/**
 * Lighthouse runner via Node API (the CLI's temp-dir cleanup crashes on
 * Windows paths — the API path avoids it entirely).
 * Usage: node scripts/lighthouse-run.mjs <url> <outputFile>
 */
import { default as lighthouse } from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [url, outputFile] = process.argv.slice(2)
if (!url || !outputFile) {
  console.error('Usage: node scripts/lighthouse-run.mjs <url> <outputFile>')
  process.exit(1)
}

async function run() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--window-size=1350,940'] })
  try {
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    }
    const runnerResult = await lighthouse(url, options)

    mkdirSync(dirname(outputFile), { recursive: true })
    writeFileSync(outputFile, runnerResult.report)

    const report = JSON.parse(runnerResult.report)
    const scores = {}
    for (const [key, cat] of Object.entries(report.categories)) {
      scores[key] = cat.score
    }
    console.log(JSON.stringify(scores, null, 2))
  } finally {
    await chrome.kill()
  }
}

run().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
