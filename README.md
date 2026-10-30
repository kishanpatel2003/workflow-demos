# Workflow Demos

Three self-contained browser prototypes built to explore product workflows.
They use fictional data and deterministic JavaScript. No API keys, external
accounts, live AI calls, analytics, client assets, or source proposal records are
included. All visuals use CSS, text, or system emoji; no downloaded artwork is
bundled.

## Open

```sh
python3 -m http.server 8789 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8789/` and choose a demo. Each can also be opened directly
from its `index.html` file. No build or package installation is needed.

| Demo | Workflow | Try |
| --- | --- | --- |
| [Ecommerce support](ecommerce-support/) | Source-backed suggested replies, exception routing, human approval | Add a sample question; review its draft and sources; approve or hold for a human |
| [Tailor appointment setter](tailor-appointment-setter/) | Lead qualification, a fitting appointment, CRM timeline, quote handoff | Step through qualification and inspect the booking/handoff states |
| [Dessert Rush](dessert-video-game/) | Orders, recipes, serving under time pressure, upgrades, harder shifts | Start a shift, select an order, assemble a recipe, and serve before patience expires |

The support assistant is a local simulation, not an inbox integration. The
appointment setter creates no real booking or outbound message. The game stores
scores/unlocks in browser local storage; the other demos keep session state in
memory. Reload to reset. They are product prototypes rather than production
systems or evidence of client results.

MIT licensed. These code snapshots contain no original private repository
history, course material, prospect details, job records, or recordings.
