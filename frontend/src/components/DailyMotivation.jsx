import { HiOutlineSparkles } from 'react-icons/hi2';

function DailyMotivation() {
  const motivations = [
    "Amrut, every problem you solve today is a step closer to mastering algorithms. Keep pushing! 💪",
    "The best time to solve problems was yesterday, Amrut. The second best time is now. Start coding! 🚀",
    "Remember, Amrut: You're not just solving problems, you're building problem-solving muscles. Stay consistent! 💪",
    "Each LeetCode problem is a puzzle waiting to be solved, Amrut. You've got this! 🧩",
    "Progress isn't always visible, Amrut, but every problem you solve adds to your coding arsenal. Keep going! ⚡",
    "Amrut, the repetition cycle isn't just review—it's your brain cementing patterns. Trust the process! 🧠",
    "Every expert was once a beginner, Amrut. Every problem you solve makes you better. Keep learning! 📚",
    "Don't just solve problems—understand them, Amrut. That's where real growth happens. Dive deep! 🌊",
    "Your future self will thank you, Amrut, for the problems you solve today. Make them proud! 🙏",
    "Consistency > Perfection, Amrut. One problem a day beats ten problems once a week. Stay steady! 🎯",
    "The backlog isn't failure, Amrut—it's opportunity. Every problem you review strengthens your skills! 🔄",
    "Pattern recognition comes from repetition, Amrut. Keep solving, keep reviewing, keep growing! 🔁",
    "Every problem has a solution, Amrut. Every solution teaches you something new. Keep exploring! 🔍",
    "Your coding journey is a marathon, not a sprint, Amrut. Pace yourself, but never stop moving! 🏃",
    "The problems that challenge you the most, Amrut, are the ones that teach you the most. Embrace them! 💎",
    "You're not competing with others, Amrut—you're competing with yesterday's version of yourself. Win! 🏆",
    "Every algorithm you master, Amrut, opens doors to new possibilities. Keep unlocking them! 🔓",
    "The calendar shows your progress, Amrut. Every green square is a victory. Celebrate them! 🎉",
    "Problem-solving is a skill that compounds, Amrut. The more you practice, the better you get. Keep practicing! 📈",
    "Your streak isn't just a number, Amrut—it's proof of your commitment. Keep it alive! 🔥",
    "Every problem you solve today, Amrut, makes tomorrow's problems easier. Invest in yourself! 💰",
    "The best way to learn algorithms is to solve problems, Amrut. The best time to start is now. Go! ⏰",
    "Your practice plan isn't just a schedule, Amrut—it's your roadmap to mastery. Follow it! 🗺️",
    "Every problem has multiple solutions, Amrut. Finding them teaches you to think differently. Explore! 🌟",
    "The problems you avoid, Amrut, are the ones you need most. Face them head-on! ⚔️",
    "Your coding skills are like a muscle, Amrut—they grow stronger with every problem you solve. Keep lifting! 💪",
    "Every bug you fix, every pattern you recognize, every solution you write, Amrut, makes you a better developer. Grow! 🌱",
    "The journey of a thousand problems begins with a single solve, Amrut. You've already started—keep going! 🚶",
    "Your dashboard isn't just tracking problems, Amrut—it's tracking your growth. Watch yourself improve! 📊",
    "Every problem solved is a step forward, Amrut. Every review is reinforcement. Keep moving forward! ➡️"
  ];

  // Use the day of year to get a different motivation each day
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
  const todayMotivation = motivations[dayOfYear % motivations.length];

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 rounded-lg p-3 border border-indigo-700/30 shadow-sm">
      <h3 className="text-sm font-semibold text-dark-text mb-2 flex items-center gap-1.5">
        <HiOutlineSparkles className="w-4 h-4" />
        <span>Daily Motivation</span>
      </h3>
      <p className="text-xs sm:text-sm text-dark-text-secondary leading-relaxed font-medium">
        {todayMotivation}
      </p>
    </div>
  );
}

export default DailyMotivation;

