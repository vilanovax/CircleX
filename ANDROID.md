# Android APK (Capacitor)

سیرکل به‌صورت WebView بسته‌بندی شده و به سرور Next.js وصل می‌شود
(لاگین، API و OTP روی سرور می‌مانند).

## ساخت APK دیباگ

```bash
# پیش‌فرض: https://circle.liara.run/circle
npm run apk

# برای تست روی گوشی با سرور لوکال (همان Wi‑Fi):
CAPACITOR_SERVER_URL="http://10.10.10.62:3000/circle" npx cap sync android
cd android && ./gradlew assembleDebug
```

خروجی:
`android/app/build/outputs/apk/debug/app-debug.apk`

کپی آماده:
`releases/circle-debug.apk`

## نیازمندی‌ها

- JDK **17**
- Android SDK (`$HOME/Library/Android/sdk`)
- Capacitor **6** (با Java 17 سازگار است)

## نصب روی گوشی

```bash
adb install -r releases/circle-debug.apk
```

یا فایل APK را به گوشی منتقل و نصب کن (Allow unknown sources).
