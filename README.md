# LeetCode Daily Dashboard

A personalized dashboard to help you maintain your LeetCode problem-solving routine with a 3-day repetition cycle.

## 🎯 Concept

This dashboard implements a spaced repetition system where:
- **Anchor Topic**: Learn 2 new problems daily
- **Repetition Topic**: Review problems from exactly 3 days ago
- **Backlog**: Catch up on any missed repetition problems

## 📋 Weekly Schedule

| Day | 🎯 Anchor Topic | 🔁 Repetition Topic |
|-----|----------------|---------------------|
| Monday | Arrays & Hashing | Stacks (from Friday) |
| Tuesday | Two Pointers | Trees (Basics) (from Saturday) |
| Wednesday | Sliding Window | Linked Lists (from Sunday) |
| Thursday | Binary Search | Arrays & Hashing (from Monday) |
| Friday | Stacks | Two Pointers (from Tuesday) |
| Saturday | Trees (Basics) | Sliding Window (from Wednesday) |
| Sunday | Linked Lists | Binary Search (from Thursday) |

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v20.19.0 or higher recommended)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your MongoDB Atlas connection string:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leetcode-dashboard?retryWrites=true&w=majority
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

4. **Install dependencies (if not already done):**
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

4. **Install dependencies (if not already done):**
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
│   ├── models/
│   │   └── Problem.js          # MongoDB schema for problems
│   ├── routes/
│   │   ├── problems.js         # API routes for problem CRUD
│   │   └── daily.js            # API routes for daily dashboard
│   ├── utils/
│   │   └── dayUtils.js         # Day/topic mapping utilities
│   ├── server.js               # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Main dashboard component
│   │   │   ├── AnchorSection.jsx  # New problems section
│   │   │   ├── RepetitionSection.jsx  # Review problems section
│   │   │   └── BacklogSection.jsx     # Missed problems section
│   │   ├── services/
│   │   │   └── api.js           # API service functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🗄️ Database Schema

### Problem Model
```javascript
{
  problemNumber: String,      // LeetCode problem number (e.g., "704")
  topic: String,              // One of the 7 topics
  addedDate: Date,            // When the problem was first added
  repetitionDate: Date,       // When it should be reviewed (3 days later)
  isCompleted: Boolean,       // Whether it's been reviewed
  completedDate: Date,        // When it was marked complete
  type: String                // "anchor" or "repetition"
}
```

## 🔌 API Endpoints

### GET `/api/daily/dashboard`
Returns today's dashboard data including:
- Anchor topic
- Repetition topic
- List of repetition problems due today
- Backlog of missed problems

### POST `/api/problems`
Add new problems for today's anchor topic.
```json
{
  "problemNumbers": ["704", "35"],
  "topic": "Binary Search"
}
```

### PATCH `/api/problems/:id/complete`
Mark a problem as completed.

## 🎨 Features

- ✅ Automatic day detection and topic assignment
- ✅ 3-day repetition cycle scheduling
- ✅ Backlog tracking for missed problems
- ✅ Clean, modern UI with Tailwind CSS
- ✅ Real-time updates when marking problems complete
- ✅ Responsive design for mobile and desktop

## 📝 Usage Workflow

1. **Open the dashboard** - See today's topics automatically
2. **Review repetition problems** - Check off problems you've re-solved
3. **Add new anchor problems** - Enter 2 new problem numbers for today's topic
4. **Clear backlog** - Complete any missed problems when you have time

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Verify your connection string in `.env`
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your MongoDB Atlas cluster is running

### CORS Errors
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that both servers are running

### Port Already in Use
- Change the `PORT` in backend `.env`
- Update `VITE_API_URL` in frontend `.env` accordingly

## 📄 License

ISC

