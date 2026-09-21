# Campaign Continue

Continue reconstructs the latest saved aisle boundary from the actual run seed, input history and earned upgrade choices. IndexedDB stores the larger replay logs. A completed aisle is also saved while its upgrade is pending. Resuming starts paused; new campaigns ask before replacing the checkpoint. Practice and Daily Rush preserve it, while a campaign loss, final victory or confirmed local reset clears it.

The server can renew a checkpoint after attempt expiry or restart. It replays the completed prefix, binds its hash and pending upgrade to the new attempt, and gives elapsed-time credit only for that validated prefix. New gameplay still observes the challenge clock. No saved score or health field is trusted.

## Verification

- All 51 Node checks pass. Added coverage proves complete equipment/state reconstruction, log isolation after saving, invalid boundaries, old rulesets, resumed history tampering, new-gameplay timing, duplicate submissions and server restart. Trusted proxy coverage rejects forged client identity headers from untrusted peers.
- The official ship checker passes 43 modules and one page. The selected recipe assets are unchanged.
- `ui/report.json` is PASS. A disposable Chrome profile and Node score store check real new-game input, menu/reload, keyboard and touch Continue, exact earned equipment, pending upgrades, new-game cancellation/replacement, practice isolation, reset and corrupt/incompatible save recovery. Four viewports cover desktop, portrait, short portrait and landscape. Visual inspection caught footer overlap and then a clipped record in landscape; the final capture and a record-bounds assertion verify the corrected layout.
- Later-aisle fixtures use input logs produced by deterministic simulation of a genuine aisle-one clear. The browser checks load those checkpoints through the real storage API. They are UI/restore evidence, not an uninterrupted combat campaign or physical-phone test.

Deployment-specific hostnames, addresses, firewall configuration and operational results are kept outside this public repository. A public URL gate remains a separate delivery check.
