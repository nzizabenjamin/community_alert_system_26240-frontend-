# Community Action System (CAS) - Frontend

A React-based web application for managing community issues and reports. This system allows residents to report issues in their area and administrators to manage, track, and resolve them.

## Features

### Authentication & Security
- **Two-Factor Authentication (2FA)** - Secure login with email-based OTP verification
- **Password Reset** - Email-based password recovery system
- **Role-Based Access Control** - Separate interfaces for ADMIN and RESIDENT roles
- **User Registration** - Sign up with location-based registration

### Core Functionality
- **Dashboard** - Business information summary with key metrics and charts
- **Issue Management** - Create, view, update, and track community issues
- **User Management** (Admin only) - Manage user accounts and permissions
- **Location Management** - Hierarchical location selector for Rwanda's administrative structure (Province → District → Sector → Cell → Village)
- **Tag Management** (Admin only) - Create and manage tags for categorizing issues
- **Notifications** - View and manage system notifications

### Search & Navigation
- **Global Search** - Search across issues, users, locations, tags, and notifications
- **Table Search** - Filter table data by any column value
- **Pagination** - Efficient data pagination for large datasets

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Chart library for data visualization

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── common/       # Common components (Button, Card, Modal, etc.)
│   ├── features/     # Feature-specific components (IssueForm, LocationSelector)
│   └── layout/       # Layout components (Sidebar, TopBar, Footer)
├── pages/            # Page components
│   ├── auth/         # Authentication pages (Login, SignUp, etc.)
│   └── ...           # Main application pages
├── services/         # API service layer
├── context/          # React Context providers (AuthContext)
├── hooks/            # Custom React hooks
└── utils/            # Utility functions and constants
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cas
```

2. Install dependencies
```bash
npm install
```

3. Configure API endpoint
Update the API base URL in `src/services/api.js` to point to your backend server.

4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## User Roles

### ADMIN
- Full access to all features
- User management
- Tag management
- Issue status updates
- View all locations and issues

### RESIDENT
- Report new issues
- View own issues
- View own location details
- Select tags when creating issues
- View notifications

## Key Features Implementation

### Location Selector
The application uses a cascading location selector that follows Rwanda's administrative hierarchy. See `FRONTEND_LOCATION_SELECTOR_GUIDE.md` for implementation details.

### Tag System
Tags help categorize and filter issues. Admins can create and manage tags, while residents can select from active tags. See `TAG_LOGIC_IMPLEMENTATION.md` for details.

## Backend Integration

This frontend application requires a backend API. Ensure your backend provides the following endpoints:
- Authentication endpoints (`/auth/*`)
- Issue management (`/issues/*`)
- User management (`/users/*`)
- Location management (`/locations/*`)
- Tag management (`/tags/*`)
- Notification endpoints (`/notifications/*`)
- Search endpoints (`/search/*`)

## License

This project is part of a Web Technology course assignment.
