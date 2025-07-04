# Veterinary Dictionary Admin Panel

## Overview

This is a full-stack web application built as an admin panel for managing a veterinary dictionary mobile app. The system provides a comprehensive interface for managing veterinary content including books, medical terms, diseases, drugs, tutorial videos, staff information, and user interactions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter (lightweight React router)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Firebase Storage for images and PDFs
- **Authentication**: Firebase Admin SDK

## Key Components

### Database Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` - contains all type definitions and validation schemas
- **Migration System**: Database migrations stored in `./migrations` directory
- **Provider**: Neon Database (PostgreSQL-compatible serverless database)

### Data Collections
The system manages 11 distinct data collections:
- **Books**: Veterinary textbooks and publications with PDF storage
- **Words**: Dictionary terms in English, Kurdish, and Arabic
- **Diseases**: Animal diseases with symptoms, causes, and treatments
- **Drugs**: Veterinary medications with usage and side effects
- **Tutorial Videos**: Educational YouTube videos
- **Staff**: Team member profiles with social media links
- **Questions**: User-submitted questions with likes system
- **Notifications**: Push notifications for mobile app
- **Users**: User profiles with point system
- **Normal Ranges**: Laboratory reference values for different species
- **App Links**: Download links for mobile applications

### File Management
- **Storage**: Firebase Storage for images and PDFs
- **Upload System**: Drag-and-drop file upload with progress tracking
- **File Types**: Supports images (covers, photos) and PDFs (books, documents)
- **Preview**: Image preview functionality for uploaded files

## Data Flow

1. **Client Requests**: Frontend makes API calls through React Query
2. **API Layer**: Express.js routes handle CRUD operations
3. **Data Validation**: Zod schemas validate incoming data
4. **Database Operations**: Drizzle ORM manages PostgreSQL interactions
5. **File Operations**: Firebase Storage handles file uploads/downloads
6. **Response**: JSON responses sent back to client
7. **State Updates**: React Query updates client-side cache

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **firebase-admin**: Server-side Firebase integration
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-dropzone**: File upload functionality

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking
- **esbuild**: Server-side bundling

## Deployment Strategy

### Development Mode
```bash
npm run dev  # Starts development server with hot reload
```

### Production Build
```bash
npm run build  # Builds client and server for production
npm start     # Starts production server
```

### Database Management
```bash
npm run db:push  # Push schema changes to database
```

The application is designed to be deployed on platforms that support Node.js with PostgreSQL database connectivity. The build process creates optimized bundles for both client and server code.

## Current Issues & Status

### Firebase Connection Issue
**Status:** Firebase credentials configured but connection failing during operations
**Error:** Private key decoding issue ("error:1E08010C:DECODER routines::unsupported")
**Current Solution:** Hybrid storage system with automatic fallback to JSON data
**Impact:** New data saves to local storage instead of Firebase database

### Workaround Active
The system currently uses a hybrid approach:
1. Attempts Firebase connection first
2. Falls back to local JSON data if Firebase fails
3. All CRUD operations work normally using your original data
4. Firebase can be re-enabled when credentials are resolved

## Recent Changes

```
Recent Changes:
- July 04, 2025: Fixed SelectItem component value prop errors
- July 04, 2025: Implemented hybrid storage with Firebase fallback
- July 04, 2025: Added comprehensive error handling and logging
- July 04, 2025: Application fully functional with fallback data storage
```

## Next Steps for Firebase Connection

To connect to your live Firebase database:
1. Verify Firebase private key format in your Firebase Console
2. Regenerate service account key if needed
3. Test connection will be re-enabled automatically when credentials work
4. Data can be migrated from fallback to Firebase once connected

## Changelog

```
Changelog:
- July 04, 2025. Initial setup with comprehensive veterinary database management system
- July 04, 2025. Implemented Firebase integration with fallback storage for reliability
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```