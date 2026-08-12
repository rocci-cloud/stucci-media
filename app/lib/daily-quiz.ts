import { getPublishedArticles } from "./articles";

export type QuizQuestion = {
  correctSlug: string;
  options: { slug: string; headline: string }[];
};

const QUESTIONS_PER_QUIZ = 5;
const OPTIONS_PER_QUESTION = 4;
const POOL_SIZE = 40;
// Below this many published articles there isn't enough real content to
// build a fair quiz (5 correct answers + distinct decoys each) — the page
// shows an honest "not enough stories yet" state instead of a thin quiz.
const MIN_ARTICLES = 15;

// A tiny seeded PRNG (Lehmer/Park-Miller) so every reader gets the exact
// same quiz on a given UTC day — that's what makes a shared "I got 4/5
// today" score mean anything. Deliberately not Math.random().
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Every option — correct and decoy alike — is a real headline this site
// actually published. No headline is invented: the game is "which of
// these did Stucci really run," never a fabricated one, which matters a
// lot for a news site's own game.
export async function getDailyQuiz(dateStr = new Date().toISOString().slice(0, 10)): Promise<QuizQuestion[]> {
  const articles = await getPublishedArticles();
  if (articles.length < MIN_ARTICLES) return [];

  const rand = seededRandom(hashDateString(dateStr));
  const pool = shuffle(articles.slice(0, Math.min(POOL_SIZE, articles.length)), rand);

  const correctPicks = pool.slice(0, QUESTIONS_PER_QUIZ);
  const decoyPool = pool.slice(QUESTIONS_PER_QUIZ);

  return correctPicks.map((correct) => {
    const decoys = shuffle(
      decoyPool.filter((a) => a.slug !== correct.slug),
      rand
    ).slice(0, OPTIONS_PER_QUESTION - 1);

    const options = shuffle(
      [
        { slug: correct.slug, headline: correct.headline },
        ...decoys.map((d) => ({ slug: d.slug, headline: d.headline })),
      ],
      rand
    );

    return { correctSlug: correct.slug, options };
  });
}
