# MyLeetPlan

A comprehensive, personalized LeetCode practice dashboard with intelligent problem recommendations, spaced repetition system, and progress tracking. Built with React, Node.js, Express, and MongoDB. Built for personal use.

## 🎯 Overview

MyLeetPlan helps you maintain a consistent LeetCode problem-solving routine through:
- **Spaced Repetition**: 3-day review cycle for better retention
- **Smart Recommendations**: AI-enhanced problem suggestions based on your progress
- **Customizable Practice Plan**: Flexible weekly schedule tailored to your needs
- **Progress Tracking**: Visual calendar, statistics, and streak tracking
- **Backlog Management**: Never lose track of missed problems

## ✨ Key Features

### 🎓 Learning System
- **Anchor Problems**: Add 2 new problems daily from today's topic
- **Repetition Problems**: Automatically review problems from 3 days ago
- **Backlog**: Track and complete missed repetition problems
- **Customizable Practice Plan**: Set your own weekly anchor and repetition topics

### 🤖 Smart Recommendations
- **Curated Problem List**: 96 carefully selected problems with prerequisites and learning order
- **AI-Enhanced Reasoning**: Groq Cloud AI provides personalized explanations for problem recommendations
- **Prerequisite Tracking**: System ensures you solve problems in the correct order
- **Topic-Based Suggestions**: Prioritizes problems from today's anchor topic

### 📊 Progress Tracking
- **LeetCode-Style Calendar**: Visual heatmap showing your daily activity
- **Statistics Dashboard**: Comprehensive stats including:
  - Total problems solved
  - Completion rate by difficulty and topic
  - Current streak
  - Weekly progress
- **Quick Stats Sidebar**: At-a-glance view of today's progress and key metrics

### 🎨 User Experience
- **Dark Theme**: LeetCode-inspired dark theme with multiple gray shades
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Instant UI updates when marking problems complete
- **Smart Topic Detection**: Prevents duplicate topics with fuzzy matching
- **Auto-fetch Problem Details**: Automatically retrieves problem titles, slugs, and difficulty from LeetCode

### 🔍 Problem Management
- **All Problems View**: Browse all problems with advanced filtering:
  - Filter by completion status
  - Filter by topic (only shows topics with solved problems)
  - Filter by type (all problems or repeated problems only)
  - Search by problem number, title, topic, or notes
- **Problem Details**: Each problem includes:
  - Difficulty level (Easy/Medium/Hard)
  - Custom notes
  - Solve count (tracks how many times solved)
  - Direct links to LeetCode
- **Edit & Delete**: Full CRUD operations on all problems

### 📅 Calendar & Navigation
- **Interactive Calendar**: Click any date to jump to problems from that day
- **Date Navigation**: Seamless navigation between daily view and all problems
- **Live Clock**: Real-time clock in the navbar (12-hour format)

### 💡 Smart Features
- **Daily Motivation**: Personalized motivational messages
- **Quick Tips**: Topic-specific study tips based on today's anchor topic
- **Duplicate Detection**: Prevents adding the same problem multiple times (tracks solve count instead)
- **Custom Topics**: Add your own topics beyond the standard list

## 📋 Supported Topics

- Arrays & Hashing
- Two Pointers
- Sliding Window
- Binary Search
- Stacks
- Trees (Basics)
- Linked Lists
- Recursion
- Backtracking
- DFS
- Graphs
- Strings
- Heaps (Priority Queue)
- Greedy
- Custom Topics (user-defined)

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v20.19.0 or higher recommended)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn
- Groq Cloud API key (optional, for AI-enhanced recommendations)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your configuration:**
   ```env
   MONGODB_URI=your_mongodb_connection_string_here
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   GROQ_API_KEY=your_groq_api_key_here
   ```
   
   **Note:** Get your MongoDB connection string from MongoDB Atlas dashboard. The format should be: `mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority`
   
   **Groq API Key:** Sign up at [Groq Cloud](https://console.groq.com/) to get a free API key for AI-enhanced recommendations. The system will fall back to basic recommendations if the API key is not provided.

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Create `.env` file (optional, defaults to localhost:5000):**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` if your backend is on a different URL:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
Daily Dashboard/
├── backend/
│   ├── data/
│   │   └── curatedProblems.json    # Curated list of 96 problems
│   ├── models/
│   │   ├── Problem.js              # MongoDB schema for problems
│   │   └── PracticePlan.js         # MongoDB schema for practice plan
│   ├── routes/
│   │   ├── problems.js             # API routes for problem CRUD
│   │   ├── daily.js                # API routes for daily dashboard
│   │   ├── stats.js                # API routes for statistics and calendar
│   │   ├── leetcode.js             # API routes for LeetCode problem fetching
│   │   ├── practicePlan.js         # API routes for practice plan management
│   │   └── recommendations.js      # API routes for smart recommendations
│   ├── utils/
│   │   ├── dayUtils.js             # Day/topic mapping utilities
│   │   └── recommendations.js      # Recommendation logic (AI + basic)
│   ├── server.js                   # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx           # Main dashboard component
│   │   │   ├── TodayProblems.jsx       # Problems added today section
│   │   │   ├── RepetitionSection.jsx   # Review problems section
│   │   │   ├── BacklogSection.jsx      # Missed problems section
│   │   │   ├── AllProblems.jsx         # All problems view with filters
│   │   │   ├── ProblemItemEnhanced.jsx # Individual problem display/edit
│   │   │   ├── AnchorSection.jsx       # Add new problems form
│   │   │   ├── ProblemRecommendations.jsx # Smart recommendations
│   │   │   ├── PracticePlan.jsx        # Customizable practice plan
│   │   │   ├── Statistics.jsx          # Statistics dashboard
│   │   │   ├── ProgressCalendar.jsx    # LeetCode-style calendar
│   │   │   ├── QuickStats.jsx          # Quick stats sidebar
│   │   │   ├── DailyMotivation.jsx     # Daily motivation messages
│   │   │   ├── QuickTips.jsx           # Topic-specific tips
│   │   │   └── NotFound404.jsx         # 404 error page
│   │   ├── services/
│   │   │   └── api.js              # API service functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🗄️ Database Schema

### Problem Model
```javascript
{
  problemNumber: String,        // LeetCode problem number (e.g., "704")
  problemSlug: String,          // LeetCode problem slug (e.g., "binary-search")
  problemTitle: String,         // LeetCode problem title (e.g., "Binary Search")
  topic: String,                // Problem topic (standard or custom)
  difficulty: String,           // "Easy", "Medium", or "Hard"
  notes: String,                // User's custom notes
  addedDate: Date,              // When the problem was first added
  repetitionDate: Date,         // When it should be reviewed
  isCompleted: Boolean,         // Whether it's been completed
  completedDate: Date,          // When it was marked complete
  type: String,                 // "anchor" or "repetition"
  solveCount: Number            // How many times this problem has been solved
}
```

### PracticePlan Model
```javascript
{
  dayOfWeek: Number,            // 0 (Sunday) to 6 (Saturday)
  anchorTopic: String,          // Topic for new problems on this day
  repetitionTopic: String       // Topic for repetition on this day
}
```

## 🔌 API Endpoints

### Daily Dashboard
- **GET `/api/daily/dashboard`**
  - Returns today's dashboard data including:
    - Today's date
    - Anchor topic
    - Repetition topic
    - Problems added today count
    - Problems solved today count
    - List of repetition problems due today
    - Backlog of missed repetition problems

### Problems
- **GET `/api/problems`**
  - Get all problems with optional filters:
    - `?completed=true/false` - Filter by completion status
    - `?topic=TopicName` - Filter by topic
  - Returns array of all problems

- **POST `/api/problems`**
  - Add new problem(s)
  - Body: `{ problemNumbers: ["704"], topic: "Binary Search", difficulty: "Easy", notes: "...", problemSlug: "...", problemTitle: "..." }`
  - Automatically handles duplicates (increments solve count)

- **GET `/api/problems/:id`**
  - Get single problem by ID

- **PUT `/api/problems/:id`**
  - Update problem details

- **PATCH `/api/problems/:id/complete`**
  - Mark problem as completed
  - Increments solve count if not already completed

- **PATCH `/api/problems/:id/uncomplete`**
  - Unmark problem as completed

- **DELETE `/api/problems/:id`**
  - Delete a problem

- **GET `/api/problems/topics`**
  - Get all unique topics from solved problems

### Statistics
- **GET `/api/stats`**
  - Returns comprehensive statistics:
    - Overview (total, completed, pending, completion rate)
    - Problems by difficulty
    - Problems by topic
    - Daily completions (last 30 days)
    - Current streak
    - This week's problems count
    - Problems solved today count

- **GET `/api/stats/calendar`**
  - Returns calendar data for last 365 days
  - Includes problem counts per day

### Practice Plan
- **GET `/api/practice-plan`**
  - Get all practice plan entries

- **POST `/api/practice-plan`**
  - Create new practice plan entry
  - Body: `{ dayOfWeek: 0, anchorTopic: "Arrays & Hashing", repetitionTopic: "Binary Search" }`

- **PUT `/api/practice-plan/:id`**
  - Update practice plan entry

- **DELETE `/api/practice-plan/:id`**
  - Delete practice plan entry

- **POST `/api/practice-plan/initialize`**
  - Initialize default practice plan (7 days)

### Recommendations
- **GET `/api/recommendations`**
  - Get smart problem recommendations
  - Returns:
    - Recommended problem pair (or single problem)
    - AI-enhanced reasoning (if Groq API available)
    - Progress (X/96 solved)
    - Source information

### LeetCode Integration
- **GET `/api/leetcode/:problemNumber`**
  - Fetch problem details from LeetCode
  - Returns: `{ success: true, slug: "...", title: "...", difficulty: "..." }`

## 🎨 UI Components

### Main Dashboard
- **Navbar**: Website name, navigation tabs, live clock, and date display
- **Left Sidebar**: Quick stats including today's summary, streak, weekly progress, and top topics
- **Main Content**: Dynamic content based on selected tab
- **Right Sidebar**: Calendar, daily motivation, and quick tips

### Daily View
- **Problem Recommendations**: AI-enhanced problem suggestions
- **Repetition Section**: Problems due for review today
- **Today's Problems**: Problems added today with add form
- **Backlog Section**: Missed repetition problems

### All Problems View
- **Today's Overview**: Quick summary with links to sections
- **Search Bar**: Real-time search across all problems
- **Filters**: Status, type (repeated/all), and topic filters
- **Grouped Display**: Problems grouped by date with scroll-to-date navigation

### Statistics View
- **Overview Cards**: Total, completed, pending, completion rate
- **Streak & Weekly Progress**: Visual progress indicators
- **By Difficulty**: Breakdown with progress bars
- **By Topic**: Comprehensive topic statistics

### Practice Plan View
- **Editable Table**: Weekly schedule with anchor and repetition topics
- **Add/Edit/Delete**: Full CRUD operations
- **Today Highlighting**: Current day highlighted in blue

## 🔄 Workflow

### Daily Routine
1. **View Recommendations**: Check today's recommended problems (from curated list)
2. **Add New Problems**: Add problems for today's anchor topic
3. **Review Repetitions**: Complete problems from 3 days ago
4. **Clear Backlog**: Work on any missed repetition problems when time permits

### Problem Lifecycle
1. **Add Problem**: Problem is added with `type: 'anchor'` and `repetitionDate` set to 3 days later
2. **Complete Problem**: Mark as complete, increments `solveCount`
3. **Repetition Day**: Problem appears in repetition section (if not completed)
4. **Missed Repetition**: If not completed on repetition day, moves to backlog
5. **Backlog Completion**: Complete backlog problems anytime

## 🎯 Smart Features Explained

### Spaced Repetition Logic
- Problems are scheduled for repetition exactly 3 days after being added
- The repetition date is calculated based on your customizable practice plan
- If a problem is not completed on its repetition day, it moves to backlog
- Backlog problems persist until completed

### Recommendation System
- **Curated List**: 96 problems with prerequisites and learning order
- **Prerequisite Checking**: Only recommends problems whose prerequisites are solved
- **Topic Prioritization**: Prioritizes problems from today's anchor topic
- **AI Enhancement**: Uses Groq Cloud AI to provide personalized reasoning
- **Fallback**: Basic recommendations if AI is unavailable

### Duplicate Handling
- If you add a problem that already exists, the system:
  - Increments the `solveCount` instead of creating a duplicate
  - Creates a new entry for tracking (for repetition purposes)
  - Syncs solve count across all entries for the same problem

## 🔧 Configuration

### Environment Variables

**Backend (`.env`):**
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)
- `GROQ_API_KEY`: Groq Cloud API key for AI recommendations (optional)

**Frontend (`.env`):**
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your connection string in `.env`
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your MongoDB Atlas cluster is running
- Verify database name matches in connection string

### CORS Errors
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that both servers are running
- Verify no typos in URLs

### Port Already in Use
- Change the `PORT` in backend `.env`
- Update `VITE_API_URL` in frontend `.env` accordingly
- Kill any processes using the ports

### Groq API Issues
- Verify your API key is correct
- Check Groq Cloud console for API limits
- System will fall back to basic recommendations if API fails
- Ensure you have internet connection for API calls

### Problem Not Fetching from LeetCode
- Check internet connection
- Verify problem number is correct
- Some problems may not be available via the API
- You can manually enter problem details

## 📝 Notes

- **Solve Count**: Tracks how many times you've solved each problem across all entries
- **Custom Topics**: Automatically added to topic lists when created
- **Smart Topic Detection**: Warns if a similar topic already exists (case-insensitive)
- **Date Handling**: All dates are stored in UTC but displayed in local timezone
- **Calendar**: Shows activity for last 365 days with color-coded intensity

## 🚀 Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Ensure MongoDB Atlas allows connections from your server IP
3. Deploy to platforms like Heroku, Railway, Render, or Vercel

### Frontend Deployment
1. Update `VITE_API_URL` to point to your deployed backend
2. Build the project: `npm run build`
3. Deploy `dist` folder to platforms like Vercel, Netlify, or GitHub Pages

## 📄 License

ISC

## 🙏 Acknowledgments

- LeetCode for problem data structure inspiration
- Groq Cloud for AI-powered recommendations
- React and Tailwind CSS communities
