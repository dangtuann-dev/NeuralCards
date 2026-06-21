import {
  pgTable, uuid, text, integer, boolean, timestamp,
  real, date, check, index, uniqueIndex, pgEnum,
  serial
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const skillEnum = pgEnum('skill', ['reading', 'listening', 'writing', 'speaking']);
export const posEnum = pgEnum('part_of_speech', ['noun','verb','adjective','adverb','phrase','idiom','collocation','other']);
export const wordStatusEnum = pgEnum('word_status', ['new', 'learning', 'review', 'mastered']);
export const gameTypeEnum = pgEnum('game_type', ['flashcard','multiple_choice','spelling','matching','fill_blank','speed_round']);
export const difficultyEnum = pgEnum('difficulty_level', ['1','2','3','4','5']);

// ─── Users / Profiles ─────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  password: text('password'), // hashed, null if OAuth
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  streakDays: integer('streak_days').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastStudiedAt: timestamp('last_studied_at'),
  totalWordsLearned: integer('total_words_learned').default(0).notNull(),
  totalXp: integer('total_xp').default(0).notNull(),
  dailyGoal: integer('daily_goal').default(10).notNull(), // words per day
  studyPreference: text('study_preference').default('mixed'), // 'flashcard_first' | 'games_first' | 'mixed'
  preferredLanguage: text('preferred_language').default('vi'), // 'vi' | 'en'
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// NextAuth required tables
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (t) => ({
  providerIdx: uniqueIndex('accounts_provider_idx').on(t.provider, t.providerAccountId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// ─── Content Hierarchy ────────────────────────────────────────────────────────
export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),       // "Cambridge IELTS 11"
  number: integer('number').notNull(),  // 11–20
  description: text('description'),
  coverColor: text('cover_color').default('#6366f1').notNull(),
  coverGradient: text('cover_gradient'), // optional gradient string
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  numberIdx: index('books_number_idx').on(t.number),
}));

export const units = pgTable('units', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookId: uuid('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),       // "Test 1"
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  bookIdx: index('units_book_idx').on(t.bookId),
}));

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  unitId: uuid('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),       // "Reading Passage 1 – The History of Glass"
  skill: skillEnum('skill').notNull(),
  orderIndex: integer('order_index').notNull(),
  passageText: text('passage_text'),    // full passage for AI extraction context
  passageSource: text('passage_source'), // citation
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  unitIdx: index('sections_unit_idx').on(t.unitId),
}));

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),       // "Paragraphs A–C vocabulary"
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(), // admin can feature
  orderIndex: integer('order_index').default(0).notNull(),
  wordCount: integer('word_count').default(0).notNull(), // denormalized counter
  coverEmoji: text('cover_emoji').default('📚'),
  tags: text('tags').array().default(sql`'{}'`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  sectionIdx: index('lessons_section_idx').on(t.sectionId),
  userIdx: index('lessons_user_idx').on(t.userId),
  publicIdx: index('lessons_public_idx').on(t.isPublic),
}));

export const words = pgTable('words', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  term: text('term').notNull(),
  phonetic: text('phonetic'),           // IPA: /ˈɪntrɪkɪt/
  partOfSpeech: posEnum('part_of_speech'),
  definition: text('definition').notNull(),
  definitionVi: text('definition_vi'), // Vietnamese translation
  exampleSentence: text('example_sentence'),
  exampleSentenceVi: text('example_sentence_vi'),
  synonyms: text('synonyms').array().default(sql`'{}'`),
  antonyms: text('antonyms').array().default(sql`'{}'`),
  collocations: text('collocations').array().default(sql`'{}'`),
  imageUrl: text('image_url'),
  audioUrl: text('audio_url'),
  difficulty: integer('difficulty').default(1).notNull(),
  tags: text('tags').array().default(sql`'{}'`),
  ieltsBand: text('ielts_band'),        // e.g. "B2-C1"
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  lessonIdx: index('words_lesson_idx').on(t.lessonId),
  termIdx: index('words_term_idx').on(t.term),
}));

// ─── Spaced Repetition ────────────────────────────────────────────────────────
export const wordProgress = pgTable('word_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  wordId: uuid('word_id').references(() => words.id, { onDelete: 'cascade' }).notNull(),
  status: wordStatusEnum('status').default('new').notNull(),
  easeFactor: real('ease_factor').default(2.5).notNull(),
  intervalDays: integer('interval_days').default(1).notNull(),
  repetitions: integer('repetitions').default(0).notNull(),
  dueDate: date('due_date').default(sql`CURRENT_DATE`).notNull(),
  lastReviewedAt: timestamp('last_reviewed_at'),
  totalReviews: integer('total_reviews').default(0).notNull(),
  correctReviews: integer('correct_reviews').default(0).notNull(),
}, (t) => ({
  uniqueUserWord: uniqueIndex('word_progress_unique').on(t.userId, t.wordId),
  dueDateIdx: index('word_progress_due_idx').on(t.userId, t.dueDate),
  statusIdx: index('word_progress_status_idx').on(t.userId, t.status),
}));

// ─── Sessions & Analytics ─────────────────────────────────────────────────────
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  gameType: gameTypeEnum('game_type').notNull(),
  score: integer('score').default(0).notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  timeTakenSeconds: integer('time_taken_seconds'),
  xpEarned: integer('xp_earned').default(0).notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (t) => ({
  userIdx: index('sessions_user_idx').on(t.userId),
  dateIdx: index('sessions_date_idx').on(t.userId, t.completedAt),
}));

export const studyAnswers = pgTable('study_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => studySessions.id, { onDelete: 'cascade' }).notNull(),
  wordId: uuid('word_id').references(() => words.id, { onDelete: 'cascade' }).notNull(),
  isCorrect: boolean('is_correct').notNull(),
  userAnswer: text('user_answer'),
  quality: integer('quality'), // SM-2 quality rating 0–5
  timeTakenMs: integer('time_taken_ms'),
});

// ─── Daily Activity (for heatmap) ────────────────────────────────────────────
export const dailyActivity = pgTable('daily_activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  wordsStudied: integer('words_studied').default(0).notNull(),
  wordsLearned: integer('words_learned').default(0).notNull(), // new → mastered
  minutesStudied: integer('minutes_studied').default(0).notNull(),
  xpEarned: integer('xp_earned').default(0).notNull(),
}, (t) => ({
  uniqueUserDate: uniqueIndex('daily_activity_unique').on(t.userId, t.date),
  userIdx: index('daily_activity_user_idx').on(t.userId),
}));

// ─── Achievements / Badges ────────────────────────────────────────────────────
export const badges = pgTable('badges', {
  id: text('id').primaryKey(), // 'streak_7', 'words_500', etc.
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(), // emoji or icon name
  condition: text('condition').notNull(), // JSON condition descriptor
  xpReward: integer('xp_reward').default(100).notNull(),
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: text('badge_id').references(() => badges.id).notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
}, (t) => ({
  uniqueUserBadge: uniqueIndex('user_badges_unique').on(t.userId, t.badgeId),
}));

// ─── AI Usage Tracking ────────────────────────────────────────────────────────
export const aiUsage = pgTable('ai_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  feature: text('feature').notNull(), // 'extract_vocab' | 'generate_example' | 'explain_vi'
  tokensUsed: integer('tokens_used').default(0).notNull(),
  cost: real('cost').default(0), // USD
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userDateIdx: index('ai_usage_user_date_idx').on(t.userId, t.createdAt),
}));

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'streak_reminder' | 'badge_earned' | 'review_due'
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  metadata: text('metadata'), // JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  userIdx: index('notifications_user_idx').on(t.userId, t.isRead),
}));

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.id] }),
  lessons: many(lessons),
  wordProgress: many(wordProgress),
  studySessions: many(studySessions),
}));

export const booksRelations = relations(books, ({ many }) => ({
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  book: one(books, { fields: [units.bookId], references: [books.id] }),
  sections: many(sections),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  unit: one(units, { fields: [sections.unitId], references: [units.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  section: one(sections, { fields: [lessons.sectionId], references: [sections.id] }),
  user: one(users, { fields: [lessons.userId], references: [users.id] }),
  words: many(words),
  studySessions: many(studySessions),
}));

export const wordsRelations = relations(words, ({ one, many }) => ({
  lesson: one(lessons, { fields: [words.lessonId], references: [lessons.id] }),
  progress: many(wordProgress),
  answers: many(studyAnswers),
}));
