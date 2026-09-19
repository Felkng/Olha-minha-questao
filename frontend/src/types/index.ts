export type DifficultyLevel = 'FACIL' | 'MEDIA' | 'DIFICIL' | 'SEM_DADOS';

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

export interface Test {
  id: number;
  name: string;
  year?: number;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
}

export interface Question {
  id: number;
  enunciado: string;
  identifier: string;
  year?: number;
  origin?: Origin;
  area?: Area;
  test?: Test;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
  testId?: number;
  testName?: string;
  alternatives: Alternative[];
  correctAlternativeId?: number;
  correctAlternativeIdentifier?: string;
  difficultyLevel?: DifficultyLevel;
  accuracyPercentage?: number;
  totalAttempts?: number;
}

export interface FilterState {
  search: string;
  type: 'all' | 'questions' | 'tests';
  originId: number | '';
  areaId: number | '';
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
  questionCount?: number;
  createdAt?: string;
  updatedAt?: string;
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
