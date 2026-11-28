`paseo-0.15.4-runtime.txt` is the unchanged Metro module 307 from the locally installed Paseo 0.15.4 app:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-bac8e372abac3143f9c5cfcc54f448e4.js`

It contains the web UnistylesRuntime class from react-native-unistyles 3.2.4 (MIT), bundled by Paseo (Apache-2.0). The tests execute this class with minimal environment dependencies to verify the original defect independently of every installed plugin. In particular, both `setTheme` and `setAdaptiveThemes` execute verbatim rather than a test reimplementation.

The same Metro module 307 was extracted from the installed Paseo 0.16.0 app:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-a000449d8160da8a3142ccfab0cf1346.js`

Paseo 0.17.1 also bundles the same module:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-e708bf7cb3ef31b35d0c400720135800.js`

All three releases match this fixture byte for byte after trimming surrounding whitespace, with SHA-256 `95cadacc13f2c791daf5b1004509b81207ef46d88de3c9c93af729359964ca4b`. The regression suite exercises the runtime shipped in all three releases with a single fixture. The 0.17.1 bundle still calls `setAdaptiveThemes(true)` for System and uses the same theme names and settings storage key.

`paseo-0.18.1-runtime.txt` is the unchanged Metro module 309 from the locally installed Paseo 0.18.1 app:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-3589b51598924fb6d64209cbd48da2fa.js`

Its trimmed SHA-256 is `0764473824d7f26db0afca56cc88ec0c59feb147ad9b3452cd7fbec503bd7645`. Paseo 0.18.1 still uses `react-native-unistyles` 3.2.4 (MIT), but applies Paseo's `patches/react-native-unistyles+3.2.4.patch`, which removes `this.services.registry.css.recreate()` from `updateTheme`. Both `setTheme` and `setAdaptiveThemes` are unchanged, `AppearanceProvider` still calls `setAdaptiveThemes(true)` for System, and the registered theme class names and settings storage key remain unchanged.

Upstream sources:

- https://github.com/getpaseo/paseo/blob/v0.15.4/packages/app/src/appearance/provider.tsx
- https://github.com/getpaseo/paseo/blob/v0.16.0/packages/app/src/appearance/provider.tsx
- https://github.com/getpaseo/paseo/blob/v0.17.1/packages/app/src/appearance/provider.tsx
- https://github.com/getpaseo/paseo/blob/v0.18.1/packages/app/src/appearance/provider.tsx
- https://github.com/getpaseo/paseo/blob/v0.18.1/patches/react-native-unistyles+3.2.4.patch
- https://github.com/jpudysz/react-native-unistyles/blob/v3.2.4/src/web/runtime.ts
