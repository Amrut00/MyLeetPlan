import { useEffect, useState } from 'react';
import {
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineChartBar,
} from 'react-icons/hi2';

const STEPS = [
  {
    icon: HiOutlineSparkles,
    title: 'Welcome to MyLeetPlan',
    body: 'Your personal companion for a consistent LeetCode routine. It combines a weekly practice plan with smart spaced repetition, so you learn new problems and review old ones at the right time. Here\'s the 60-second tour.',
  },
  {
    icon: HiOutlineCalendarDays,
    title: '1. Set up your Practice Plan',
    body: 'Open the Practice Plan tab and pick an "anchor" topic (new problems) and a "repetition" topic (reviews) for each day of the week. A sensible default plan is already set up for you — tweak it anytime.',
  },
  {
    icon: HiOutlinePlusCircle,
    title: '2. Add today\'s problems',
    body: 'On the Daily tab, add a couple of problems from today\'s anchor topic. Not sure which to pick? The Recommendations section suggests the next problems in a curated learning order. Titles and difficulty are fetched from LeetCode automatically.',
  },
  {
    icon: HiOutlineArrowPath,
    title: '3. Review with spaced repetition',
    body: 'When you complete a problem, MyLeetPlan schedules it for review on a future day when its topic comes up. Each day shows up to 5 due repetitions. Missed a day? Those problems wait for you in the Backlog.',
  },
  {
    icon: HiOutlineChartBar,
    title: '4. Track your progress',
    body: 'Watch your streak grow on the Statistics tab and the activity calendar. The more consistently you solve, the longer your intervals become as problems move from "learning" to "mastered".',
  },
];

export default function WelcomeModal({ isOpen, onClose, onGoToGuide }) {
  const [step, setStep] = useState(0);

  // Reset to the first step whenever the modal is (re)opened
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg bg-dark-bg-secondary border border-dark-border rounded-2xl shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome tour"
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex items-center justify-center rounded-lg p-2 text-dark-text-secondary hover:text-white hover:bg-dark-bg-tertiary border border-transparent hover:border-dark-border focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <HiOutlineXMark className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-6 sm:px-8">
          {/* Icon */}
          <div className="mx-auto mb-5 w-14 h-14 rounded-xl bg-dark-bg-tertiary border border-dark-border flex items-center justify-center shadow-lg">
            <Icon className="w-7 h-7 text-indigo-400" />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-center text-dark-text mb-3">{current.title}</h2>
          <p className="text-sm leading-relaxed text-center text-dark-text-secondary min-h-[96px]">
            {current.body}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to step ${i + 1}`}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-6 bg-indigo-400' : 'w-2 bg-dark-border hover:bg-dark-border-light'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-dark-border">
          <button
            type="button"
            onClick={onGoToGuide}
            className="text-sm font-medium text-dark-text-secondary hover:text-indigo-400 transition"
          >
            See the full guide
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="px-3 py-2 rounded-lg text-sm font-medium text-dark-text-secondary hover:text-dark-text hover:bg-dark-bg-tertiary border border-dark-border transition"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Get started
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
