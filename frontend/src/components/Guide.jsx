import {
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineChartBar,
  HiOutlineClipboardDocumentList,
  HiOutlinePlay,
  HiOutlineAcademicCap,
} from 'react-icons/hi2';

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-dark-bg-tertiary border border-dark-border flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-dark-text">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-dark-text-secondary space-y-2">{children}</div>
    </div>
  );
}

export default function Guide({ onReplayTour }) {
  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-dark-bg-tertiary border border-dark-border flex items-center justify-center">
            <HiOutlineAcademicCap className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-text">How MyLeetPlan works</h2>
            <p className="text-sm text-dark-text-secondary">A quick guide to your daily practice routine.</p>
          </div>
        </div>
        {onReplayTour && (
          <button
            type="button"
            onClick={onReplayTour}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            <HiOutlinePlay className="w-4 h-4" />
            Replay the welcome tour
          </button>
        )}
      </div>

      <Section icon={HiOutlineSparkles} title="The idea">
        <p>
          MyLeetPlan keeps you consistent by pairing a <strong className="text-dark-text">weekly practice plan</strong> with
          {' '}<strong className="text-dark-text">smart spaced repetition</strong>. Each day you learn a few new problems
          (&ldquo;anchors&rdquo;) and review older ones right when they&rsquo;re due — so nothing slips through the cracks.
        </p>
      </Section>

      <Section icon={HiOutlineCalendarDays} title="1. Set up your Practice Plan">
        <p>
          Head to the <strong className="text-dark-text">Practice Plan</strong> tab. For each day of the week you choose two topics:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-dark-text">Anchor topic</strong> — the focus for new problems you add that day.</li>
          <li><strong className="text-dark-text">Repetition topic</strong> — the topic whose past problems come up for review.</li>
        </ul>
        <p>A default 7-day plan is created for you automatically, so you can start right away and adjust later.</p>
      </Section>

      <Section icon={HiOutlinePlusCircle} title="2. Add today's problems">
        <p>
          On the <strong className="text-dark-text">Daily</strong> tab, add a couple of problems from today&rsquo;s anchor topic.
          Just enter the LeetCode problem number — the title, slug, and difficulty are fetched automatically.
        </p>
        <p>
          The <strong className="text-dark-text">Recommendations</strong> section suggests the next problems in a curated learning
          order (respecting prerequisites), so you always know what to try next.
        </p>
      </Section>

      <Section icon={HiOutlineArrowPath} title="3. Review with spaced repetition">
        <p>
          When you mark a problem complete, it&rsquo;s scheduled for a future review on the next day its topic appears in your plan.
          Intervals grow as you get better:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review dates stretch out as your solve count rises (1 → 3 → 7 → 14 → 30+ days).</li>
          <li>Easy problems get longer gaps; Hard problems come back sooner.</li>
          <li>Each problem climbs from <em>new</em> → <em>learning</em> → <em>reviewing</em> → <em>mastered</em>.</li>
        </ul>
        <p>Up to 5 due reviews are shown per day to keep things focused.</p>
      </Section>

      <Section icon={HiOutlineClipboardDocumentList} title="4. Clear your backlog">
        <p>
          Missed a review day? Those problems land in the <strong className="text-dark-text">Backlog</strong> on the Daily tab,
          grouped by topic. Knock them out whenever you have time — completing them clears the backlog and reschedules the next review.
        </p>
      </Section>

      <Section icon={HiOutlineChartBar} title="5. Track your progress">
        <p>
          The <strong className="text-dark-text">Statistics</strong> tab shows your streak, weekly progress, and breakdowns by
          topic and difficulty. The activity calendar visualizes everything you&rsquo;ve solved — click any day to jump to those problems.
        </p>
        <p className="text-dark-text">Solve a little every day, and the streak takes care of itself. 🎯</p>
      </Section>
    </div>
  );
}
