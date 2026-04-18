export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
  {
    text: 'The more that you read, the more things you will know.',
    author: 'Dr. Seuss',
  },
  {
    text: 'Reading is a conversation. All books talk. But a good book listens as well.',
    author: 'Mark Haddon',
  },
  { text: 'A book is a dream you hold in your hands.', author: 'Neil Gaiman' },
  {
    text: 'Reading gives us someplace to go when we have to stay where we are.',
    author: 'Mason Cooley',
  },
  {
    text: 'One glance at a book and you hear the voice of another person, perhaps someone dead for thousands of years.',
    author: 'Carl Sagan',
  },
  { text: 'We read to know we are not alone.', author: 'C.S. Lewis' },
  { text: 'Think before you speak. Read before you think.', author: 'Fran Lebowitz' },
  { text: 'A room without books is like a body without a soul.', author: 'Cicero' },
  {
    text: 'If you only read the books that everyone else is reading, you can only think what everyone else is thinking.',
    author: 'Haruki Murakami',
  },
  {
    text: 'Once you have read a book you care about, some part of it is always with you.',
    author: "Louis L'Amour",
  },
  {
    text: 'The reading of all good books is like a conversation with the finest minds of past centuries.',
    author: 'René Descartes',
  },
  { text: 'There is no friend as loyal as a book.', author: 'Ernest Hemingway' },
  {
    text: 'Books are mirrors: you only see in them what you already have inside you.',
    author: 'Carlos Ruiz Zafón',
  },
  { text: 'Today a reader, tomorrow a leader.', author: 'Margaret Fuller' },
  {
    text: 'Read, every day, something no one else is reading. Think, every day, something no one else is thinking.',
    author: 'Christopher Morley',
  },
  { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle' },
  {
    text: 'The mind is not a vessel to be filled, but a fire to be kindled.',
    author: 'Plutarch',
  },
  { text: 'Be where you are; otherwise you will miss your life.', author: 'Buddha' },
  { text: 'Attention is the rarest and purest form of generosity.', author: 'Simone Weil' },
  {
    text: 'Slow down and everything you are chasing will come around and catch you.',
    author: 'John De Paola',
  },
  { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
  { text: 'The quieter you become, the more you can hear.', author: 'Ram Dass' },
  {
    text: 'Almost everything will work again if you unplug it for a few minutes, including you.',
    author: 'Anne Lamott',
  },
  { text: 'Less but better.', author: 'Dieter Rams' },
  {
    text: 'Between stimulus and response there is a space. In that space is our power to choose our response.',
    author: 'Viktor Frankl',
  },
  {
    text: 'The real question is not whether life exists after death. The real question is whether you are alive before death.',
    author: 'Osho',
  },
  {
    text: 'You cannot travel the path until you have become the path itself.',
    author: 'Gautama Buddha',
  },
  { text: 'Wherever you go, there you are.', author: 'Jon Kabat-Zinn' },
  {
    text: 'The only person you are destined to become is the person you decide to be.',
    author: 'Ralph Waldo Emerson',
  },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  {
    text: 'In the midst of movement and chaos, keep stillness inside of you.',
    author: 'Deepak Chopra',
  },
  {
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'The unread story is not a story; it is little black marks on wood pulp.',
    author: 'Ursula K. Le Guin',
  },
  {
    text: 'Books are the quietest and most constant of friends.',
    author: 'Charles W. Eliot',
  },
  { text: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison' },
  {
    text: 'I have always imagined that Paradise will be a kind of library.',
    author: 'Jorge Luis Borges',
  },
  {
    text: 'The world belongs to those who read.',
    author: 'Rick Holland',
  },
  {
    text: 'Reading is an act of civilization; it is one of the greatest acts of civilization because it takes the free raw material of the mind and builds castles of possibilities.',
    author: 'Ben Okri',
  },
];

export function getDailyQuote(dateStr?: string): Quote {
  const seed = dateStr ?? new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % QUOTES.length;
  return QUOTES[index] ?? QUOTES[0]!;
}
