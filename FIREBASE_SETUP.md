# 🔥 Firebase & Google Sign-In Setup Guide for Zesto

> **User Email:** `anaypalimkar@gmail.com`  
> **Compatibility:** Full Expo Go & Development Build Support  
> **Safety:** Retains instant 1-tap Email Login (`Anay Palimkar / anaypalimkar@gmail.com`) for guaranteed offline & viva presentation safety.

---

## 1. Firebase Console Setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and sign in with `anaypalimkar@gmail.com`.
2. Click **Add Project**, name it **`Zesto-Food-Delivery`**, and click Continue.
3. In the left sidebar, navigate to **Build** -> **Authentication**.
4. Click **Get Started**, select **Google** under Additional Providers, and enable it.
5. Set the project support email to `anaypalimkar@gmail.com`.
6. Save your settings.

---

## 2. Obtain Web Client ID

1. In the Google provider settings, expand **Web SDK configuration**.
2. Copy the **Web Client ID** (format: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`).
3. Under **Authorized Domains**, ensure `localhost` and `auth.expo.io` are added.

---

## 3. How to Obtain Android SHA-1 Fingerprint on Windows

To run Google Sign-In inside an Android native development build or emulator:
Open PowerShell on your Windows machine and execute:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Look for the line:
```
Certificate fingerprints:
     SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```
Copy this SHA-1 into Firebase Project Settings -> **Your apps** -> **Add Android App** (`com.anay.zesto`).

---

## 4. Production Viva Recommendation

> 💡 **Viva Tip:** During your college presentation, external Google OAuth authentication flows can hang or fail due to college proxy / captive portal network restrictions.  
> Zesto's login screen contains **both**:
> 1. The **Google Sign-In button** configured for Firebase.
> 2. The **pre-filled 1-tap Anay Palimkar login** which authenticates directly through your pure Java backend's `POST /login` and `CustomerService`.
> 
> Always use the pre-filled Anay Palimkar login during your viva to show real Java customer state persistence and loyalty points tracking with 100% offline reliability.
