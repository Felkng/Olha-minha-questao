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

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  user: UserSummary;
  token?: string;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface CategoryPerformance {
  id: number;
  name: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export interface UserComparison {
  userRank: number;
  totalUsers: number;
  topPercentage: number;
  percentileRank: number;
  userAccuracy: number;
  globalAverageAccuracy: number;
  userTotalResolved: number;
  globalAverageResolved: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  totalResolved: number;
  totalCorrectAnswers?: number;
  generalAccuracyPercentage?: number;
  easyAccuracy: number;
  mediumAccuracy: number;
  hardAccuracy: number;
  dailyActivities: DailyActivity[];
  performanceByArea?: CategoryPerformance[];
  performanceBySubject?: CategoryPerformance[];
  performanceByOrigin?: CategoryPerformance[];
  comparison?: UserComparison;
}

export interface TextualReference {
  id?: number | string;
  title?: string;
  subtitle?: string;
  author?: string;
  reference?: string; // URL de onde foi tirado ou citação
  caption?: string;   // Legenda
  content?: string;
  source?: string;
  mediaUrl?: string;
  testId?: number;
}

export interface Test {
  id: number;
  name: string;
  year?: number;
  originId?: number;
  originName?: string;
  areaId?: number;
  areaName?: string;
  questionCount?: number;
  createdByUser?: UserSummary;
  textualReferences?: TextualReference[];
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
  textualReference?: TextualReference;
  textualReferenceId?: number;
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
  userId?: number;
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

export interface PlatformSummary {
  totalQuestions: number;
  totalTests: number;
  activeUsersLast5Days: number;
  totalAttempts: number;
  totalOrigins: number;
  totalAreas: number;
}

export interface TestAttemptSummary {
  id: number;
  testId: number;
  testName: string;
  testYear?: number;
  originName?: string;
  areaName?: string;
  userId?: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  sessionId?: string;
  createdAt: string;
}

export interface TestAttemptDetail {
  id: number;
  testId: number;
  testName: string;
  testYear?: number;
  originName?: string;
  areaName?: string;
  userId?: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  sessionId?: string;
  createdAt: string;
  detailedResults: {
    questionId: number;
    selectedAlternativeId?: number;
    correctAlternativeId?: number;
    isCorrect: boolean;
    difficultyLevel: DifficultyLevel;
  }[];
}

export interface ActiveTestSession {
  testId: number;
  testName: string;
  answers: Record<number, number>;
  timeSpent: number;
  activeQuestionIndex: number;
  totalQuestions: number;
  lastUpdatedTimestamp: number;
}

export interface QuestionBoardResponse {
  id?: number;
  questionId: number;
  userId?: number;
  storagePath?: string;
  fileName?: string;
  xmlContent?: string | null;
  updatedAt?: string;
}

export type BoardTool =
  | 'select'
  | 'pan'
  | 'brush'
  | 'rectangle'
  | 'square'
  | 'triangle'
  | 'star'
  | 'circle'
  | 'text'
  | 'eraser';

export interface BoardPoint {
  x: number;
  y: number;
}

export interface BoardBaseElement {
  id: string;
  color: string;
  rotation?: number; // em graus
  flipX?: boolean;
  flipY?: boolean;
}

export interface BoardBrushElement extends BoardBaseElement {
  type: 'brush';
  width: number;
  points: BoardPoint[];
}

export interface BoardRectElement extends BoardBaseElement {
  type: 'rectangle';
  width: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardSquareElement extends BoardBaseElement {
  type: 'square';
  width: number;
  x: number;
  y: number;
  size: number;
}

export interface BoardTriangleElement extends BoardBaseElement {
  type: 'triangle';
  width: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
}

export interface BoardCircleElement extends BoardBaseElement {
  type: 'circle';
  width: number;
  cx: number;
  cy: number;
  radius: number;
}

export interface BoardStarElement extends BoardBaseElement {
  type: 'star';
  width: number;
  cx: number;
  cy: number;
  spikes: number;
  outerRadius: number;
  innerRadius: number;
}

export interface BoardTextElement extends BoardBaseElement {
  type: 'text';
  fontSize: number;
  x: number;
  y: number;
  text: string;
}

export type BoardElement =
  | BoardBrushElement
  | BoardRectElement
  | BoardSquareElement
  | BoardTriangleElement
  | BoardCircleElement
  | BoardStarElement
  | BoardTextElement;

export interface ParsedAlternative {
  identifier: string;
  text: string;
}

export interface ParsedQuestion {
  identifier: string;
  enunciado: string;
  alternatives: ParsedAlternative[];
}

export interface ParsedExamResponse {
  questions: ParsedQuestion[];
  textualReferences: TextualReference[];
  detectedTitle?: string;
}

export interface ParsedAnswerKey {
  identifier: string;
  correctAlternative: string;
}

export interface AvailableProvaOption {
  id: string;
  name: string;
}

export interface ParsedAnswerKeyResponse {
  answers: ParsedAnswerKey[];
  availableProvas: AvailableProvaOption[];
  selectedProva?: string;
}

export interface TestWithQuestionsRequest {
  name: string;
  year: number;
  originId?: number | null;
  areaId?: number | null;
  description?: string;
  textualReferences?: {
    title?: string;
    subtitle?: string;
    content?: string;
    author?: string;
    reference?: string;
    caption?: string;
    source?: string;
    mediaUrl?: string;
  }[];
  questions: {
    enunciado: string;
    identifier?: string;
    year?: number;
    originId?: number | null;
    areaId?: number | null;
    subjectId?: number | null;
    correctAlternativeId?: number | null;
    textualReferenceId?: number | null;
    textualReferenceIndex?: number | null;
    alternatives: {
      identifier: string;
      text: string;
      isCorrect?: boolean;
    }[];
  }[];
}


