# BCN Drone Center — Android shell

Capacitor wrapper that loads the live site from `https://barcelonadronecenter.vercel.app`.

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
Download from the latest [GitHub Release](https://github.com/paulwfotheringham-cmd/barcelonadronecenter/releases) tagged `android-*`.
