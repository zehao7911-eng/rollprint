# GameWave import

Upload the ZIP with `index.html` at its root. The game can start in a browser while GameWave injects `window.neonlib` asynchronously.

- A job starts at the first committed legal roll. It ends when every required symbol is printed. The opening, pause, idle resume screen and proof sheet do not send additional events.
- The `rollprint-v1` local key stores the active board and undo history. The cloud envelope belongs to `rollprint`. A current local board takes priority over another cloud checkpoint. Stars, best move counts and reward flags merge with their existing values.
- Confirmed positive likes add golden sparks. Confirmed direct comments, including image-only comments, add confetti. Unsupported callbacks are hidden. Invalid callbacks, unlikes and repeats do not grant effects.
- Local and mock validation are separate from testing in the GameWave app.

[Official GameWave SDK guide](https://rg975ojk5z.feishu.cn/wiki/MQg7wMknzieOkukxyWVc4UB0nDh)
