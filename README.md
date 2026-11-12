# Rollprint

Roll the print robot onto marked tiles to finish each job. Each roll turns the robot 90 degrees. The small symbol on a neighboring tile previews the face that will land there. Match it to the larger mark to print. Swipe, tap an adjacent tile, or use the arrow keys. Undo is available during a job.

The game includes six jobs in three workshops. A short 3D opening shows the robot arriving at the press. Each finished job plays a proof sheet animation. Use **Skip** to move on. The score rewards fewer moves, and unfinished jobs save your exact orientation and printed tiles.

Open the root `index.html` or `standalone.html`. Both contain the complete game and its MIT licensed local Three.js renderer. WebGL provides the 3D presentation, with a Canvas fallback for supported browsers without WebGL. Audio starts with a player gesture and can be muted. The music is an original 156 BPM electronic loop.

Build from the source with `node build.cjs`. The previous playtest of [Combos Minecraft Kart Rush](https://combos.game/zh-CN/play/cb4f80eceada861363e48223eddddabb) informed the camera and materials. The printing rules, models, graphics and audio were created for Rollprint.
