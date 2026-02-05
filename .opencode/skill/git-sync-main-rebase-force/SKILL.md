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

## Quick checks

```bash
git status
git branch --show-current
git rev-parse --abbrev-ref @{u}
```
