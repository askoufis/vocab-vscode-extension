# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2021-12-17

Bumping the version to force another release. This is the second time this has happened. Not sure what's going on.

## [0.2.1] - 2021-12-17

### Changed

- `vocabHelper.extractTranslationString` now correctly handles highlighting string constants with their surround quotes. Previously, these were being detected as string literal prop values.

  E.g.

  ```ts
  const foo = "foo";
  //          _____
  //          ^^^^^ Highlighted

  // Incorrect extraction before v0.2.1
  const foo = {t("foo")};

  // Fixed extraction in v0.2.1
  const foo = t("foo");
  ```

## [0.2.0] - 2021-12-17

### Added

- The maximum translation key length can now be configured via the `vocabHelper.maxTranslationKeyLength` configuration property. Translation keys above this length will be truncated to the specified maximum length (unless the truncation would occur immediately after a space, in which case the truncation will occur just before the space) and an ellipsis (three period characters, not any of the unicode ellipsis character) will be appended.

  E.g. with a maximum translation key length of 15

  ```
  "I'm a translation key" -> "I'm a translati..."
  ```

## [0.1.1] - 2021-11-29

Seems like the previous release didn't actually contain the new feature. Bumping the version so I can release a newer version.

## [0.1.0] - 2021-11-28

### Added

- `vocabHelper.extractTranslationString` can now extract JSX string literals with arguments in them.
  E.g.

  ```tsx
  const MyComponent = () => {
    const numberOfThings = 2;
    return <div>I have {numberOfThings} things</div>;
  };
  ```

  becomes

  ```tsx
  const MyComponent = () => {
    const numberOfThings = 2;
    // prettier-ignore
    return <div>{t("I have numberOfThings things"), {numberOfThings}}</div>;
  };
  ```

## [0.0.7] - 2021-11-28

### Changed

- `vocabHelper.extractTranslationString` now correctly handles string literal prop values
  E.g.

  ```tsx
  const MyComponent = () => <div foo="bar">Test</div>;
  ```

  becomes

  ```tsx
  const MyComponent = () => <div foo={t("bar")}>Test</div>;
  ```

- Translation files now have their JSON automatically formatted. The hacky workaround enabled by the `vocabHelper.formatSaveTranslationOnExtract` setting has been removed, and hence the setting itself has also been removed. I never knew `JSON.stringify` could also format your JSON.

### Internal

- General readability and cleanliness refactor
- Integration tests now all pass when run at once. See [the issue](https://github.com/askoufis/vocab-vscode-extension/issues/7) for more info.

## [0.0.6] - 2021-11-26

### Changed

#### Documentation

- Updated installation instructions and known issues sections of the README. Releases will no longer be published on the github repo release page because the extension is now on the VSCode marketplace.

## [0.0.5] - 2021-11-26

### Changed

#### Commands

- `vocabHelper.extractTranslationString` now correctly handles single line and multi line JSX string literals.
  E.g.

  ```tsx
  const MyComponent = () => (
    <div>
      A string long enough to be on its own line. Padding padding padding. Some
      more padding.
    </div>
  );
  ```

  becomes

  ```tsx
  const MyComponent = () => (
    <div>
      {t(
        "A string long enough to be on its own line. Padding padding padding. Some more padding."
      )}
    </div>
  );
  ```

## [0.0.4] - 2021-11-22

### Changed

#### Commands

- The default hotkey for `vocabHelper.extractTranslationString` is now `Ctrl + Alt + T` on Windows/Linux, `Ctrl + Option + T` on MacOS. The previous hotkey of `Ctrl + Shift + T` clashes with the default hotkey for opening a previously closed tab on Windows/Linux.

## [0.0.3] - 2021-11-19

### Changed

#### Commands

- `vocabHelper.extractTranslationString` now correctly handles updating the `translations.json` file when it exists but contains no text.

## [0.0.2] - 2021-11-18

### Changed

#### Commands

- `vocabHelper.extractTranslationString` is now less particular about whether your selection includes quotes or not. Whether you highlight the string with or without quotes, the extract string should be the same. There is still and edge case for string literal prop values inside curly brackets (e.g. `text={'foo'}`) that isn't handled correctly (yet).

## [0.0.1] - 2021-11-18

### Added

#### Commands

- `vocabHelper.extractTranslationString`: extract the currently highlighted string into the nearest `translations.json` file, creating the file if necessary
- `vocabHelper.openTranslationsFile`: open the `translations.json` file for the current component

#### Settings

- `vocabHelper.formatSaveTranslationOnExtract`: **Warning: When enabled, this setting causes a window to be open and closed very quickly, which may be quite jarring for some users.**
  Format and save the `translations.json` file after adding the extracted string. When enabled, the `translation.json` file will be opened in your editor, saved (and formatted if auto-formatting JSON files is enabled), and then closed.
