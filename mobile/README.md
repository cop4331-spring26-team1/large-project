# LetsMovNow Mobile App

Flutter mobile app for letsmovnow.com — student rental marketplace.

## Features

- **Explore** — Browse listings with search & filters (price, bedrooms, pets, utilities, university)
- **Map View** — OpenStreetMap with price pin markers, tap to preview listing
- **Saved** — Favorited listings synced with your account
- **Real-time Chat** — Socket.IO messaging with unread badge on tab
- **List Your Place** — Create listings with photo upload (up to 10 photos)
- **Authentication** — Login, register, forgot password, email verification
- **Profile** — Manage your listings and account

## Testing on iOS Simulator (Fastest Way)

```bash
# 1. Start the backend server
cd ../server && npm run dev   # runs on http://localhost:5001

# 2. Open iOS Simulator (or just run flutter run and it will open it)
open -a Simulator

# 3. Run the app
cd mobile
flutter run
```

The app is pre-configured to connect to `localhost:5001` for iOS simulator.

## Testing on Android Emulator

1. Open Android Studio → AVD Manager → Start an emulator
2. In `lib/config/api_config.dart`, change the `baseUrl` getter to use `_devBaseUrl` (uses `10.0.2.2`)
3. Run: `flutter run`

## Testing on Physical Device

For physical devices pointing to local server, use your Mac's local IP:

```dart
// lib/config/api_config.dart
static const String _devBaseUrlIOS = 'http://192.168.x.x:5001';
```

Find your IP: `ipconfig getifaddr en0`

## Production

1. Update `lib/config/api_config.dart`:
   ```dart
   static const bool _isDev = false;
   static const String _prodBaseUrl = 'https://your-api.railway.app';
   ```
2. Build:
   ```bash
   flutter build ios --release
   flutter build appbundle --release   # Google Play Store
   ```

## Project Structure

```
lib/
├── main.dart
├── app.dart                 # Router setup
├── config/
│   ├── api_config.dart      # Dev/prod URL toggle
│   └── app_theme.dart       # Brand colors & theme
├── models/                  # User, Listing, Thread, Message
├── services/
│   ├── api_service.dart     # Dio + JWT interceptor
│   ├── socket_service.dart  # Socket.IO client
│   └── storage_service.dart # Secure token storage
├── providers/               # State (AuthProvider, ListingsProvider, ChatProvider)
└── screens/
    ├── splash_screen.dart
    ├── main_shell.dart      # Bottom tab bar
    ├── auth/                # Login, Register, Forgot Password
    ├── explore/             # Listing browse + search
    ├── map/                 # Interactive map
    ├── listings/            # Detail, Create, Edit, My Listings
    ├── favorites/           # Saved listings
    ├── chat/                # Messages
    └── profile/             # User profile
```

## Backend Sync

The mobile app uses the **exact same API and database** as the web app:
- Same MongoDB Atlas database
- Same JWT authentication
- Same Socket.IO for real-time chat
- Same Cloudinary images
- Favorites and listings sync instantly between web and mobile
