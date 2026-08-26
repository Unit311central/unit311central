# Unit311 Central — Android shell

Capacitor wrapper that loads the live Unit311 workspace login from `https://unit311central.com/login`.

After login, the WebView follows the normal redirect to your workspace host (for example `https://demo.unit311central.com/dashboard`).

**This folder is isolated.** It does not change the Next.js app, workspaces, or modules.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Android Studio](https://developer.android.com/studio) (Android SDK)
- **Java 17** (Capacitor 6 — matches common Windows installs)

Create `mobile/android/local.properties` (not committed) if Gradle cannot find the SDK:

```properties
sdk.dir=C\:\\Users\\Usuario\\AppData\\Local\\Android\\Sdk
```

Adjust the path to your Android SDK if different.

## Build a debug APK

```bash
cd mobile
npm install
npx cap add android
npx cap sync android
npm run build:android
```

APK output:

`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## Install on your phone

### Option A — copy the APK

1. Copy `app-debug.apk` to your phone (USB, Drive, email).
2. Open the file on the phone.
3. Allow install from unknown sources if Android prompts you.
4. Open **Unit311 Central** and sign in with your existing workspace credentials.

### Option B — USB + adb

1. Enable **Developer options** → **USB debugging** on the phone.
2. Connect the phone to your PC.
3. Run:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Open in Android Studio (optional)

```bash
cd mobile
npm install
npx cap sync android
npm run open:android
```

Then **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

## Re-sync after config changes

If you edit `capacitor.config.ts`:

```bash
cd mobile
npm run sync
```
