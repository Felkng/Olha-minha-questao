export type DifficultyLevel = 'FACIL' | 'MEDIA' | 'DIFICIL' | 'SEM_DADOS';
export type FolderType = 'QUESTION' | 'TEST';

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Alternative {
  id?: number;
  identifier: string;
  text: string;
  isCorrect?: boolean;
}

export interface Origin {
  id: number;
  name: string;
  description?: string;
}

export interface Area {
  id: number;
  name: string;
  description?: string;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  areaId: number;
  areaName?: string;
}

export type UserRole = 'GENERAL' | 'ADMIN';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: UserSummary;
  token?: string;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  totalResolved: number;
  easyAccuracy: number;
  mediumAccuracy: number;
  hardAccuracy: number;
  dailyActivities: DailyActivity[];
}

export interface Test {
  id: number;
  name: string;
  year?: number;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
  createdByUser?: UserSummary;
}

export interface Question {
  id: number;
  enunciado: string;
  identifier: string;
  year?: number;
  origin?: Origin;
  area?: Area;
  subject?: Subject;
  test?: Test;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
  subjectId?: number;
  subjectName?: string;
  testId?: number;
  testName?: string;
  alternatives: Alternative[];
  correctAlternativeId?: number;
  correctAlternativeIdentifier?: string;
  difficultyLevel?: DifficultyLevel;
  accuracyPercentage?: number;
  totalAttempts?: number;
  createdByUser?: UserSummary;
}

export interface FilterState {
  search: string;
  type: 'all' | 'questions' | 'tests';
  originId: number | '';
  areaId: number | '';
  subjectId?: number | '';
  year: number | '';
  testId: number | '';
  difficulty?: string;
  sort?: string;
}

export interface Folder {
  id: number;
  name: string;
  description?: string;
  color: string;
  folderType: FolderType;
  questionCount?: number;
  testCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdByUser?: UserSummary;
}

export interface SavedQuestion {
  id: number;
  folderId: number;
  folderName: string;
  folderColor?: string;
  question: Question;
  notes?: string;
  createdAt: string;
}

export interface SavedTest {
  id: number;
  folderId: number;
  folderName: string;
  folderColor?: string;
  test: Test;
  notes?: string;
  createdAt: string;
}

export interface TestCard {
  id: number;
  name: string;
  year: number;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
  questionCount: number;
  difficultyLevel: DifficultyLevel;
  averageScore: number;
  totalAttempts: number;
}

export interface OriginCard {
  id: number;
  name: string;
  description?: string;
  questionCount: number;
  testCount: number;
}

export interface AreaCard {
  id: number;
  name: string;
  description?: string;
  questionCount: number;
  testCount: number;
}

export interface TestEvaluation {
  id: number;
  name: string;
  year: number;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
  questionCount: number;
  questions: Question[];
}

export interface QuestionAttemptRequest {
  selectedAlternativeId?: number;
  isFirstAttempt?: boolean;
  timeSpentSeconds?: number;
  sessionId?: string;
}

export interface QuestionAttemptResponse {
  isCorrect: boolean;
  correctAlternativeId?: number;
  accuracyPercentage: number;
  difficultyLevel: DifficultyLevel;
  totalAttempts: number;
}

export interface TestSubmissionRequest {
  timeSpentSeconds: number;
  sessionId?: string;
  answers: {
    questionId: number;
    selectedAlternativeId?: number;
    timeSpentSeconds?: number;
  }[];
}

export interface TestSubmissionResponse {
  testId: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  difficultyLevel: DifficultyLevel;
  detailedResults: {
    questionId: number;
    selectedAlternativeId?: number;
    correctAlternativeId?: number;
    isCorrect: boolean;
    difficultyLevel: DifficultyLevel;
  }[];
}
