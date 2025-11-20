# MyLeetPlan

A comprehensive, personalized LeetCode practice dashboard with intelligent problem recommendations, smart spaced repetition system, and progress tracking. Built with React, Node.js, Express, and MongoDB.

> **Note:** This website is made for my personal use only. I created it because I needed a personalized way to track my LeetCode progress that fits my specific learning style and practice routine.

## 🎯 Overview

MyLeetPlan helps you maintain a consistent LeetCode problem-solving routine through:
- **Smart Spaced Repetition**: Topic-aware repetition system with difficulty-based intervals and mastery tracking
- **Smart Recommendations**: AI-enhanced problem suggestions based on your progress
- **Customizable Practice Plan**: Flexible weekly schedule tailored to your needs
- **Progress Tracking**: Visual calendar, statistics, and streak tracking
- **Backlog Management**: Never lose track of missed problems

## ✨ Key Features

### 🎓 Smart Spaced Repetition System

The system uses an intelligent spaced repetition algorithm that adapts to your performance:

- **Topic-Aware Scheduling**: Repetitions are scheduled based on your weekly practice plan, ensuring you review problems when their topic is scheduled
- **Difficulty-Based Intervals**: 
  - Easy problems: +25% longer intervals
  - Medium problems: Standard intervals
  - Hard problems: -25% shorter intervals
- **Mastery Levels**: Problems progress through four levels:
  - **New**: Just added, not yet reviewed
  - **Learning**: Being actively reviewed
  - **Reviewing**: Well-practiced, longer intervals
  - **Mastered**: Fully mastered, longest intervals
- **Priority-Based Selection**: Daily repetitions are selected based on:
  - Urgency (days overdue)
  - Mastery level
  - Solve count
  - Last review date
- **Daily Limits**: Maximum 4-5 repetition problems per day to maintain focus
- **Even Distribution**: Excess problems are evenly distributed across future topic days
- **Performance Tracking**: Tracks streak count, failed count, and solve count for each problem

**How It Works:**
1. When you add a problem, it's marked as an "anchor" problem
2. The system calculates the next repetition date based on difficulty and solve count
3. The repetition is scheduled for the next day when that topic appears in your practice plan
4. Up to 5 problems are selected daily based on priority
5. When you complete a repetition, the system recalculates intervals and mastery level
6. Problems that aren't selected are automatically rescheduled to future topic days

### 🎯 Anchor Problems
- Add 2 new problems daily from today's anchor topic
- Each problem tracks its own solve count, mastery level, and repetition schedule
- Problems maintain their original completion date for historical accuracy

### 🔄 Repetition Problems
- Automatically created when anchor problems are due for review
- Separate entries from anchor problems to preserve historical data
- Tracked independently with their own completion dates
- Limited to 4-5 problems per day for optimal learning

### 📋 Backlog Management
- Tracks missed repetition problems (past due and incomplete)
- Grouped by topic for easy organization
- Automatically redistributed to future topic days when possible
- Can be completed anytime to clear the backlog

### 🤖 Smart Recommendations
- **Curated Problem List**: 96 carefully selected problems with prerequisites and learning order
- **AI-Enhanced Reasoning**: Groq Cloud AI provides personalized explanations for problem recommendations
- **Prerequisite Tracking**: System ensures you solve problems in the correct order
- **Topic-Based Suggestions**: Prioritizes problems from today's anchor topic
- **Progress Tracking**: Shows X/96 problems solved from the curated list

### 📊 Progress Tracking

#### LeetCode-Style Calendar
- Visual heatmap showing your daily activity for the last 365 days
- Color-coded intensity based on problems solved per day
- Click any date to jump to problems from that day
- Shows anchor completions, repetition completions, and problems added

#### Statistics Dashboard
- **Overview**: Total problems, completed, pending, and completion rate
- **Streak Tracking**: Current consecutive days of solving (shows streak even if nothing solved today)
- **Weekly Progress**: Problems solved this week (Monday to Sunday)
- **By Difficulty**: Breakdown with progress bars for Easy, Medium, and Hard
- **By Topic**: Comprehensive statistics for each topic including:
  - Total problems
  - Completed count
  - Completion rate
  - Progress bars

#### Quick Stats Sidebar
- Today's summary (added, solved, remaining)
- Current streak
- Weekly progress
- Top topics by completion

### 🎨 User Experience

#### Responsive Design
- Fully responsive layout optimized for desktop, tablet, and mobile (≤425px)
- Compact UI elements on mobile devices
- Touch-friendly buttons and interactions
- Optimized spacing and typography for small screens

#### Dark Theme
- LeetCode-inspired dark theme with multiple gray shades
- Consistent color scheme throughout
- Easy on the eyes for long coding sessions

#### Real-time Updates
- Instant UI updates when marking problems complete
- Auto-refresh for problem lists (pauses during editing)
- Synchronized state across all components
- Optimized with caching for better performance

#### Smart Features
- **Auto-fetch Problem Details**: Automatically retrieves problem titles, slugs, and difficulty from LeetCode
- **Smart Topic Detection**: Prevents duplicate topics with fuzzy matching
- **Duplicate Handling**: Increments solve count instead of creating duplicates
- **Completion Date Locking**: Prevents changing completion status for past days
- **Custom Topics**: Add your own topics beyond the standard list

### 🔍 Problem Management

#### All Problems View
- Browse all problems with advanced filtering:
  - Filter by completion status (all, completed, pending)
  - Filter by type (all problems or repetition problems only)
  - Filter by topic (only shows topics with solved problems)
  - Search by problem number, title, topic, or notes
- **Grouped Display**: Problems grouped by date (anchor problems by added date, repetition problems by repetition date)
- **Scroll-to-Date Navigation**: Quick navigation to specific dates
- **Today's Overview**: Quick summary card with links to daily sections

#### Problem Details
Each problem includes:
- Problem number and title with direct LeetCode link
- Difficulty level (Easy/Medium/Hard) with color coding
- Topic
- Custom notes (large textarea for better visibility)
- Solve count (tracks how many times solved)
- Completion status with date
- For repetition problems: Shows original added date and repetition date

#### Edit & Delete
- Full CRUD operations on all problems
- Edit mode prevents auto-refresh to preserve notes
- Delete anchor problems also removes associated repetition entries
- Topic changes automatically recalculate repetition schedules

### 📅 Calendar & Navigation

#### Interactive Calendar
- Click any date to jump to problems from that day
- Visual representation of daily activity
- Month navigation with keyboard support
- Optimized loading with caching

#### Navigation
- Seamless navigation between daily view and all problems
- Live clock in the navbar (12-hour format)
- Date display with current day highlighted
- Tab-based navigation for different views

### 📋 Practice Plan

#### Customizable Weekly Schedule
- Set anchor topic for each day of the week (Monday to Sunday)
- Set repetition topic for each day
- Full CRUD operations (add, edit, delete)
- Today's day highlighted in blue
- Default plan can be initialized with one click

#### Topic-Aware Scheduling
- Repetition system uses practice plan to schedule reviews
- Problems are scheduled for days when their topic appears
- Ensures focused practice on specific topics each day

### 💡 Additional Features

#### Daily Motivation
- Personalized motivational messages
- Changes daily to keep you motivated
- Context-aware messages based on your progress

#### Quick Tips
- Topic-specific study tips based on today's anchor topic
- Helpful hints and best practices
- Rotates through different tips

#### Problem Recommendations
- Shows recommended problem pairs from curated list
- AI-powered reasoning (if Groq API available)
- Progress indicator (X/96 solved)
- Direct links to add problems

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

## 🔄 Workflow

### Daily Routine
1. **View Recommendations**: Check today's recommended problems from the curated list
2. **Add New Problems**: Add 2 problems for today's anchor topic
3. **Review Repetitions**: Complete up to 5 repetition problems scheduled for today
4. **Clear Backlog**: Work on any missed repetition problems when time permits
5. **Track Progress**: Monitor your streak, weekly progress, and statistics

### Problem Lifecycle
1. **Add Problem**: Problem is added as an "anchor" with initial mastery level "new"
2. **Complete Problem**: Mark as complete, increments solve count, calculates next repetition date
3. **Repetition Scheduling**: System schedules repetition for next topic day based on interval
4. **Repetition Day**: Up to 5 problems are selected based on priority and shown for review
5. **Complete Repetition**: Updates mastery level, recalculates interval, schedules next review
6. **Mastery Progression**: Problems advance through mastery levels as you solve them repeatedly

### Smart Repetition Flow
1. Anchor problem is added → `nextRepetitionDate` calculated based on difficulty
2. `scheduledRepetitionDate` set to next day when topic appears in practice plan
3. On repetition day, system selects top 5 problems by priority
4. Unselected problems are redistributed to future topic days
5. When repetition is completed, new interval calculated and mastery level updated
6. Process repeats with longer intervals as mastery increases

## 🎯 Smart Features Explained

### Spaced Repetition Algorithm
- **Interval Calculation**: Based on solve count and difficulty
  - Formula: `baseInterval = solveCount + 1`
  - Easy: `interval = baseInterval * 1.25`
  - Medium: `interval = baseInterval * 1.0`
  - Hard: `interval = baseInterval * 0.75`
- **Mastery Level Calculation**: Based on solve count, failed count, and streak
  - New: solveCount = 0
  - Learning: solveCount 1-2, or failedCount > 0
  - Reviewing: solveCount 3-5, streakCount ≥ 2
  - Mastered: solveCount > 5, streakCount ≥ 3
- **Priority Score**: Combines urgency, mastery, solve count, and last review date
- **Topic Day Finding**: Uses practice plan to find next occurrence of problem's topic

### Recommendation System
- **Curated List**: 96 problems with prerequisites and learning order
- **Prerequisite Checking**: Only recommends problems whose prerequisites are solved
- **Topic Prioritization**: Prioritizes problems from today's anchor topic
- **AI Enhancement**: Uses Groq Cloud AI to provide personalized reasoning
- **Fallback**: Basic recommendations if AI is unavailable

### Data Integrity
- **Separate Entries**: Anchor and repetition problems are separate database entries
- **Historical Accuracy**: Original completion dates preserved
- **Solve Count Sync**: Solve count synchronized across all entries for same problem
- **Completion Locking**: Past day completions cannot be changed
- **Orphan Prevention**: Deleting anchor problems also removes associated repetitions

## 🎨 UI Components

### Main Dashboard
- **Navbar**: Website name, navigation tabs, live clock, and date display
- **Left Sidebar**: Quick stats including today's summary, streak, weekly progress, and top topics
- **Main Content**: Dynamic content based on selected tab
- **Right Sidebar**: Calendar, daily motivation, and quick tips

### Daily View
- **Problem Recommendations**: AI-enhanced problem suggestions with reasoning
- **Repetition Section**: Up to 5 problems due for review today (topic-matched)
- **Today's Problems**: Problems added today with add form
- **Backlog Section**: Missed repetition problems grouped by topic

### All Problems View
- **Today's Overview**: Quick summary with links to sections
- **Search Bar**: Real-time search across all problems
- **Filters**: Status, type (repeated/all), and topic filters
- **Grouped Display**: Problems grouped by date with scroll-to-date navigation

### Statistics View
- **Overview Cards**: Total, completed, pending, completion rate
- **Streak & Weekly Progress**: Visual progress indicators
- **By Difficulty**: Breakdown with progress bars
- **By Topic**: Comprehensive topic statistics with progress bars

### Practice Plan View
- **Editable Table**: Weekly schedule with anchor and repetition topics
- **Add/Edit/Delete**: Full CRUD operations
- **Today Highlighting**: Current day highlighted in blue
- **Tips Section**: Helpful information about practice planning

## 📝 Technical Notes

- **Date Handling**: All dates stored in UTC, displayed in local timezone
- **Caching**: Statistics and calendar data cached for 30 seconds for performance
- **Database Indexes**: Optimized indexes for fast queries on type, dates, and topics
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance**: Optimized queries with `.lean()`, parallel queries, and efficient aggregations
- **Mobile Optimization**: Responsive design with compact UI for screens ≤425px
- **Real-time Sync**: State synchronized across components with auto-refresh (pauses during editing)

## 🚀 Getting Started

1. Set up MongoDB connection in backend `.env`
2. Configure Groq API key (optional) for AI recommendations
3. Start backend server: `npm start` in `backend/` directory
4. Start frontend: `npm run dev` in `frontend/` directory
5. Initialize practice plan from Practice Plan tab
6. Start adding problems and tracking your progress!

---

**Built for personal use** - A comprehensive tool to maintain consistency in LeetCode practice with intelligent spaced repetition and progress tracking.
