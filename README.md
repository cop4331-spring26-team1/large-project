# Rental App

A full-stack rental/sublease listing  website and application.
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