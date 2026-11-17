`paseo-0.15.4-runtime.txt` is the unchanged Metro module 307 from the locally installed Paseo 0.15.4 app:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-bac8e372abac3143f9c5cfcc54f448e4.js`

It contains the web UnistylesRuntime class from react-native-unistyles 3.2.4 (MIT), bundled by Paseo (Apache-2.0). The tests execute this class with minimal environment dependencies to verify the original defect independently of every installed plugin. In particular, both `setTheme` and `setAdaptiveThemes` execute verbatim rather than a test reimplementation.

The same Metro module 307 was extracted from the installed Paseo 0.16.0 app:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-a000449d8160da8a3142ccfab0cf1346.js`

Its source matches this fixture byte for byte after trimming surrounding whitespace. Both versions have SHA-256 `95cadacc13f2c791daf5b1004509b81207ef46d88de3c9c93af729359964ca4b` for that trimmed module. The regression tests therefore cover the actual runtime shipped in both releases without duplicating the fixture. Paseo's `AppearanceProvider` is also unchanged between these releases, and its theme names and settings storage key were rechecked for 0.16.0.

Upstream sources:

- https://github.com/getpaseo/paseo/blob/v0.15.4/packages/app/src/appearance/provider.tsx
- https://github.com/getpaseo/paseo/blob/v0.16.0/packages/app/src/appearance/provider.tsx
- https://github.com/jpudysz/react-native-unistyles/blob/v3.2.4/src/web/runtime.ts
