# Expense Tracker Application Specification

## Project Overview
- **Project Name**: Expense Tracker
- **Type**: Fullstack Web Application
- **Core Functionality**: An expense tracking application with authentication, allowing users to add/delete expenses and view monthly analytics
- **Target Users**: Individuals who want to track their personal expenses

## Technology Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (file-based, no external DB required)
- **Authentication**: JWT-based with bcrypt password hashing

## UI/UX Specification

### Layout Structure
- **Header**: Fixed top navigation with app title and auth controls
- **Main Content**: Full-width container with responsive padding
- **Pages**: Login/Register, Dashboard (Expense List + Add Form), Analytics

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Visual Design

#### Color Palette
- **Background**: #0f0f0f (near black)
- **Surface**: #1a1a1a (dark gray)
- **Surface Elevated**: #262626 (lighter dark gray)
- **Primary**: #10b981 (emerald green)
- **Primary Hover**: #059669
- **Accent**: #f59e0b (amber)
- **Danger**: #ef4444 (red)
- **Text Primary**: #f5f5f5 (off-white)
- **Text Secondary**: #a3a3a3 (gray)
- **Border**: #404040

#### Typography
- **Font Family**: "Outfit" for headings, "DM Sans" for body (Google Fonts)
- **Headings**: 
  - H1: 2.5rem/700
  - H2: 1.75rem/600
  - H3: 1.25rem/600
- **Body**: 1rem/400
- **Small**: 0.875rem/400

#### Spacing System
- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 24px, 32px, 48px

#### Visual Effects
- Card shadows: 0 4px 6px -1px rgba(0, 0, 0, 0.3)
- Hover transitions: 150ms ease
- Border radius: 8px for cards, 6px for buttons, 4px for inputs

### Components

#### Navigation Bar
- App logo/title on left
- User info + logout button on right (when authenticated)
- Height: 64px
- Background: Surface color with bottom border

#### Auth Forms (Login/Register)
- Centered card on page
- Input fields: email, password (register adds username)
- Submit button full-width
- Link to switch between login/register
- Validation errors displayed below inputs

#### Expense List
- Card component for each expense
- Shows: title, amount, category, date
- Delete button with trash icon
- Empty state message when no expenses

#### Add Expense Form
- Inline form with inputs
- Fields: title, amount, category (dropdown), date
- Categories: Food, Transport, Shopping, Bills, Entertainment, Health, Other
- Submit button

#### Analytics Charts
- Monthly bar chart showing expense totals
- Category breakdown pie chart
- Monthly comparison cards

## Functionality Specification

### Authentication
- User registration with username, email, password
- User login with email/password
- JWT token stored in localStorage
- Protected routes requiring authentication
- Logout clears token and redirects to login

### Expense Management
- Add new expense (title, amount, category, date)
- View all expenses for current month
- Delete expense
- Expenses persisted in SQLite database

### Monthly Analytics
- Current month total
- Previous month total with comparison
- Category breakdown
- Monthly trend bar chart (last 6 months)

### API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/expenses (with month/year query)
- POST /api/expenses
- DELETE /api/expenses/:id
- GET /api/analytics/:year/:month

## Acceptance Criteria

### Authentication
- [ ] User can register with username, email, password
- [ ] User can login with email/password
- [ ] Invalid credentials show error message
- [ ] Logged in user sees their username
- [ ] Logout returns to login page

### Expenses
- [ ] User can add expense with all required fields
- [ ] Expenses appear in list after adding
- [ ] User can delete any expense
- [ ] Deleted expense disappears from list

### Analytics
- [ ] Monthly total displayed correctly
- [ ] Category breakdown shows accurate percentages
- [ ] Charts render without errors

### Visual
- [ ] Dark theme applied consistently
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states shown during async operations