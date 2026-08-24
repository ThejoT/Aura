# Aura visual prototype

A single-file, browser-based click-through mockup of the Aura app — for
demos and pitches, not the production app. It's plain HTML/CSS/JS with no
build step and no dependency on the React Native source in `../src`; open
`index.html` directly in a browser, or point any static file server at it.

Seeded with seven demo screens (First launch, Attack Mode, Pain Capture,
Insights, Diary, Export, Settings) and enough fake session/diary/medication
data to show every state the real app can be in (a confident Insights
recommendation, a medication-overuse warning, an unlocked correlation
view) without waiting real minutes for anything — session/cooldown timing
runs about 12x sped up.

The real app lives in `../src` and `../App.tsx`; see the top-level
[README](../README.md) for that.
