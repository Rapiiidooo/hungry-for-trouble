# Shared scores, Settings and comic credits

The title's trophy opens Daily and General leaderboards. General accepts new campaign attempts starting at aisle one, including losses, with server replay of inputs, transitions and offered upgrades. Practice and unverified historical local records are excluded. Shared scores persist across days and restarts. Header buttons have identical opaque backgrounds; record and gold-livery labels align in desktop, portrait and landscape. The cleanup slogan is removed.

Settings offers a confirmed reset of local route, personal best and livery, preserving the alias and shared scores. Its Credits link opens a 48-second staff roll with native SVG vacuum gags, original synthesized music, pause, skip and reduced-motion scrolling. Credits distinguish Atlas studies from runtime media and end with Made by Rapido. The first Director checkout adds The adventure continues before the existing basement discovery; manual playback does not spoil it.

## Checks and scope

- `node-tests.txt`: 41 passing checks, including campaign upgrade/transition validation, tampered replay rejection, single-use attempts, independent identities, daily/general isolation, all-time persistence through daily pruning and restart.
- `ship-check.txt`: the unmodified recipe checks 39 modules and one page. Selected 3D assets remain unchanged.
- `leaderboards.json`: real clicks/keys in three viewports check trophy access, exact background equality, aligned edges, tabs and confirmed/cancelled resets. A real 40-point campaign lasting 11.1 seconds is replay-verified, read by a separate browser and retained after local reset. Its temporary server, data file and browser profiles are disposable. Only local unlock/record/livery fixtures are preloaded for layout/reset checks.
- `credits.json`: natural completion, pause/resume, passing vacuums, accurate attribution, no manual-playback spoiler, keyboard return, reduced-motion scrolling and responsive controls. No save fixtures or submitted scores.
- `director.json`: route unlocks alone are preloaded to start real practice at aisle 10 with three hearts, ten shots and no upgrades. Actual movement, firing and dodging defeat the Director, reach checkout, open the first-clear credits and reveal the basement. The simulation stays frozen for the reader; an earned upgrade carries into aisle 11. This is a targeted continuation, not a new uninterrupted twenty-floor completion.

`initial-probe.json` retains the first leaderboard probe's timeout: its navigator stopped moving and expected an idle death too soon. Holding a real movement key fixed that test assumption. `initial-director-probe.json` retains the first Director loss. The successful navigator also dodges nearby enemies and prioritizes a nearly defeated boss. Neither correction changes gameplay or injects combat state.

Fifteen screenshots retain representative layouts and the actual act-one ending. Browser tests use Chrome on this Mac; phone viewports are emulated. Runtime source hashes are recorded in `source-hashes.json`. No Atlas output was published or added, no geometry changed, and no deployment or submission was performed.

## Official gate

The unmodified official harness passes against gameplay commit `d3cdd7a964fa2d48fc562b10248b1441d01ddba3` at `http://localhost:3001/`. The [original verdict](jam/verdict.txt) is copied byte for byte from `jam-console.txt`; JSON and screenshots are in `jam/`.

Phone viewport 390×844 at 3× under the harness's 4G profile: **5.6 seconds** ready, **2.7 MB**, **8.7 metres** of real-touch movement, **262** peak draw calls, **568,176** peak triangles, no errors and no 404s. The 60 FPS median uses Chrome on the local Apple M5 Max, not a physical phone. A gate against a deployed public URL remains submission work.
