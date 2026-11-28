# Third-party test fixtures

`tests/fixtures/paseo-0.15.4-runtime.txt` and `tests/fixtures/paseo-0.18.1-runtime.txt`
contain the web runtime class from `react-native-unistyles` 3.2.4, authored by
Jacek Pudysz and distributed under the MIT license according to that npm
package's metadata and README.
`tests/fixtures/paseo-0.15.4-runtime.txt` was extracted from the Paseo 0.15.4
application bundle. `tests/fixtures/paseo-0.18.1-runtime.txt` was extracted from
the Paseo 0.18.1 application bundle and includes Paseo's Apache-2.0 patch to
`updateTheme` (`patches/react-native-unistyles+3.2.4.patch`). Both fixtures are
used only by tests and are not imported by the plugin's runtime entry.

Package: https://www.npmjs.com/package/react-native-unistyles/v/3.2.4

Copyright (c) Jacek Pudysz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
