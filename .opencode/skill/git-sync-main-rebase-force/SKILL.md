---
name: git-sync-main-rebase-force
description: Sync local+origin main to upstream main, then rebase current branch onto main and force-push safely.
---

## Use this when

- Your repo is a fork with `origin` (fork) and `upstream` (source)
- You need `origin/main` to match `upstream/main`
- You want to rebase the current topic branch onto the updated default branch

## Assumptions

- Default branch is `main`
- Remotes are named `origin` and `upstream`
- Use `--force-with-lease` (preferred over `--force`)

## Steps

1. Fetch latest refs

```bash
git fetch --prune origin
git fetch --prune upstream
```

2. Sync default branch locally with upstream (fast-forward when possible)

```bash
git switch main
git merge --ff-only upstream/main
```

If `--ff-only` fails because `main` diverged, you are about to overwrite history. To hard-sync to upstream:

```bash
git reset --hard upstream/main
```

3. Sync default branch on your fork (`origin`)

```bash
git push origin main
```

If you hard-synced with `reset --hard` and `origin/main` diverged, you may need:

```bash
git push --force-with-lease origin main
```

4. Rebase current branch onto updated default and force-push

```bash
git switch -
git rebase main
git push --force-with-lease
```

## Conflict Resolution Guidelines

When conflicts occur during rebase, follow these principles carefully:

### Priority: Preserve Your Feature's Intent

1. **Understand Both Sides First**
   - Read the conflicting sections completely before editing
   - Identify what `main` changed vs what your branch changed
   - Ask: "What is my feature trying to accomplish?"

2. **Your Branch's Feature Takes Priority** (with integration)
   - The goal is to land YOUR feature on top of updated main
   - Keep your feature's logic, behavior, and intent intact
   - Integrate upstream changes that don't conflict with your feature's purpose

3. **Conflict Resolution Strategy**
   ```bash
   # View the conflict in detail
   git diff
   
   # See what your branch originally had
   git show HEAD:path/to/file
   
   # See what main has
   git show main:path/to/file
   ```

4. **Resolution Checklist**
   - [ ] Feature behavior preserved exactly as intended in your commits
   - [ ] Upstream structural changes (imports, formatting) integrated
   - [ ] No accidental deletion of your new code
   - [ ] No accidental inclusion of code your branch intentionally removed
   - [ ] Syntax valid (no leftover conflict markers)

5. **After Each Conflict Resolution**
   ```bash
   git add <resolved-files>
   git rebase --continue
   ```

6. **If Uncertain**
   ```bash
   # Abort and start fresh
   git rebase --abort
   
   # Review commits before retrying
   git log --oneline main..HEAD
   git diff main..HEAD
   ```

### Common Pitfalls to Avoid

- **Don't blindly accept "theirs" or "ours"** — always understand the change
- **Don't lose additions from your branch** — your feature's new code is precious
- **Don't accidentally revert your intentional deletions** — if you removed something, keep it removed
- **Don't break imports/dependencies** — verify the file still works after resolution

## Quick checks

```bash
git status
git branch --show-current
git rev-parse --abbrev-ref @{u}
```
