---
name: git-housekeeping
description: >-
  Clean up local git branches, detect stale branches, manage stashes, and lint
  commit messages. Use when the user says 'cleanup branches', 'tidy git',
  'remove merged branches', 'git housekeeping', 'stale branches', or wants to
  clean up local git state. NOT for creating commits, force pushing, or
  rewriting history.
license: MIT
compatibility: opencode, claude-code, cursor, windsurf, copilot
metadata:
  category: development
  audience: developers
---

# Git Housekeeping

Keep your local git repositories tidy. This skill analyzes your git state,
identifies branches that can be safely removed, checks for common git hygiene
issues, and executes cleanup — always with user confirmation before any
destructive action.

## Safety Rules (NEVER VIOLATE)

1. **NEVER** delete the current checked-out branch.
2. **NEVER** delete `main`, `master`, `develop`, or `trunk`.
3. **NEVER** delete a branch with unpushed commits without explicit warning.
4. **ALWAYS** present a dry-run plan before executing any deletion.
5. **ALWAYS** ask for confirmation before running destructive commands.
6. **NEVER** force push or rewrite history.
7. **ALWAYS** run `git fetch --prune` first to get accurate remote state.

## Phases

### Phase 1: Fetch and Analyze

Run these commands to gather the full state:

```bash
# Fetch latest remote state
git fetch --prune

# List all local branches
git branch

# Show current branch
git branch --show-current

# Check for uncommitted changes
git status --short

# List stashes
git stash list

# Show default branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

Identify:
- **Default branch** — usually `main` or `master` (from `origin/HEAD`)
- **Current branch** — never touch this one
- **Protected branches** — `main`, `master`, `develop`, `trunk`

### Phase 2: Find Merged Branches

Find branches that have been merged into the default branch:

```bash
git branch --merged <default-branch> | grep -vE '^\*|^\s*(main|master|develop|trunk)$'
```

These are safe to delete with `git branch -d`.

**Important:** Squash-merges may hide merged branches from `--merged`. Cross-check
with `git log --oneline <default-branch>..<branch>` — if empty (no unique commits),
the branch work is already in the default branch even if `--merged` doesn't show it.

### Phase 3: Find Stale Branches

Find branches with no commits in the last 30 days:

```bash
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(committerdate:relative)||%(refname:short)' \
  | head -20
```

Flag branches older than 30 days that are NOT in the merged list. Ask before
listing them as stale candidates.

### Phase 4: Check Hygiene

Run these checks and report issues:

```bash
# Check stash count
stash_count=$(git stash list 2>/dev/null | wc -l)

# Check uncommitted changes
dirty_count=$(git status --short | wc -l)

# Check for merge conflicts
conflict_count=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)

# Check remote tracking branches with deleted upstream
gone_count=$(git branch -vv | grep ': gone]' | wc -l)
```

Report:
- **Stashes:** if > 3, suggest review
- **Dirty files:** if any, warn that cleanup won't touch them
- **Conflicts:** if any, flag as blockers
- **Gone branches:** branches whose remote was deleted — offer to prune

### Phase 5: Present Full Report

Present a structured report:

```markdown
## Git Housekeeping Report

### Merge Status
- Default branch: `main`
- Current branch: `feat/my-feature` (will NOT be touched)
- Protected: `main`, `master`, `develop`, `trunk`

### Safe to Delete (merged into default)
- `fix/typo` — merged into main
- `feat/login` — squash-merged, no unique commits
- `chore/update-deps` — merged into main

### Stale Candidates (30+ days, not merged)
- `experiment/new-api` — last commit 45 days ago
- `old-refactor` — last commit 60 days ago
    ↳ Ask user before including in delete list

### Hygiene
- ✅ Stashes: 1
- ⚠️ Dirty files: 2 (unrelated to cleanup)
- ✅ Merge conflicts: 0
- ℹ️ Gone branches: 3 (remote deleted)

### Summary
- 3 branches safe to delete
- 2 stale candidates (ask)
- 3 gone branches to prune

Proceed with cleanup? (y/N)
```

### Phase 6: Execute Cleanup

Only after user confirms:

```bash
# Delete merged branches (safe delete)
git branch -d fix/typo
git branch -d feat/login
git branch -d chore/update-deps

# Delete gone branches (remote deleted, local tracking refs)
git branch -d old-feature
git branch -d wip-experiment

# Prune remote tracking refs
git remote prune origin

# Print remaining branches
git branch
```

**Force delete (`-D`)** only for squash-merged branches where `-d` fails, and
only after telling the user why force is needed.

### Phase 7: Verify

```bash
git branch
git stash list
git status --short
```

Report what was cleaned up and what remains.

## Anti-Patterns

| Anti-pattern | Why | Instead |
|---|---|---|
| `git branch -D` without checking | Deletes unmerged work | Always try `-d` first |
| `git clean -fd` without review | Destroys untracked files | Use `git clean -n` (dry-run) first |
| Deleting remote branches | Affects the whole team | Only delete local branches |
| `git push --force` | Rewrites history | Never part of cleanup |

## Examples

User: "clean up my branches"

Agent:
1. Runs `git fetch --prune` and `git branch --merged main`
2. Finds 4 merged branches, 1 stale branch, 2 gone branches
3. Shows report with exact `git branch -d` commands
4. Asks: "Delete 4 merged branches? (y/N)"
5. User confirms → deletes them
6. Shows remaining branches

User: "tidy up this repo"

Agent:
1. Full analysis: merged, stale, hygiene
2. Finds 0 merged but 8 gone branches, 5 stashes
3. Reports: "No merged branches. 8 remote-tracking refs have gone upstream.
   5 stashes — want to review them?"
4. Prunes gone refs after user confirms
