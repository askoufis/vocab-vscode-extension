# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2021-11-18

### Changed

#### Commands

- `vocabHelper.extractTranslationString` is less particular about whether your selection includes quotes or not. Whether you highlight the string with or without quotes, the extract string should be the same. There is still and edge case for string literal prop values inside curly brackets (e.g. `text={'foo'}`) that isn't handled correctly (yet).

## [0.0.1] - 2021-11-18

### Added

#### Commands

- `vocabHelper.extractTranslationString`: extract the currently highlighted string into the nearest `translations.json` file, creating the file if necessary
- `vocabHelper.openTranslationsFile`: open the `translations.json` file for the current component

#### Settings

- `vocabHelper.formatSaveTranslationOnExtract`: **Warning: When enabled, this setting causes a window to be open and closed very quickly, which may be quite jarring for some users.**
  Format and save the `translations.json` file after adding the extracted string. When enabled, the `translation.json` file will be opened in your editor, saved (and formatted if auto-formatting JSON files is enabled), and then closed.
