# About

Let's Move Now is a MERN-based web and mobile application allowing users to list and browse apartments for rent or sublet at any university in the country. Users can create an account, browse available listings, create their own listings, and filter listings by location, price, and more. Users can also directly message listers to get more info on a listing, or proceed with renting out the apartment.

# Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Node.js, Express, Socket.io (Real-time chat).
- **Mobile:** Flutter (iOS/Android).
- **Database:** MongoDB Atlas (Primary), Redis (Cache/Rate Limiting).
- **Services:** Cloudinary (Images), SendGrid (Email), Resend (Email).

## Development Setup

### Installation

in `root` do `npm run install-all`

### Create .env files

In `client/.env`
```
API_URL=http://localhost:5000
```

In `/server/.env`
```
MONGO_URI=mongodb://localhost:27017/LargeProject
PORT=5000
```

### Flutter SDK Installation

Download the [Flutter SDK](https://docs.flutter.dev/get-started/install/).

## License
Licensed under the MIT License.
