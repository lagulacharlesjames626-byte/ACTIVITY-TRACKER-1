import { ModuleItem, CompletionBoosterEvent, TimingCategory } from '../types';

function getRandomItem(list: string[]): string {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

export function generateCompletionBooster(
  module: ModuleItem,
  studentSurname: string
): CompletionBoosterEvent {
  const now = Date.now();
  const deadlineMs = module.deadline ? new Date(module.deadline).getTime() : NaN;
  // What number are you among those who finished?
  const rank = (module.completedBy?.length || 0) + 1;

  let category: TimingCategory = 'on_time';
  let speedHeadline = '🎯 On-Time Submission!';
  let timeDetail = 'Submitted on schedule before deadline!';
  let boostSentence = '';

  const rankOrdinal =
    rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
  const rankText =
    rank === 1
      ? '🥇 #1 in class (First to finish!)'
      : `🏅 #${rank} among finishers (${rankOrdinal} place)`;

  if (isNaN(deadlineMs)) {
    // No deadline specified
    category = 'early';
    speedHeadline = rank === 1 ? '🥇 1st in Class to Finish!' : '⚡ Finished Ahead!';
    timeDetail = 'Checked off cleanly in your tracker!';

    const noDeadlineQuotes = [
      "Woaah you finished it already, that was so fast! You used AI on it right? 😏🤖",
      "Look at you speeding through! Speedrun mode is definitely activated today! ⚡🏃‍♂️",
      "Submitted already?! Check again bro, make sure you uploaded the real work and not a blank PDF 😂📄",
      "Academic weapon alert! Professor hasn't even finished reading the syllabus yet! 🔥💪",
      "That was suspiciously fast! Go treat yourself to some milk tea or coffee, you earned it! 🧋🎉",
      "Done before your classmates even noticed this was assigned. Absolute legend! 👑✨",
      "Flexing on the entire section with that speed! Don't let them copy your answers! 🤫😂",
      "Work hard, finish early, nap peacefully! That's how champions do it! 😴🌟",
    ];
    boostSentence = getRandomItem(noDeadlineQuotes);
  } else {
    const diffMs = deadlineMs - now;

    if (diffMs > 1000 * 60 * 60 * 6) {
      // Early (> 6 hours before deadline)
      category = 'early';

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      let timeSpanText = '';
      if (diffDays >= 2) {
        timeSpanText = `${diffDays} days & ${diffHours}h before the deadline`;
        timeDetail = `Finished ${diffDays}d ${diffHours}h ahead of deadline! 🚀`;
      } else if (diffDays === 1) {
        timeSpanText = `1 day & ${diffHours}h before the deadline`;
        timeDetail = `Finished 1d ${diffHours}h ahead of deadline! ⚡`;
      } else {
        timeSpanText = `${diffHours} hours before the deadline`;
        timeDetail = `Finished ${diffHours}h ahead of deadline! 🔥`;
      }

      if (rank === 1) {
        speedHeadline = '🥇 1st in Class to Finish!';
      } else if (rank === 2) {
        speedHeadline = '🥈 2nd Finisher (Blazing Fast!)';
      } else if (rank === 3) {
        speedHeadline = '🥉 3rd Finisher (Super Fast!)';
      } else {
        speedHeadline = '⚡ Lightning Fast Finish!';
      }

      const earlyFunnyQuotes = [
        `Woaah you finished it ${timeSpanText} that was so fast, you use AI on it right 😏🤖`,
        `Look at you finishing ${timeSpanText}! Did you even sleep or are you powered by pure coffee and panic? ☕⚡`,
        `Speedrun any% world record! ${timeSpanText}. The professor hasn't even prepared the answer key yet 😂🏃‍♂️`,
        `Finishing ${timeSpanText}?! Okay showoff, don't make the rest of the class look bad! 💅🔥`,
        `Wait... you're already done ${timeSpanText}?! Check again, did you submit the actual file or a random meme? 😂📄`,
        `Academic weapon certified! Crushed it ${timeSpanText}. Go take a 12-hour guilt-free nap! 😴👑`,
        `Speed of light! Finished ${timeSpanText}. Don't open group chat or they will ask for your homework! 🤫✨`,
        `Are you a student or a submission robot? That speed was downright disrespectful to the deadline! 🚀💪`,
        `Early bird energy! Finished ${timeSpanText}. Go treat yourself to some milk tea or snacks, you earned every bit! 🧋🎉`,
        `Finishing ${timeSpanText}? Bro is living in the future while everyone else is still reading page 1! ⏳😎`,
        `Look at you being responsible! Your future self is cheering and sending you virtual hugs right now! 👏🌈`,
        `Submitted ${timeSpanText}. You beat the deadline so hard it filed a complaint! Legendary hustle! 🥊🏆`,
        `NASA called, they want their rocket-powered student back! Finished ${timeSpanText}! 🚀🛸`,
        `Did you submit this module, or did this module surrender to you? Absolute dominance! 🗿💥`,
        `Finishing ${timeSpanText}? Tell the truth, did you invent a time machine over the weekend? ⏰🛸`,
        `Finished ${timeSpanText}! Now you can kick back and watch everyone else sweat on deadline night! 🍿😎`,
        `Your brain is running on 1000 FPS today! Lightning fast finish ${timeSpanText}! ⚡🧠`,
        `Chef's kiss! Cooked this module with ${timeSpanText} to spare. Five Michelin stars for speed! 👨‍🍳⭐`,
      ];
      boostSentence = getRandomItem(earlyFunnyQuotes);
    } else if (diffMs >= 0) {
      // On time (within 6 hours of deadline, before cutoff)
      category = 'on_time';

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (rank === 1) {
        speedHeadline = '🥇 1st to Submit (Right On Time)!';
      } else {
        speedHeadline = '🎯 On-Time Submission!';
      }

      if (diffHours >= 1) {
        timeDetail = `Turned in smoothly with ${diffHours}h ${diffMinutes}m to spare! ⏱️`;
      } else if (diffMinutes > 0) {
        timeDetail = `Turned in clutch with ${diffMinutes} minutes to spare! 🎯`;
      } else {
        timeDetail = `Turned in right on the wire before deadline cutoff! ⏱️`;
      }

      const onTimeFunnyQuotes = [
        "Clutch god! Beat the clock with flawless timing. Straight out of a movie climax! 🎬⏱️",
        "0 panic, 100% precision! Submitted right before the wire. You love living dangerously, don't you? 😏🎯",
        "Turned in right on time! Procrastination tried to pull you in, but you defeated it today! ✋🔥",
        "Punctuality level: 100! Submitted cleanly without breaking a sweat. Go relax now! ✨🙌",
        "The buzzer was ringing, but you dunked it anyway! That's how clutch legends submit! 🏀🏆",
        "Perfect landing! Not a minute wasted, not a minute late. Master of timing! 🎯😎",
        "Deadline was sweating, but you stayed cool as ice. Mission accomplished! 🧊🧊",
        "James Bond defusing the bomb with 7 seconds on the timer energy! Flawless execution! 🕶️💣",
        "Calculated down to the exact second. You're not a procrastinator, you're a strategist! 🧠🎯",
        "Submitted right in the nick of time! Grab a snack, take off your shoes, you're done! 🍕🎉",
        "Clean, on-time, and delivered! That feeling of clearing your task list is undefeated! 🌟💯",
      ];
      boostSentence = getRandomItem(onTimeFunnyQuotes);
    } else {
      // Late (past deadline cutoff)
      category = 'late';

      const overdueMs = Math.abs(diffMs);
      const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      speedHeadline = '💪 Completed with True Grit!';

      if (overdueDays >= 1) {
        timeDetail = `Submitted ${overdueDays} day(s) past deadline — but conquered! 👏`;
      } else {
        timeDetail = `Submitted ${Math.max(1, overdueHours)}h past cutoff — finished with determination! 🌟`;
      }

      const lateFunnyQuotes = [
        "Better late than never! Seriously, submitting it late is 1000x better than ghosting it. Huge respect! 💪🔥",
        "Fashionably late! Points might get deducted, but your peace of mind is 100% restored. Celebrate the finish! 🥳✨",
        "You fought the procrastination monster and won! Be proud you didn't leave it blank. Sleep peacefully! 🛡️💤",
        "Done is SO much better than perfect! The backlog has one less victim today. Take a deep breath! 🎈🌱",
        "Late? Yes. Finished? ALSO YES! That's called resilience, my friend. Onwards to the next one! 👏🎉",
        "You didn't give up and that's what truly counts. Hold your head high, champion! 🌟💪",
        "Dread it, run from it, but you still submitted it! That's true willpower right there! 🦸‍♂️👊",
        "The comeback kid! Crossed the finish line and got it done. Take that win and roll into tomorrow! 🏆🔥",
        "A late submission still earns points; a blank one earns zero. You made the smart move! 🧠💯",
        "Weight off your shoulders! One less assignment haunting your dreams tonight. Rest easy! 🛌✨",
      ];
      boostSentence = getRandomItem(lateFunnyQuotes);
    }
  }

  // Exactly 10 seconds as requested by user
  const durationMs = 10000;

  return {
    id: `booster-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentName: studentSurname,
    moduleNumber: module.moduleNumber,
    subject: module.subject,
    activity: module.activity,
    category,
    speedHeadline,
    timeDetail,
    boostSentence,
    rank,
    rankText,
    durationMs,
  };
}
