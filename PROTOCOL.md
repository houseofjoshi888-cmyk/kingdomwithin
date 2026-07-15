# Malkuta Frequency Protocol

Protocol version: `2.0.0`

This document is the constitution for deterministic calculation, artifact generation, metadata, and mint provenance. Every conforming implementation must produce byte-for-byte equivalent canonical inputs from the same source, mapping, and protocol version.

## 1. Normalization

1. Apply JavaScript `String.prototype.normalize("NFKD")` to the source text.
2. In `aramaic_standard`, remove every non-letter character, retain only mapped Hebrew glyphs, and normalize final forms: `ך→כ`, `ם→מ`, `ן→נ`, `ף→פ`, `ץ→צ`.
3. In `root_60`, remove every character except ASCII `a-z`, `A-Z`, and `0-9`. Case is preserved exactly.
4. In `custom`, remove every non-letter character and retain only glyphs present in the uploaded mapping.
5. Preserve the resulting mapped character stream as `normalized_text`.

## 2. Mapping identifiers

- `aramaic_standard`: immutable 22-glyph Aramaic/Hebrew `MASTER_MAP`, values 1–400.
- `root_60`: each normalized ASCII alphanumeric character maps to `character.charCodeAt(0) % 60`, producing values 0–59.
- `custom`: the exact uploaded mapping. A production mint must additionally pin and identify the custom mapping digest.

The selected identifier must be stored as `mapping_mode` in metadata. Mapping choice must never be inferred.

## 3. Numerical and geometric derivation

Let `Sum` be the sum of mapped glyph values and let `Max_Possible_Sum` be the number of mapped glyphs multiplied by the highest value in the active map.

- Numerical Signature: `Sum`
- Symmetry: `Sum % 12 + 3`
- Rotation: `Sum % 360` degrees
- Scale: `(Sum / Max_Possible_Sum) * 1.618`
- Hue: `Sum % 360` on the HSL wheel
- Root-60 Alignment Constant: `Sum % 360`

No random seed, entropy source, timestamp, wallet address, or token ID may affect the geometry.

## 4. Canonical protocol seal

The protocol seal is:

```text
SHA256(normalizedText + mappingMode + protocolVersion + geometryParams)
```

For version `2.0.0`, `geometryParams` is compact JSON with this exact key order:

```json
{"numericalSignature":0,"symmetry":0,"rotation":0,"scale":0,"hue":0,"alignmentConstant":null}
```

`scale` is rounded to 12 decimal places before serialization. SHA-256 is emitted as a lowercase `0x`-prefixed 32-byte hex value.

## 5. Canonical artifact

SVG is the canonical heirloom format because it is resolution-independent and mathematically representable as XML. The live canvas may also be frozen at protocol time `t=0`, with pointer displacement reset to zero, and exported as a full-quality PNG convenience rendition.

The SVG must embed protocol version, mapping mode, normalized text, and geometry parameters in its `<metadata>` element. Animation state is not part of the canonical artifact.

## 6. Manifest and manifest digest

The manifest stores the image URI, source text, protocol version, explicit mapping identifier, numerical signature, symmetry, rotation, scale, hue, and canonical SHA-256 seal. Root-60 manifests additionally store `"alignment_mode": "Root-60"` and the calculated `alignment_constant`.

After the image is pinned and its final `ipfs://` URI is inserted, serialize the manifest once with `JSON.stringify`. Compute `keccak256` over the UTF-8 bytes of that final JSON string. The resulting 32-byte value is the `contentHash` submitted to `MalkutaEngine.mint`.

The Keccak digest is not inserted into the JSON it hashes. A document cannot contain the hash of its own final bytes without creating a recursive, generally unsatisfiable definition. The digest belongs on-chain and in the mint receipt. This preserves the intended locked-box guarantee without ambiguity.

## 7. Strict minting sequence

1. Normalize and calculate.
2. Generate and capture the fixed canonical SVG; optionally capture PNG.
3. Pin the image and obtain its immutable URI.
4. Build and serialize the final manifest.
5. Compute the manifest Keccak-256 digest.
6. Pin the exact manifest bytes to IPFS.
7. Call `mint(to, tokenId, contentHash, protocolVersion, mappingDigest)` on Base Sepolia.
8. Read the public `provenance(tokenId)` value and compare every stored value with the submitted values.

No metadata or artwork bytes may change after mint. A changed file necessarily produces a different CID and digest.

## 8. Freedom Engine epochs

Supply is conceptually infinite and organized into calendar-year epochs. Closing an epoch freezes its summary: most minted source texts, frequency distribution, color distribution, and geometry patterns. Epoch summaries must be derived from immutable mint events and published as separate versioned artifacts; they must never alter token provenance.

The exact on-chain epoch-closing authority, time boundary, summary digest, and token-ID allocation are reserved for the audited contract specification before mainnet deployment.

At year end, a sealed epoch may publish a digital yearbook and/or an `Epoch Final` NFT containing a versioned aggregate summary and selected mathematical signatures. This is a new artifact and cannot modify any prior token.

The real-time dashboard should index `MandalaMinted` events with a subgraph or equivalent event indexer. Statistical aggregation reads canonical manifest attributes and does not store image files. The current Track A event has no geometry fields and the contract has no retrievable manifest URI, so an audited manifest-discovery mechanism or expanded event is required before genuine on-chain distributions can be calculated.

## 9. Universal Harmonic Bridge

The instrument is mapping-agnostic, but every mapping remains explicit and versioned. `aramaic_standard` is the immutable historical baseline, `root_60` is the universal sexagesimal bridge, and custom maps are user-supplied and digest-bound.

Root-60 is defined by this exact function after normalization: add `normalized.charCodeAt(i) % 60` for every character. The alignment constant is `Sum % 360`. No case conversion, locale rule, transliteration, or alternative Unicode mapping is permitted in protocol `2.0.0`.

## 10. Deployment gate

`MalkutaEngine.sol` mirrors the contract deployed on Base mainnet at `0xD9883fDdf57Ca58f775Bdab96C0e7c3F1c918af3`. Genesis Epoch 0 is active at 0.01 ETH.

Paid minting must remain disabled in the Composer because the deployed source calls `ownerOf(tokenId)` to test whether an unused token exists. OpenZeppelin ERC-721 reverts with `ERC721NonexistentToken` for that exact case, so every new-token mint reverts before `_safeMint`. A corrected deployment must use `_ownerOf(tokenId) == address(0)` or rely on `_safeMint`'s existing-token protection. The replacement address must be verified before the UI enables transaction submission.
