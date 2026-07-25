# rolecraft-sh/skills

AI agent skills for engineering workflows. Installable via [rolecraft](https://github.com/rolecraft-sh/rolecraft).

## Skills

| Slug | Name | Description |
|------|------|-------------|
| `task-decomposer` | Task Decomposer | Break complex requests into structured, AI-friendly task sequences |
| `coverage-guard` | Coverage Guard | Enforce 100% test coverage for JS/TS projects |
| `flaky-test-detector` | Flaky Test Detector | Detect, analyze, and fix flaky tests across any test runner |

## Install

```bash
# Install a single skill by slug
npx rolecraft install task-decomposer
npx rolecraft install coverage-guard
npx rolecraft install flaky-test-detector

# Install all skills
npx rolecraft install rolecraft-sh/skills

# Install a specific skill from this repo
npx rolecraft install rolecraft-sh/skills --skill coverage-guard
```

## License

MIT
