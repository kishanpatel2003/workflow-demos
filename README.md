# Workflow Tools

Three interactive apps for support, appointment booking, and a time-management game. Run them in a browser with no setup.

```sh
python3 -m http.server 8789 --bind 127.0.0.1
```

Open `http://127.0.0.1:8789/`, or open any app's `index.html` directly.

| App | What it does | Try |
| --- | --- | --- |
| [Ecommerce support](ecommerce-support/) | Suggested replies, source references, exception routing, human approval | Add a question, review its reply and sources, then approve or hold |
| [Tailor appointment setter](tailor-appointment-setter/) | Lead qualification, fitting selection, CRM timeline, quote handoff | Step through qualification and inspect the booking and handoff |
| [Dessert Rush](dessert-video-game/) | Orders, recipes, timed serving, upgrades, harder shifts | Assemble an order and serve before patience expires |

Support replies and booking actions run locally with example data; they do not send messages or update external systems. The game saves scores and unlocks in browser storage. Reload the other apps to reset their state.

MIT licensed.
