import { HiOutlineSparkles } from 'react-icons/hi2';

function DailyMotivation() {
  const motivations = [
    "Every problem you solve today is a step closer to mastering algorithms. Keep pushing! 💪",
    "The best time to solve problems was yesterday. The second best time is now. Start coding! 🚀",
    "You’re not just solving problems—you’re building problem‑solving muscles. Stay consistent! 💪",
    "Each problem is a puzzle waiting to be solved. You’ve got this! 🧩",
    "Progress isn’t always visible, but every problem adds to your coding arsenal. Keep going! ⚡",
    "Repetition isn’t review—it’s your brain cementing patterns. Trust the process! 🧠",
    "Every expert was once a beginner. Every problem you solve makes you better. Keep learning! 📚",
    "Don’t just solve—understand. Depth beats speed. Dive deep! 🌊",
    "Your future self will thank you for the problems you solve today. Make them proud! 🙏",
    "Consistency > Perfection. One problem a day beats ten once a week. Stay steady! 🎯",
    "Backlog isn’t failure—it’s opportunity. Reviewing strengthens your skills. 🔄",
    "Pattern recognition comes from repetition. Solve, review, grow. 🔁",
    "Every problem has a solution. Every solution teaches something new. Explore! 🔍",
    "This journey is a marathon, not a sprint. Pace yourself—keep moving! 🏃",
    "The hardest problems teach the most. Embrace the challenge! 💎",
    "Compete only with yesterday’s version of you. Win today. 🏆",
    "Every algorithm you master opens new doors. Keep unlocking them! 🔓",
    "The calendar shows your progress. Every green square is a win. 🎉",
    "Problem‑solving compounds. Practice daily and watch skills grow. 📈",
    "Your streak isn’t a number—it’s proof of commitment. Keep it alive! 🔥",
    "Today’s solves make tomorrow’s problems easier. Invest in yourself! 💰",
    "The best way to learn algorithms is to solve them. Start now. ⏰",
    "Your practice plan is a roadmap to mastery. Follow it. 🗺️",
    "Most problems have multiple solutions. Think differently. 🌟",
    "The problems you avoid are the ones you need. Face them head‑on! ⚔️",
    "Coding skills are like a muscle—stronger with every rep. Keep lifting! 💪",
    "Every bug fixed, pattern recognized, solution written grows you. 🌱",
    "A thousand‑problem journey starts with one solve. Keep going! 🚶",
    "Your dashboard tracks growth, not just numbers. Keep improving! 📊",
    "Solve. Review. Reflect. Repeat. That’s how mastery is built. ➡️"
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

