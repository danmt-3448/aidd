#!/usr/bin/env bash
# Resolve the active plan slug from the current git branch.
#
# Personal-project convention (no ticket tracker): the plan directory under plans/
# is the work-unit anchor. A branch named <type>/<name> (e.g. chore/aidd-readiness-hardening)
# maps to the newest plans/<date>-<time>-<name>/ whose folder name ends with <name>.
#
# Deliberately does NOT call .claude/scripts/set-active-plan.cjs — that needs TKM_SESSION_ID,
# which is absent in a git hook context, so it would always no-op. Branch name is the only
# reliable source here (KISS).
resolve_active_plan_slug() {
  local branch stripped name dir
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || return 1
  [ -z "$branch" ] && return 1
  # strip a conventional prefix: chore/, feat/, fix/, docs/, refactor/, test/, perf/
  stripped="${branch#*/}"
  [ -z "$stripped" ] && return 1

  # newest plan dir whose folder name ends with the stripped branch name.
  # Convention: plan dir names are hyphen-delimited with NO spaces, so the unquoted
  # word-splitting below is safe. plans/reports/ and plans/archived/ are harmlessly
  # iterated — they never match a valid branch-derived suffix.
  for dir in $(ls -1dt plans/*/ 2>/dev/null); do
    name="$(basename "$dir")"
    case "$name" in
      *"$stripped") echo "$name"; return 0 ;;
    esac
  done
  return 1
}
