# Pro Pics

A cross-platform photo workspace built with Expo, React Native, and Expo Router.

## Getting started

```sh
npm install
npm run start
```

Use the Expo CLI prompts to open the app on a device, simulator, or web browser.

## Project structure

- `src/app/` contains Expo Router screens and the root layout.
- `src/components/` contains shared UI, including the platform-specific tab bars.
- `src/constants/` and `src/hooks/` contain the shared theme and color-scheme logic.
- `assets/` contains app icons and tab bar artwork.

## Quality checks

```sh
npm run lint
npm run typecheck
```

Install or update native modules with `npx expo install <package>` to select versions compatible with the project's Expo SDK.
