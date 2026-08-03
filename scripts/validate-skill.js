#!/usr/bin/env node

/**
 * Validates all skill directories have required SKILL.md structure.
 *
 * Checks:
 * - SKILL.md exists
 * - Frontmatter contains 'name' field
 * - Frontmatter contains 'description' field
 * - SKILL.md is not empty
 *
 * Exit code 1 if any validation fails.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const SKILLS_DIR = join(import.meta.dirname, '..', 'skills')

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n(?:---|\.\.\.)/)
  if (!match) return { attrs: {}, body: content }

  const yaml = match[1]
  const attrs = {}

  for (const line of yaml.split('\n')) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/)
    if (keyMatch) {
      const val = keyMatch[2].trim()
      attrs[keyMatch[1]] = val
    }
  }

  return { attrs }
}

let errors = 0
let checked = 0

const entries = readdirSync(SKILLS_DIR, { withFileTypes: true })
const skillDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'))

for (const entry of skillDirs) {
  const skillDir = join(SKILLS_DIR, entry.name)
  const skillMd = join(skillDir, 'SKILL.md')
  checked++

  if (!existsSync(skillMd)) {
    console.error(`❌ ${entry.name}/SKILL.md — file not found`)
    errors++
    continue
  }

  const content = readFileSync(skillMd, 'utf-8')

  if (content.trim().length === 0) {
    console.error(`❌ ${entry.name}/SKILL.md — file is empty`)
    errors++
    continue
  }

  const { attrs } = parseFrontmatter(content)
  const missing = []

  if (!attrs.name) missing.push('name')
  if (!attrs.description) missing.push('description')

  if (missing.length > 0) {
    console.error(
      `❌ ${entry.name}/SKILL.md — missing frontmatter fields: ${missing.join(', ')}`,
    )
    errors++
  } else {
    console.log(`✅ ${entry.name}`)
  }
}

console.log(`\nChecked ${checked} skills, ${errors} error(s)`)

if (errors > 0) {
  process.exit(1)
}
