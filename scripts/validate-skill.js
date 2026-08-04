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
  let currentKey = null

  for (const line of yaml.split('\n')) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/)

    if (keyMatch) {
      // New key found
      currentKey = keyMatch[1]
      const val = keyMatch[2].trim()
      attrs[currentKey] = val
    } else if (currentKey && line.startsWith('  ')) {
      // Continuation line (indented) — append to current value
      const trimmed = line.trim()
      if (trimmed && attrs[currentKey]) {
        attrs[currentKey] += ' ' + trimmed
      } else if (trimmed) {
        attrs[currentKey] = trimmed
      }
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
    console.error(`:x: ${entry.name}/SKILL.md — file not found`)
    errors++
    continue
  }

  const content = readFileSync(skillMd, 'utf-8')

  if (content.trim().length === 0) {
    console.error(`:x: ${entry.name}/SKILL.md — file is empty`)
    errors++
    continue
  }

  const { attrs } = parseFrontmatter(content)
  const missing = []

  if (!attrs.name) missing.push('name')
  if (!attrs.description) missing.push('description')

  if (missing.length > 0) {
    console.error(
        `:x: ${entry.name}/SKILL.md — mising frontmatter fields: ${missing.join(', ')}`,
    )
    errors++
  } else {
    console.log(`:white_check_mark: ${entry.name}`)
  }
}

console.log(`\nChecked ${checked} skills, ${errors} error(s)`)

if (errors > 0) {
  process.exit(1)
}