# Brand files

The Converts Club mark: a doorway you step through.

| File | Use |
|---|---|
| `mark.svg` | Primary mark, oxblood + gold, for light backgrounds |
| `mark-on-dark.svg` | Paper + brighter gold, for dark backgrounds |
| `mark-black.svg`, `mark-white.svg` | One-colour versions |
| `icon.svg` | App / favicon tile: the mark on an oxblood rounded square |
| `png/` | Transparent PNG exports (mark at 1000 px high, tile at 16 to 512 px) |

The app draws the mark from `src/components/brand/mark-geometry.ts`; keep it in sync with `mark.svg`.
`public/brand/` holds the files the site serves (emails use `mark.png`; the manifest uses `icon-192.png` and `icon-512.png`).
Colours: oxblood #7A1F2B, gold #B07A1E (#C98F2A on dark), paper #FBF9F6, ink #16130F.
