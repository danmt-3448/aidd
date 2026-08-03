#!/usr/bin/env python3
"""
filter-screens.py — parse a MoMorph list_frames result and emit a COMPACT,
context-safe summary. Solves the 3 gaps found in check-progress:

  Gap 1: list_frames output is huge (50KB+) → never read it inline. Parse the
         saved tool-result file here and print only what the report needs.
  Gap 2: 174 frames mix real web pages with iOS screens and UI components →
         categorize so the report only tracks web page screens by default.
  Gap 3: MoMorph dev_status is unreliable (built screens still show dev=none) →
         we surface it as informational only; local code is the source of truth.

Usage:
    filter-screens.py <path-to-list_frames-result.txt> [--all]

    <path>  The file the MCP tool saved when the result overflowed context
            (the error message prints this path). Also accepts a raw JSON file.
    --all   Also print iOS and component buckets (default: web pages only).

Output: plain text, grouped, < ~4KB. Safe to read into the main context.
"""
import json
import re
import sys

# Name patterns that mark a frame as a UI component / fragment, not a page.
COMPONENT_HINTS = re.compile(
    r"\b(dropdown|component|floating action button|hover|popup|date picker|"
    r"addlink box|frame \d+)\b",
    re.IGNORECASE,
)
IOS_PREFIX = re.compile(r"^\s*\[ios\]", re.IGNORECASE)


def load_frames(path: str) -> list:
    raw = open(path, encoding="utf-8").read()
    obj = json.loads(raw)
    if isinstance(obj, dict) and "frames" in obj:
        return obj["frames"]
    if isinstance(obj, list):
        return obj
    raise SystemExit(f"Unexpected JSON shape: keys={list(obj)[:10] if isinstance(obj, dict) else type(obj)}")


def bucket(frame: dict) -> str:
    """web_page | ios | component | no_spec"""
    if frame.get("spec_status", "none") == "none":
        return "no_spec"
    name = frame.get("name", "")
    if IOS_PREFIX.search(name):
        return "ios"
    if COMPONENT_HINTS.search(name):
        return "component"
    return "web_page"


def row(f: dict) -> str:
    return (
        f"  {f.get('name','')[:38]:40} | id={f.get('screen_id',''):14} "
        f"| spec={f.get('spec_status',''):11} | dev={f.get('dev_status','')} (unreliable)"
    )


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    path = sys.argv[1]
    show_all = "--all" in sys.argv[2:]

    frames = load_frames(path)
    buckets: dict[str, list] = {"web_page": [], "ios": [], "component": [], "no_spec": []}
    for f in frames:
        buckets[bucket(f)].append(f)

    print(f"=== MoMorph frames: {len(frames)} total ===")
    print(f"  web_page (spec'd pages) : {len(buckets['web_page'])}")
    print(f"  ios (mobile, separate)  : {len(buckets['ios'])}")
    print(f"  component (dropdown/etc) : {len(buckets['component'])}")
    print(f"  no_spec (not design-ready): {len(buckets['no_spec'])}")
    print()

    def dump(title: str, key: str) -> None:
        items = sorted(buckets[key], key=lambda x: x.get("name", ""))
        done = [f for f in items if f.get("spec_status") == "done"]
        wip = [f for f in items if f.get("spec_status") == "in_progress"]
        print(f"=== {title} — spec done ({len(done)}) ===")
        for f in done:
            print(row(f))
        if wip:
            print(f"--- {title} — spec in_progress ({len(wip)}) — design NOT ready ---")
            for f in wip:
                print(row(f))
        print()

    dump("WEB PAGE SCREENS", "web_page")
    if show_all:
        dump("iOS SCREENS", "ios")
        dump("COMPONENTS", "component")

    print("NOTE: dev_status from MoMorph is unreliable — verify build via local code, not this column.")


if __name__ == "__main__":
    main()
