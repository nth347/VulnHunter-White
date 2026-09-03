#!/usr/bin/env node
// Guards the i18n setup:
//  1. zh.json and en.json must have exactly the same key set.
//  2. No new hardcoded CJK string literals in src/ (comments and a small
//     allowlist of files that intentionally match backend Chinese output are skipped).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')
const CJK = /[一-鿿]/

// Files allowed to contain CJK literals (matching backend-emitted strings / legacy data).
const ALLOW = new Set([
  'src/i18n/locales/zh.json',
  'src/i18n/index.ts',
  'src/lib/vulnGroups.ts',
  'src/lib/utils.ts',
  'src/pages/ProjectDetailPage.tsx',
])

function flat(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flat(v, key))
    else out.push(key)
  }
  return out
}

let failed = false

const zh = JSON.parse(readFileSync(join(SRC, 'i18n/locales/zh.json'), 'utf8'))
const en = JSON.parse(readFileSync(join(SRC, 'i18n/locales/en.json'), 'utf8'))
const zk = new Set(flat(zh))
const ek = new Set(flat(en))
const missingEn = [...zk].filter((k) => !ek.has(k))
const missingZh = [...ek].filter((k) => !zk.has(k))
if (missingEn.length || missingZh.length) {
  failed = true
  if (missingEn.length) console.error(`en.json missing ${missingEn.length} keys:`, missingEn.slice(0, 20))
  if (missingZh.length) console.error(`zh.json missing ${missingZh.length} keys:`, missingZh.slice(0, 20))
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      walk(p)
      continue
    }
    if (!/\.(tsx?|ts)$/.test(name)) continue
    const rel = relative(ROOT, p)
    if (rel.includes('/locales/') || ALLOW.has(rel)) continue
    const lines = readFileSync(p, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
      if (CJK.test(code)) {
        failed = true
        console.error(`${rel}:${i + 1}  hardcoded CJK: ${line.trim().slice(0, 100)}`)
      }
    })
  }
}
walk(SRC)

if (failed) {
  console.error('\ni18n check failed.')
  process.exit(1)
}
console.log(`i18n check ok — ${zk.size} keys, zh/en in sync, no stray CJK literals.`)
