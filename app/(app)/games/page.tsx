import { db } from '@/lib/db';
import { words, lessons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import GamesClient from './GamesClient';

export const metadata = { title: 'Mini-games — NeuralCards' };

const FALLBACK_WORDS = [
  { id: 'fb-1', term: 'meticulous', phonetic: '/mɪˈtɪkjələs/', partOfSpeech: 'adjective', definition: 'very careful and precise', definitionVi: 'tỉ mỉ, kỹ càng', exampleSentence: 'He was meticulous in his work.', exampleSentenceVi: 'Anh ấy rất tỉ mỉ trong công việc.' },
  { id: 'fb-2', term: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', partOfSpeech: 'adjective', definition: 'unclear or double-meaning', definitionVi: 'mơ hồ, nhập nhằng', exampleSentence: 'The instructions were ambiguous.', exampleSentenceVi: 'Các hướng dẫn rất mơ hồ.' },
  { id: 'fb-3', term: 'pragmatic', phonetic: '/præɡˈmætɪk/', partOfSpeech: 'adjective', definition: 'practical and realistic', definitionVi: 'thực tế, thực dụng', exampleSentence: 'We need a pragmatic solution.', exampleSentenceVi: 'Chúng ta cần một giải pháp thực tế.' },
  { id: 'fb-4', term: 'redundant', phonetic: '/rɪˈdʌndənt/', partOfSpeech: 'adjective', definition: 'no longer needed or useful', definitionVi: 'dư thừa, không cần thiết', exampleSentence: 'The extra features are redundant.', exampleSentenceVi: 'Các tính năng phụ là dư thừa.' },
  { id: 'fb-5', term: 'subtle', phonetic: '/ˈsʌt.əl/', partOfSpeech: 'adjective', definition: 'not loud, bright, or noticeable', definitionVi: 'tinh tế, tế nhị', exampleSentence: 'There is a subtle difference.', exampleSentenceVi: 'Có một sự khác biệt tinh tế.' },
  { id: 'fb-6', term: 'corroborate', phonetic: '/kəˈrɒb.ə.reɪt/', partOfSpeech: 'verb', definition: 'confirm or give support to', definitionVi: 'xác minh, chứng thực', exampleSentence: 'The witness corroborated his story.', exampleSentenceVi: 'Nhân chứng đã chứng thực câu chuyện của anh ta.' },
  { id: 'fb-7', term: 'scrutinize', phonetic: '/ˈskruː.tɪ.naɪz/', partOfSpeech: 'verb', definition: 'examine closely and thoroughly', definitionVi: 'xem xét kỹ lưỡng', exampleSentence: 'Customers scrutinize the details.', exampleSentenceVi: 'Khách hàng xem xét kỹ lưỡng các chi tiết.' },
  { id: 'fb-8', term: 'benevolent', phonetic: '/bəˈnev.əl.ənt/', partOfSpeech: 'adjective', definition: 'well meaning and kindly', definitionVi: 'nhân từ, rộng lượng', exampleSentence: 'He was a benevolent ruler.', exampleSentenceVi: 'Ông ấy là một nhà cai trị nhân từ.' }
];

interface GameWord {
  id: string;
  term: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string;
  definitionVi: string | null;
  exampleSentence: string | null;
  exampleSentenceVi: string | null;
}

export default async function GamesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let userWords: GameWord[] = [];

  if (userId) {
    try {
      userWords = await db
        .select({
          id: words.id,
          term: words.term,
          phonetic: words.phonetic,
          partOfSpeech: words.partOfSpeech,
          definition: words.definition,
          definitionVi: words.definitionVi,
          exampleSentence: words.exampleSentence,
          exampleSentenceVi: words.exampleSentenceVi,
        })
        .from(words)
        .innerJoin(lessons, eq(words.lessonId, lessons.id))
        .where(eq(lessons.userId, userId));
    } catch (err) {
      console.error('Failed to load user words for games:', err);
    }
  }

  // Fallback if the user has too few cards to play games
  const finalWordsList = userWords.length >= 4 ? userWords : FALLBACK_WORDS;

  return <GamesClient userWords={finalWordsList} />;
}
