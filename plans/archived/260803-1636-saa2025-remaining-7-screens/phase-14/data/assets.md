# Asset Manifest

Mapping `nodeId → asset file path`. Multiple nodeIds may point to the same file (dedup by node name). The path is a PLAN — the file may still be downloading in the background. Paths are **import-ready** (prefix `/secret-box`).

| Node ID | File path | Filename | Status |
|---------|-----------|----------|--------|
| `1466:7679` | `/secret-box/Close.svg` | `Close.svg` | ✓ |
| `1466:7685` | `/secret-box/hieu-ung-box-qua.png` | `hieu-ung-box-qua.png` | ✓ |
| `1466:7686` | `/secret-box/box-qua-chua-mo.svg` | `box-qua-chua-mo.svg` | ✓ |
