# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.1] - 2022-02-27

### Changed

- `vocabHelper.extractTranslationString` will now add a suffix to element names that occur more than once
  so as not to create multiple properties with the same key

  E.g.

  ```tsx
  const foo =
    // prettier-ignore
    <div>This text <a href="/foo">has</a> two <a href="/bar">links</a></div>;
  //     _____________________________________________________________
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Highlighted
  ```

  becomes

  ```tsx
  const foo = (
    <div>
      {t("This text has two links", {
        a: (children) => <a href="/foo">{children}</a>,
        // Previously this would've also had a key of "a" which is invalid in strict mode
        a1: (children) => <a href="/bar">{children}</a>,
      })}
    </div>
  );

  // Translation message: "This text <a>has</a> two <a1>links</a1>"
  ```

## [0.6.0] - 2022-02-26

### Added

- `vocabHelper.extractTranslationString` can now handle element names that are member expressions like `Foo.Bar`

  E.g.

  ```tsx
  const foo =
    // prettier-ignore
    <div>Click <Foo.Bar>here</Foo.Bar></div>;
  //     _____________________________
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Highlighted
  ```

  becomes

  ```tsx
  const foo =
    // prettier-ignore
    <div>{t("Click here", { "Foo.Bar": (children) => <Foo.Bar>{children}</Foo.Bar> })}</div>;

  // Translation message: "Click <Foo.Bar>here</Foo.Bar>"
  ```

### Internal

- Renamed files and re-organised utils folder structure
- Refactored some visitors in order to make them easier to test

## [0.5.0] - 2022-02-22

### Added

- Errors thrown during command execution will now be shown to the user. These errors could be extension errors or dependency errors. Currently the extension makes no effort to distinguish between the two but may do so in the future.

### Internal

- Tweaked some config so that the bundled and minified extension is what is being published now, rather than the plain `tsc` output. Coincidentally, this is what was causing the publishing issues I've been having; `tsc` hadn't been run for a while so the published code was stale. This shouldn't happen again going forward.

## [0.4.0] - 2022-02-21

### Changed

- `vocabHelper.formatAfterReplace` now defaults to `false` instead of `true`. Defaulting to `true` could result in annoying messages for users that do not have a formatter configured.

### Added

- `vocabHelper.extractTranslationString` can now handle member expressions (e.g. `foo.bar`) within javascript expressions contained within JSX

  E.g.

  ```tsx
  const foo = (
    <div>I have a {foo.bar} member expression</div>
    //   ____________________________________
    //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Highlighted
  );
  ```

  becomes

  ```tsx
  const foo = (
    <div>{t("I have a fooBar member expression", { fooBar: foo.bar })}</div>
  );

  // Translation message: "I have a {fooBar} member expression"
  ```

- `vocabHelper.extractTranslationString` now handles javascript space expressions (`{" "}`) and multi-line nested elements better
- `vocabHelper.extractTranslationString` was restricted to only truncating JSX that didn't contain any arguments. This restriction has now been removed.

### Internal

- Utility function refactor

## [0.3.1] - 2022-02-14

Version bump to fix release.

## [0.3.0] - 2022-02-13

### Added

- `vocabHelper.extractTranslationString` can now handle translation strings with JSX inside them.

  E.g.

  ```tsx
  const foo = (
    <div>
      I am a paragraph with some <b>bold</b> text and a <a href="/foo">link</a>
    </div>
  );
  ```

  becomes

  ```tsx
  const foo = (
    <div>
      {t("I am a paragraph with some bold text and a link", {
        b: (children) => <b>{children}</b>,
        a: (children) => <a href="/foo">{children}</a>,
      })}
    </div>
  );

  // Translation message: "I am a paragraph with some <b>bold</b> text and a <a>link</a>"
  ```

#### Configuration

- New `vocabHelper.formatAfterReplace` value toggles whether or not to format the document after replacing the highlighted translation string

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
