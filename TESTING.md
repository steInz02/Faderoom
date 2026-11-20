# Verification

| Check | Result |
| --- | --- |
| Sample defense shortened from 10:00 to 08:00 in eight steps | Passed. Paolo’s locked prototype remained at 04:00. |
| Fader arithmetic | Passed 2,816 cases covering four faders, every combination of locks, and requests inside and outside the available range. Every result preserved the ten-minute total, the one-tick minimum, and all locked durations. |
| Saved-state schema | Passed a JSON round trip on the edited sample. Missing structure, an empty section list, and whitespace-only titles were rejected. |
| Time parsing | Passed checks for a minimum 00:15 section, invalid seconds, and a duration off the 15-second grid. |
| PNG content generation | Executed the production drawing function using a Node Canvas implementation and a simulated download link. Verified the requested filename and decoded the 1100 × 664 PNG included in the README. |
| Browser interaction and responsive layout | Desktop Chromium could not start in the test environment, and the separate browser could not reach the local project server. Native dragging, focus, phone layout, refresh persistence, and the actual browser download remain unverified. |
| GitHub Pages | Deployment instructions included. Hosting has not been tested on a live repository. |

## Browser smoke test

1. Open the extracted index.html. Use the example, lock the second channel, and tap the minus button eight times. Expect 08:00 total and a locked 04:00 prototype.
2. Tab to Mika’s fader and press Right. Expect Mika to gain 00:15, Paolo to stay locked, and the total to remain 08:00.
3. Reload. Check the same title, durations, and locks. Open Edit program, enter 01:17, and choose Apply mix. Expect validation. Replace it with 01:15 and apply.
4. At 390 px viewport width, drag a fader on its own row. Check that the controls and cue sheet fit without horizontal scrolling. Repeat at 320 px and on a desktop.
5. Export PNG and open the downloaded image. Compare each interval against the on-screen cues. The final interval should end at the displayed slot length.
