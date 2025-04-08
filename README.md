
# myStrath Resource Sharing Platform

A gamified resource sharing platform for Strathmore University students.

## Project Overview

myStrath is a web application that allows students to:

- Access, upload, and download course resources (assignments, notes, past papers)
- Comment on resources for collaborative learning
- Track their progress and earn points through various activities
- Gain ranks based on points earned
- View class rankings based on assignment completion times

## Technology Stack

- Frontend: React with TypeScript, Tailwind CSS, Shadcn UI
- Backend: Supabase (PostgreSQL database, authentication, storage)
- Hosting: Render

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=https://zsddctqjnymmtzxbrkvk.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZGRjdHFqbnltbXR6eGJya3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzc5OTAsImV4cCI6MjA1OTcxMzk5MH0.cz8akzHOmeAyfH5ma4H13vgahGqvzzBBmsvEqVYAtgY
     ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Build for production:
   ```
   npm run build
   ```

### Database Setup

1. Set up a Supabase project
2. Run the SQL script in `database_schema.sql` to create all tables and policies
3. The script includes sample data for testing, including:
   - Programs, courses, years, semesters, and groups
   - Class instances with associated units
   - User accounts (with default password "stratizens#web")

## Features

### Authentication
- Login with admission number and password
- Password reset functionality with secret key

### Dashboard
- Overview of personal stats (points, rank, completion rates, etc.)
- Recent activity
- Top performers leaderboard
- Announcements from administrators

### Units
- Assignments section with upload and download capabilities
- Notes section for sharing lecture materials
- Past Papers section for exam preparation
- Rankings to track performance against classmates

### Profile
- Personal information
- Password and secret key management
- Profile picture customization

## Points System

Users earn points through various activities:
- Daily login: 1 point
- Active session: 1 point per minute
- Uploading notes: 50 points
- Uploading assignments: 10 points
- Uploading past papers: 20 points
- Making comments: 1 point
- Completing assignments: Up to 20 points (based on completion time)
- Overdue assignments: -50 points

## Rank System

Users progress through ranks based on accumulated points:
- Freshman Scholar (0-99 points)
- Knowledge Seeker (100-299 points)
- Dedicated Learner (300-599 points)
- Resource Ranger (600-999 points)
- Academic Achiever (1000-1499 points)
- Knowledge Champion (1500-2199 points)
- Resource Virtuoso (2200-2999 points)
- Campus Maven (3000-3999 points)
- Educational Elite (4000-5499 points)
- Stratizen Legend (5500+ points)

## User Roles

- Regular Students: Access to their specific class resources
- Class Admins: Additional management capabilities for their class
- Super Admin: Global access to all classes and management features

## Deployment

The application can be deployed to Render or any other hosting service that supports Node.js applications.

## License

This project is proprietary and not licensed for public use without permission.
