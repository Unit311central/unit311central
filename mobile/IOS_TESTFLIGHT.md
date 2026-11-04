# WOLF Central on iPhone

Apple has **no APK**. Options for testers:

## A. Safari (ready now — send your friend)

1. Share: **https://wolf.unit311central.com/app-download** or **https://wolf.unit311central.com/login**
2. Friend opens in **Safari**, signs in, uses Tools → WebRTC like desktop.
3. Optional: **Share → Add to Home Screen** for an app-like icon.

Location, camera, and field capture use **Safari permissions** (not a native shell).

## B. TestFlight (native Capacitor app — requires Apple Developer)

Needs:

- Apple Developer Program (paid)
- Mac with Xcode
- App Store Connect app record

Rough steps (on a Mac):

```bash
cd mobile
npm install
npx cap add ios
npx cap sync ios
# Open Xcode, set team signing, add NSLocationWhenInUseUsageDescription in Info.plist
npx cap open ios
# Product → Archive → Distribute → TestFlight
```

Invite testers by email in App Store Connect → TestFlight.

## C. Ad-hoc IPA (not recommended for friends)

Limited to 100 registered device UDIDs per year; awkward for casual testers.

---

Android testers: use **https://wolf.unit311central.com/app-download** (APK).
