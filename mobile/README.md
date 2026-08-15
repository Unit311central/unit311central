# Unit311 Central — Android shell

Capacitor wrapper that loads the live Internal ops app from `https://internal.unit311central.com` (Vercel project `unit311central`).

## Local debug APK (requires Android Studio)

```bash
cd mobile
npm install
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

## CI build

GitHub Actions builds a debug APK on push to `mobile/` or manual workflow dispatch.
