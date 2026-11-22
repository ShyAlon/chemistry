# Limited Hebrew read-aloud trial

The `references/read-aloud` page contains two Chemistry 1 excerpts from G1:
three matter-classification sentences and nine density/units/temperature chunks.
It is not full-catalogue narration. The original course content, answers, progress
storage, formula page and printed sheets are unchanged.

Only voices reported by the browser as both Hebrew and `localService === true`
are offered. Delayed/empty voice discovery and voice removal are handled. There
is no English substitution, remote TTS fallback, microphone request or new server
API. Voice availability and quality depend on the browser/device; Chrome is the
primary test target, not an operating-system assumption.

Each authored chunk is one utterance. Its highlight starts only on the actual
start callback and advances only after completion. No word-boundary timing is
assumed. Formula speech is separate from display text and uses reviewed meaning
in context, including rho/mass/volume, cubic metres and the temperature decimal.
The three density displays and temperature conversion have coverage contracts.

Play, stop, replay and sentence navigation are provided. Pause cancels the current
utterance; continuing explicitly restarts that sentence. Speed changes take effect
from the next sentence. A compact transport stays above the existing site footer.
The active chunk scrolls into view. Leaving the foreground, changing excerpts or
leaving the route cancels speech and invalidates old callbacks. Ten-second start
and 90-second per-chunk watchdogs stop stalled engines; they never simulate speech
progress. No activity is stored and study completion is not changed.

Controller/source tests run in `npm test`. The existing browser target also runs
`test-read-aloud.mjs` with isolated Firebase test doubles, local-only network and
controlled speech events, at 320, 390, 667x375 and 1280 widths. This checks missing
voices, highlighting, pause/restart, skip, route cleanup, foreground stop, viewport
fit, formula keys and shared header/footer clearance. Mock playback screenshots
are visibly labeled as silent simulations.

Those tests do not certify audible Hebrew, scientific pronunciation, sentence gaps,
real-device callback alignment, installed-PWA behavior, offline synthesis or locked-
screen/background playback. These require an actual-device listening test before
expanding the trial. A missing local Hebrew voice is a supported unavailable state,
not a reason to silently change language or services.
