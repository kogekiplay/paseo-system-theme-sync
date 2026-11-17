`paseo-0.15.4-runtime.txt` is the unchanged Metro module 307 from the locally installed Paseo 0.15.4 app:

`/Applications/Paseo.app/Contents/Resources/app-dist/_expo/static/js/web/index-bac8e372abac3143f9c5cfcc54f448e4.js`

It contains the web UnistylesRuntime class from react-native-unistyles 3.2.4 (MIT), bundled by Paseo (Apache-2.0). The tests execute this class with minimal environment dependencies to verify the original defect independently of every installed plugin. In particular, both `setTheme` and `setAdaptiveThemes` execute verbatim rather than a test reimplementation.

Upstream sources:

- https://github.com/getpaseo/paseo/blob/v0.15.4/packages/app/src/appearance/provider.tsx
- https://github.com/jpudysz/react-native-unistyles/blob/v3.2.4/src/web/runtime.ts
