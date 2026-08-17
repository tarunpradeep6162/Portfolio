# Tarun Consulting Mobile App

React Native mobile application for iOS and Android providing consultants and clients with consultation booking, project tracking, and communication features.

## Features

### Authentication & User Management
- Email/password authentication
- OAuth integration support (GitHub, Google)
- Profile management
- Session persistence

### Consultations
- View upcoming consultations
- Book new consultations
- Cancel consultations
- Join video meetings
- Add consultation notes

### Projects
- Track active projects
- View project details
- Monitor progress and budgets
- Access project deliverables

### Dashboard & Analytics
- Personalized home screen
- Quick access to recent items
- Performance metrics
- Consultation history

## Tech Stack

- **Framework**: React Native 0.73
- **Navigation**: React Navigation
- **State Management**: Zustand
- **API Client**: Axios
- **Storage**: AsyncStorage
- **Payments**: Stripe React Native SDK
- **Date Handling**: date-fns
- **Language**: TypeScript

## Project Structure

```
mobile/
├── App.tsx                 # Main app component
├── screens/               # Screen components
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── ConsultationsScreen.tsx
│   ├── BookingScreen.tsx
│   ├── ProjectsScreen.tsx
│   └── ProfileScreen.tsx
├── stores/               # Zustand state management
│   ├── authStore.ts
│   ├── consultationStore.ts
│   └── projectStore.ts
├── utils/               # Utility functions
├── services/            # API services
└── package.json
```

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Android setup (no additional setup needed if Android Studio is configured)
```

## Development

### Run on iOS
```bash
npm run ios
```

### Run on Android
```bash
npm run android
```

### Start Metro Bundler
```bash
npm start
```

## Building for Production

### iOS
```bash
npm run build:ios
```

### Android
```bash
npm run build:android
```

## API Endpoints

The app connects to the main web application API:

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `PATCH /api/users/profile` - Update profile

### Consultations
- `GET /api/consultations` - List consultations
- `POST /api/consultations` - Book consultation
- `POST /api/consultations/:id/cancel` - Cancel consultation
- `POST /api/consultations/:id/notes` - Add consultation notes

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details

## Offline Capability

The app supports offline functionality through:
- AsyncStorage for local data caching
- Automatic sync when connection is restored
- Offline mode indicator

## Security

- JWT token storage in secure storage
- SSL pinning for API communication
- OAuth2 for third-party authentication
- Automatic token refresh

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type checking
npm run typecheck
```

## Environment Variables

Create a `.env` file in the mobile directory:

```env
API_BASE_URL=http://localhost:3000
STRIPE_PUBLIC_KEY=your_stripe_key
```

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache
npm start -- --reset-cache
```

### Dependency Issues
```bash
# Clear node_modules
rm -rf node_modules
npm install
```

### iOS Build Issues
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

## Performance Optimization

- Code splitting for faster app load
- Image optimization
- Lazy loading of screens
- Efficient state management with Zustand
- Memoization of components

## Analytics & Monitoring

- Event tracking integration
- Crash reporting
- Performance monitoring
- User behavior analytics

## Future Enhancements

- Biometric authentication
- Push notifications
- Video conferencing integration
- Offline-first data synchronization
- PWA version for web
- Dark mode support

## License

Copyright © 2024 Tarun Pradeep Consulting. All rights reserved.

## Support

For issues or feature requests, contact support@tarunpradeep.com
