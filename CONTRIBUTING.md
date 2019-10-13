# For VSCode
#### Required extensions
 * [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - Linting support (***BROKEN AT THE MOMENT***)
 * [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) - Editor configuration for standard files
 * [Mustache](https://marketplace.visualstudio.com/items?itemName=dawhite.mustache) - Support for .mustache template files
 

#### Helpful extensions
 * [Better comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) - Add features to comments
 * [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare) - Google Drive-like sharing
 * [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter) - Run all the tests on vscode


# To use it
 * `npm i` - Install all dependencies && setup config
 * `npm start` - Compile everything && launch
 * `npm run watch:ts` && `npm run watch:web` - Watch server and web client for changes and rebuild automatically
 * `npm run lint` && `npm run lint:fix` - Lint the code and try to fix issues found in it
 * `npm run test` - Lints (without fixing) & runs mocha tests

*The config.json file contains more setting to edit for launching hermes*
