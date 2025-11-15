# Dopamine Menu Maker

## Overview

This is a full-stack TypeScript application designed to help people with ADHD create and manage "dopamine menus" - categorized lists of activities that can provide motivation and dopamine stimulation. The application follows a restaurant menu metaphor with categories like appetizers (quick activities), entrees (main activities), sides (background activities), desserts (indulgent activities), and specials (rare treats).

## Recent Changes

- **January 17, 2025**: Removed all preset activities and made onboarding mandatory - users now must go through setup wizard to create their first activities
- **January 17, 2025**: Fixed activity editing functionality with visible menu buttons and improved touch/right-click support  
- **January 17, 2025**: Rebuilt timer component with proper manual controls for timed activities
- **January 16, 2025**: Updated home layout to 4 squares + 1 rectangle for specials category as requested
- **January 16, 2025**: Implemented calming ADHD-friendly color scheme with soft blues, greens, and purples
- **January 16, 2025**: Moved emergency button to bottom with red outline and calming blue interior
- **January 16, 2025**: Added shuffle button next to emergency boost for different random activities
- **January 16, 2025**: Fixed zero-minute activities to always show dialog with "performing activity" message
- **January 16, 2025**: Added right-click and long-press functionality for editing activities
- **January 16, 2025**: Removed countdown timer and gave users full manual control over activity timers
- **January 16, 2025**: Enhanced visible tracking indicators with colored badges showing completion counts and last completion dates
- **January 16, 2025**: Fixed clear all activities functionality with proper foreign key constraint handling
- **January 16, 2025**: Added comprehensive activity tracking system with completion counts and last completion dates
- **January 16, 2025**: Created full activity management with edit dialog, delete functionality, and category selection
- **January 16, 2025**: Added name collection during onboarding for personalized experience with localStorage persistence
- **January 16, 2025**: Implemented page-like interface with no scrolling anywhere in the app using fixed-height containers
- **January 16, 2025**: Added mandatory onboarding that automatically redirects users without activities to setup flow
- **January 16, 2025**: Created category submenu system with random selection and add new activity options
- **January 16, 2025**: Redesigned with expert mobile UX patterns including 3-level navigation (home → category → activity)
- **January 15, 2025**: Added comprehensive onboarding engine with empathetic language and mobile-first design
- **January 15, 2025**: Implemented PostgreSQL database with persistent data storage and automatic example data initialization

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application uses a modern full-stack architecture with a clear separation between frontend and backend:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **React Components**: Modular component structure with UI components in `/client/src/components/ui/`
- **Custom Components**: Feature-specific components like `ActivityItem`, `MenuCategory`, `TimerSection`
- **Onboarding System**: Multi-step empathetic onboarding flow with progress tracking and mobile optimization
- **Styling**: Tailwind CSS with custom ADHD-friendly color variables and mobile-first responsive design
- **Forms**: React Hook Form with Zod validation
- **Type Safety**: Full TypeScript implementation with shared types

### Backend Architecture
- **Express Server**: RESTful API with proper error handling and logging
- **Storage Layer**: PostgreSQL database with Drizzle ORM for persistent data storage
- **Database**: Automatic schema migration and example data initialization
- **Validation**: Zod schemas for request validation
- **Development Tools**: Hot reloading with Vite integration

### Database Schema
The application defines three main entities:
- **Users**: Basic user authentication structure
- **Activities**: Categorized activities with name, description, duration, and category
- **Dopamine Menus**: Collections of activities that users can create and save

### UI/UX Design
- **Page-Like Interface**: Fixed-height containers with no scrolling anywhere in the app for native mobile feel
- **3-Level Navigation**: Home (category grid) → Category (activity list) → Activity (detailed view) with back button navigation
- **Modern Mobile Design**: Gradient backgrounds, glassmorphism effects, smooth transitions, and touch-friendly interactions
- **Emergency Access**: Prominent red emergency dopamine boost button for instant random activity selection
- **Category Submenu System**: Each category shows activities with random selection and add new options
- **ADHD-Friendly Design**: Custom color schemes, clear visual hierarchy, and accessible interactions
- **Component Library**: Complete shadcn/ui implementation with custom styling
- **Interactive Elements**: Timer functionality, activity management, and quick actions

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data from the API
2. **API Layer**: Express routes handle HTTP requests and validate input using Zod schemas
3. **Storage Layer**: Abstracted storage interface allows for easy database integration
4. **Response**: Data flows back through the same layers with proper error handling

The application currently uses an in-memory storage implementation but is designed to easily integrate with PostgreSQL using Drizzle ORM.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database adapter
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight React router

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Form and Validation
- **react-hook-form**: Performant form library
- **@hookform/resolvers**: Form validation resolvers
- **zod**: TypeScript-first schema validation

## Deployment Strategy

The application is configured for multiple deployment scenarios:

### Development
- **Scripts**: `npm run dev` starts both frontend and backend in development mode
- **Hot Reloading**: Vite provides instant feedback for frontend changes
- **Development Tools**: Runtime error overlay and debugging tools

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles the server code for production
- **Static Serving**: Express serves the built frontend in production

### Database Integration
- **Drizzle Configuration**: Ready for PostgreSQL connection
- **Migrations**: Drizzle Kit configured for database schema management
- **Environment Variables**: Database URL configuration for different environments

### Key Architectural Decisions

1. **Monorepo Structure**: Single repository with separate client/server/shared folders for better code organization and type sharing
2. **Shared Types**: Common TypeScript types and Zod schemas in `/shared` folder prevent API/client mismatches
3. **Abstracted Storage**: Storage interface allows switching between in-memory and database implementations without changing business logic
4. **Component-Based UI**: Modular component architecture with shadcn/ui for consistency and accessibility
5. **Type-Safe API**: End-to-end TypeScript with Zod validation ensures data integrity
6. **ADHD-Focused Design**: Custom styling and UX patterns specifically designed for neurodivergent users

The application prioritizes developer experience with hot reloading, type safety, and clear separation of concerns while maintaining a focus on accessibility and user experience for people with ADHD.