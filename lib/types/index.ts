import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { type SRSResult } from '../utils/srs';

// ─── Base Models Inferred from Drizzle Schema ─────────────────────────────────
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type Profile = InferSelectModel<typeof schema.profiles>;
export type NewProfile = InferInsertModel<typeof schema.profiles>;

export type Account = InferSelectModel<typeof schema.accounts>;
export type NewAccount = InferInsertModel<typeof schema.accounts>;

export type Session = InferSelectModel<typeof schema.sessions>;
export type NewSession = InferInsertModel<typeof schema.sessions>;

export type VerificationToken = InferSelectModel<typeof schema.verificationTokens>;
export type NewVerificationToken = InferInsertModel<typeof schema.verificationTokens>;

export type Book = InferSelectModel<typeof schema.books>;
export type NewBook = InferInsertModel<typeof schema.books>;

export type Unit = InferSelectModel<typeof schema.units>;
export type NewUnit = InferInsertModel<typeof schema.units>;

export type Section = InferSelectModel<typeof schema.sections>;
export type NewSection = InferInsertModel<typeof schema.sections>;

export type Lesson = InferSelectModel<typeof schema.lessons>;
export type NewLesson = InferInsertModel<typeof schema.lessons>;

export type Word = InferSelectModel<typeof schema.words>;
export type NewWord = InferInsertModel<typeof schema.words>;

export type WordProgress = InferSelectModel<typeof schema.wordProgress>;
export type NewWordProgress = InferInsertModel<typeof schema.wordProgress>;

export type StudySession = InferSelectModel<typeof schema.studySessions>;
export type NewStudySession = InferInsertModel<typeof schema.studySessions>;

export type StudyAnswer = InferSelectModel<typeof schema.studyAnswers>;
export type NewStudyAnswer = InferInsertModel<typeof schema.studyAnswers>;

export type DailyActivity = InferSelectModel<typeof schema.dailyActivity>;
export type NewDailyActivity = InferInsertModel<typeof schema.dailyActivity>;

export type Badge = InferSelectModel<typeof schema.badges>;
export type NewBadge = InferInsertModel<typeof schema.badges>;

export type UserBadge = InferSelectModel<typeof schema.userBadges>;
export type NewUserBadge = InferInsertModel<typeof schema.userBadges>;

export type AiUsage = InferSelectModel<typeof schema.aiUsage>;
export type NewAiUsage = InferInsertModel<typeof schema.aiUsage>;

export type Notification = InferSelectModel<typeof schema.notifications>;
export type NewNotification = InferInsertModel<typeof schema.notifications>;

// ─── Domain-Specific Composite & Extended Types ──────────────────────────────
export interface LessonWithWords extends Lesson {
  words: Word[];
}

export interface WordWithProgress extends Word {
  progress?: WordProgress | null;
}

export interface StudyCardData extends Word {
  progress?: WordProgress | null;
}

// ─── Game / Quiz Types ────────────────────────────────────────────────────────
export interface GameQuestion {
  type: 'mc' | 'spelling' | 'matching' | 'fill_blank' | 'speed';
  word: Word;
  displayContent: string;       // what to show (definition / term / sentence)
  correctAnswer: string;
  options?: string[];           // for MC
  sentence?: string;            // for fill_blank with blank marker
  blankIndex?: number;
}

export interface GameAnswer {
  wordId: string;
  isCorrect: boolean;
  userAnswer: string;
  timeTakenMs: number;
}

export { type SRSResult };

// ─── API Response Wrappers ────────────────────────────────────────────────────
export type ApiResponse<T> = 
  | { success: true; data: T; error?: never; code?: never }
  | { success: false; error: string; code?: string; data?: never };

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
