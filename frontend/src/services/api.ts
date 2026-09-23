import axios from 'axios';
import {
  Area,
  AreaCard,
  Folder,
  FolderType,
  Origin,
  OriginCard,
  PageResponse,
  Question,
  QuestionAttemptRequest,
  QuestionAttemptResponse,
  SavedQuestion,
  Subject,
  Test,
  TestCard,
  TestEvaluation,
  TestSubmissionRequest,
  TestSubmissionResponse,
  AuthResponse,
  UserProfile,
  UserSummary,
  QuestionBoardResponse,
  ParsedExamResponse,
  ParsedAnswerKeyResponse,
  TestWithQuestionsRequest,
  TestAttemptSummary,
  TestAttemptDetail,
  PlatformSummary,
  UserUpdateRequest,
  Flashcard,
  FlashcardRequest,
  FlashcardSession,
  FlashcardSessionRequest,
  QuestionAttemptHistory,
} from '../types';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) {
        config.headers['X-User-Id'] = user.id;
      }
    } catch (e) {
      // ignore error
    }
  }
  return config;
});

// Auth & User API
export const loginUser = async (data: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await apiClient.post<any>('/auth/login', data);
  const d = response.data;
  const user: UserSummary = d.user || {
    id: d.id,
    name: d.name,
    email: d.email,
    role: d.role,
  };
  return {
    token: d.token,
    user,
  };
};

export const registerUser = async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
  const response = await apiClient.post<any>('/auth/register', data);
  const d = response.data;
  const user: UserSummary = d.user || {
    id: d.id,
    name: d.name,
    email: d.email,
    role: d.role,
  };
  return {
    token: d.token,
    user,
  };
};

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const response = await apiClient.get<any>(`/users/${userId}/profile`);
  const d = response.data;
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    role: d.role,
    createdAt: d.createdAt,
    totalResolved: d.totalResolved ?? d.totalQuestionsResolved ?? 0,
    totalCorrectAnswers: d.totalCorrectAnswers ?? 0,
    generalAccuracyPercentage: d.generalAccuracyPercentage ?? 0,
    easyAccuracy: d.easyAccuracy ?? d.easyAccuracyPercentage ?? 0,
    mediumAccuracy: d.mediumAccuracy ?? d.mediumAccuracyPercentage ?? 0,
    hardAccuracy: d.hardAccuracy ?? d.hardAccuracyPercentage ?? 0,
    dailyActivities: d.dailyActivities || d.dailyActivity || [],
    performanceByArea: d.performanceByArea || [],
    performanceBySubject: d.performanceBySubject || [],
    performanceByOrigin: d.performanceByOrigin || [],
    comparison: d.comparison,
  };
};

export const promoteUserToAdmin = async (userId: number): Promise<UserSummary> => {
  const response = await apiClient.patch<UserSummary>(`/users/${userId}/promote-admin`);
  return response.data;
};

export const updateUser = async (
  userId: number,
  data: UserUpdateRequest
): Promise<UserSummary> => {
  const response = await apiClient.put<UserSummary>(`/users/${userId}`, data);
  return response.data;
};

export const getAttemptedQuestionIds = async (userId: number): Promise<number[]> => {
  const response = await apiClient.get<number[]>(`/questions/attempted-ids`, { params: { userId } });
  return Array.isArray(response.data) ? response.data : [];
};

// Normaliza campos aninhados retornados pela API Spring Data
const normalizeQuestion = (q: any): Question => ({
  ...q,
  originId: q.originId ?? q.origin?.id,
  originName: q.originName ?? q.origin?.name,
  areaId: q.areaId ?? q.area?.id,
  areaName: q.areaName ?? q.area?.name,
  subjectId: q.subjectId ?? q.subject?.id,
  subjectName: q.subjectName ?? q.subject?.name,
  testId: q.testId ?? q.test?.id,
  testName: q.testName ?? q.test?.name,
  textualReference: q.textualReference ?? undefined,
  textualReferenceId: q.textualReferenceId ?? q.textualReference?.id,
  difficultyLevel: q.difficultyLevel || 'SEM_DADOS',
  accuracyPercentage: q.accuracyPercentage ?? 0,
  totalAttempts: q.totalAttempts ?? 0,
});

export const getQuestions = async (params?: {
  originId?: number | '';
  areaId?: number | '';
  subjectId?: number | '';
  testId?: number | '';
  year?: number | '';
  difficulty?: string;
  search?: string;
  sort?: string;
  createdByUserId?: number | '';
  page?: number;
  size?: number;
}): Promise<PageResponse<Question>> => {
  try {
    const page = params?.page ?? 0;
    const size = params?.size ?? 5;
    const queryParams: Record<string, any> = { page, size };

    if (params?.originId) queryParams.originId = params.originId;
    if (params?.areaId) queryParams.areaId = params.areaId;
    if (params?.testId) queryParams.testId = params.testId;
    if (params?.year) queryParams.year = params.year;
    if (params?.difficulty) queryParams.difficulty = params.difficulty;
    if (params?.search) queryParams.search = params.search;
    if (params?.sort && params.sort !== 'recent') queryParams.sort = params.sort;
    if (params?.createdByUserId) queryParams.createdByUserId = params.createdByUserId;

    const response = await apiClient.get('/questions', { params: queryParams });
    const data = response.data;

    if (data && Array.isArray(data.content)) {
      return {
        ...data,
        content: data.content.map(normalizeQuestion),
      };
    }

    return {
      content: Array.isArray(data) ? data.map(normalizeQuestion) : [],
      totalPages: 1,
      totalElements: Array.isArray(data) ? data.length : 0,
      number: page,
      size,
      first: page === 0,
      last: true,
    };
  } catch (err) {
    console.warn('API /questions error:', err);
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 5,
      first: true,
      last: true,
    };
  }
};

export const getQuestionById = async (id: number): Promise<Question> => {
  const response = await apiClient.get(`/questions/${id}`);
  return normalizeQuestion(response.data);
};

export const createQuestion = async (questionData: {
  enunciado: string;
  identifier?: string;
  year: number;
  originId?: number;
  areaId: number;
  subjectId?: number;
  testId?: number;
  textualReferenceId?: number | null;
  isPublic?: boolean;
  alternatives: { identifier: string; text: string; isCorrect?: boolean }[];
}): Promise<Question> => {
  const response = await apiClient.post('/questions', questionData);
  return normalizeQuestion(response.data);
};

export const updateQuestion = async (
  id: number,
  questionData: {
    enunciado: string;
    identifier?: string;
    year: number;
    originId?: number;
    areaId: number;
    subjectId?: number;
    testId?: number;
    textualReferenceId?: number | null;
    isPublic?: boolean;
    alternatives: { identifier: string; text: string; isCorrect?: boolean }[];
  }
): Promise<Question> => {
  const response = await apiClient.put(`/questions/${id}`, questionData);
  return normalizeQuestion(response.data);
};

export const toggleQuestionVisibility = async (id: number): Promise<Question> => {
  const response = await apiClient.patch(`/questions/${id}/visibility`);
  return normalizeQuestion(response.data);
};

export const deleteQuestion = async (id: number): Promise<void> => {
  await apiClient.delete(`/questions/${id}`);
};

export const submitQuestionAttempt = async (
  questionId: number,
  attempt: QuestionAttemptRequest
): Promise<QuestionAttemptResponse> => {
  const response = await apiClient.post<QuestionAttemptResponse>(`/questions/${questionId}/attempts`, attempt);
  return response.data;
};

// Bancas / Origins
export const getOrigins = async (): Promise<Origin[]> => {
  const response = await apiClient.get<Origin[]>('/origins');
  return Array.isArray(response.data) ? response.data : [];
};

export const getOriginCards = async (): Promise<OriginCard[]> => {
  const response = await apiClient.get<OriginCard[]>('/origins/cards');
  return Array.isArray(response.data) ? response.data : [];
};

export const createOrigin = async (origin: { name: string; description?: string }): Promise<Origin> => {
  const response = await apiClient.post<Origin>('/origins', origin);
  return response.data;
};

export const updateOrigin = async (id: number, origin: { name: string; description?: string }): Promise<Origin> => {
  const response = await apiClient.put<Origin>(`/origins/${id}`, origin);
  return response.data;
};

export const deleteOrigin = async (id: number): Promise<void> => {
  await apiClient.delete(`/origins/${id}`);
};

export const getOriginQuestions = async (originId: number): Promise<Question[]> => {
  const response = await apiClient.get(`/origins/${originId}/questions`, { params: { size: 100 } });
  const rawList: any[] = response.data?.content || (Array.isArray(response.data) ? response.data : []);
  return rawList.map(normalizeQuestion);
};

// Áreas / Areas
export const getAreas = async (): Promise<Area[]> => {
  const response = await apiClient.get<Area[]>('/areas');
  return Array.isArray(response.data) ? response.data : [];
};

export const getAreaCards = async (): Promise<AreaCard[]> => {
  const response = await apiClient.get<AreaCard[]>('/areas/cards');
  return Array.isArray(response.data) ? response.data : [];
};

export const createArea = async (area: { name: string; description?: string }): Promise<Area> => {
  const response = await apiClient.post<Area>('/areas', area);
  return response.data;
};

export const updateArea = async (id: number, area: { name: string; description?: string }): Promise<Area> => {
  const response = await apiClient.put<Area>(`/areas/${id}`, area);
  return response.data;
};

export const deleteArea = async (id: number): Promise<void> => {
  await apiClient.delete(`/areas/${id}`);
};

export const getAreaQuestions = async (areaId: number): Promise<Question[]> => {
  const response = await apiClient.get(`/areas/${areaId}/questions`, { params: { size: 100 } });
  const rawList: any[] = response.data?.content || (Array.isArray(response.data) ? response.data : []);
  return rawList.map(normalizeQuestion);
};

// Matérias / Subjects
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>('/subjects');
  return Array.isArray(response.data) ? response.data : [];
};

export const getSubjectsByArea = async (areaId: number): Promise<Subject[]> => {
  const response = await apiClient.get<Subject[]>(`/subjects/by-area/${areaId}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const createSubject = async (subject: { name: string; description?: string; areaId: number }): Promise<Subject> => {
  const response = await apiClient.post<Subject>('/subjects', subject);
  return response.data;
};

export const updateSubject = async (
  id: number,
  subject: { name: string; description?: string; areaId: number }
): Promise<Subject> => {
  const response = await apiClient.put<Subject>(`/subjects/${id}`, subject);
  return response.data;
};

export const deleteSubject = async (id: number): Promise<void> => {
  await apiClient.delete(`/subjects/${id}`);
};

// Provas / Tests
export const getTests = async (params?: {
  originId?: number;
  areaId?: number;
  year?: number;
  createdByUserId?: number;
}): Promise<Test[]> => {
  const response = await apiClient.get<Test[]>('/tests', { params });
  return Array.isArray(response.data) ? response.data : [];
};

export const getTestById = async (id: number): Promise<Test> => {
  const response = await apiClient.get<Test>(`/tests/${id}`);
  return response.data;
};

export const getTestCards = async (): Promise<TestCard[]> => {
  const response = await apiClient.get<TestCard[]>('/tests/cards');
  return Array.isArray(response.data) ? response.data : [];
};

export const createTest = async (testData: {
  name: string;
  year: number;
  originId?: number;
  areaId?: number;
  description?: string;
  isPublic?: boolean;
}): Promise<Test> => {
  const response = await apiClient.post<Test>('/tests', testData);
  return response.data;
};

export const updateTest = async (
  id: number,
  testData: {
    name: string;
    year: number;
    originId?: number;
    areaId?: number;
    description?: string;
    isPublic?: boolean;
  }
): Promise<Test> => {
  const response = await apiClient.put<Test>(`/tests/${id}`, testData);
  return response.data;
};

export const toggleTestVisibility = async (id: number): Promise<Test> => {
  const response = await apiClient.patch<Test>(`/tests/${id}/visibility`);
  return response.data;
};

export const deleteTest = async (id: number): Promise<void> => {
  await apiClient.delete(`/tests/${id}`);
};

export const createTestWithQuestions = async (
  data: TestWithQuestionsRequest
): Promise<Test> => {
  const response = await apiClient.post<Test>('/tests/with-questions', data);
  return response.data;
};

export const parseExamPdf = async (file: File): Promise<ParsedExamResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ParsedExamResponse>('/tests/parse-exam-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return {
    questions: Array.isArray(response.data?.questions) ? response.data.questions : [],
    textualReferences: Array.isArray(response.data?.textualReferences) ? response.data.textualReferences : [],
    detectedTitle: response.data?.detectedTitle,
  };
};

export const parseAnswerKeyPdf = async (file: File, provaName?: string): Promise<ParsedAnswerKeyResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const params: Record<string, string> = {};
  if (provaName) params.provaName = provaName;

  const response = await apiClient.post<ParsedAnswerKeyResponse>('/tests/parse-answer-key-pdf', formData, {
    params,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return {
    answers: Array.isArray(response.data?.answers) ? response.data.answers : [],
    availableProvas: Array.isArray(response.data?.availableProvas) ? response.data.availableProvas : [],
    selectedProva: response.data?.selectedProva,
  };
};

export const getTestEvaluation = async (testId: number): Promise<TestEvaluation> => {
  const response = await apiClient.get<TestEvaluation>(`/tests/${testId}/evaluation`);
  return {
    ...response.data,
    questions: (response.data.questions || []).map(normalizeQuestion),
  };
};

export const submitTest = async (
  testId: number,
  submission: TestSubmissionRequest
): Promise<TestSubmissionResponse> => {
  const response = await apiClient.post<TestSubmissionResponse>(`/tests/${testId}/submit`, submission);
  return response.data;
};

export const getTestAttempts = async (
  testId: number,
  userId?: number
): Promise<TestAttemptSummary[]> => {
  const params: Record<string, any> = {};
  if (userId) params.userId = userId;
  const response = await apiClient.get<TestAttemptSummary[]>(`/tests/${testId}/attempts`, { params });
  return Array.isArray(response.data) ? response.data : [];
};

export const getUserTestAttempts = async (
  userId: number
): Promise<TestAttemptSummary[]> => {
  const response = await apiClient.get<TestAttemptSummary[]>(`/tests/user-attempts/${userId}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const getTestAttemptDetail = async (
  attemptId: number
): Promise<TestAttemptDetail> => {
  const response = await apiClient.get<TestAttemptDetail>(`/tests/attempts/${attemptId}`);
  return response.data;
};

// Estatísticas Públicas da Plataforma (Landing Page)
export const getPlatformSummary = async (): Promise<PlatformSummary> => {
  const response = await apiClient.get<PlatformSummary>('/statistics/summary');
  return response.data;
};

// Pastas & Salvamentos (Questões & Provas)
export const getFolders = async (type?: FolderType, createdByUserId?: number): Promise<Folder[]> => {
  try {
    const params: Record<string, any> = {};
    if (type) params.type = type;
    if (createdByUserId) params.createdByUserId = createdByUserId;
    const response = await apiClient.get<Folder[]>('/folders', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('API /folders error:', err);
    return [];
  }
};

export const getFolderById = async (id: number): Promise<Folder> => {
  const response = await apiClient.get<Folder>(`/folders/${id}`);
  return response.data;
};

export const createFolder = async (folder: {
  name: string;
  description?: string;
  color?: string;
  folderType?: FolderType;
  isPublic?: boolean;
}): Promise<Folder> => {
  const response = await apiClient.post<Folder>('/folders', folder);
  return response.data;
};

export const updateFolder = async (
  id: number,
  folder: { name: string; description?: string; color?: string; folderType?: FolderType; isPublic?: boolean }
): Promise<Folder> => {
  const response = await apiClient.put<Folder>(`/folders/${id}`, folder);
  return response.data;
};

export const toggleFolderVisibility = async (id: number): Promise<Folder> => {
  const response = await apiClient.patch<Folder>(`/folders/${id}/visibility`);
  return response.data;
};

export const deleteFolder = async (id: number): Promise<void> => {
  await apiClient.delete(`/folders/${id}`);
};

// Questões em Pastas
export const getQuestionsInFolder = async (folderId: number): Promise<Question[]> => {
  const response = await apiClient.get<Question[]>(`/folders/${folderId}/questions`);
  const rawList: any[] = Array.isArray(response.data) ? response.data : [];
  return rawList.map(normalizeQuestion);
};

export const addQuestionToFolder = async (
  folderId: number,
  questionId: number,
  notes?: string
): Promise<SavedQuestion> => {
  const response = await apiClient.post<SavedQuestion>(
    `/folders/${folderId}/questions/${questionId}`,
    null,
    { params: { notes } }
  );
  return response.data;
};

export const removeQuestionFromFolder = async (
  folderId: number,
  questionId: number
): Promise<void> => {
  await apiClient.delete(`/folders/${folderId}/questions/${questionId}`);
};

export const getFolderIdsForQuestion = async (questionId: number): Promise<number[]> => {
  try {
    const response = await apiClient.get<number[]>(`/folders/by-question/${questionId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn(`API /folders/by-question/${questionId} error:`, err);
    return [];
  }
};

// Provas em Pastas
export const getTestsInFolder = async (folderId: number): Promise<TestCard[]> => {
  const response = await apiClient.get<TestCard[]>(`/folders/${folderId}/tests`);
  return Array.isArray(response.data) ? response.data : [];
};

export const addTestToFolder = async (
  folderId: number,
  testId: number,
  notes?: string
): Promise<void> => {
  await apiClient.post(`/folders/${folderId}/tests/${testId}`, null, { params: { notes } });
};

export const removeTestFromFolder = async (
  folderId: number,
  testId: number
): Promise<void> => {
  await apiClient.delete(`/folders/${folderId}/tests/${testId}`);
};

export const getFolderIdsForTest = async (testId: number): Promise<number[]> => {
  try {
    const response = await apiClient.get<number[]>(`/folders/by-test/${testId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn(`API /folders/by-test/${testId} error:`, err);
    return [];
  }
};

// Lousa de Raciocínio (Whiteboard)
export const getQuestionBoard = async (questionId: number): Promise<QuestionBoardResponse | null> => {
  try {
    const response = await apiClient.get<QuestionBoardResponse>(`/questions/${questionId}/board`);
    return response.data;
  } catch (err) {
    console.warn(`API /questions/${questionId}/board error:`, err);
    return null;
  }
};

export const saveQuestionBoard = async (
  questionId: number,
  xmlContent: string
): Promise<QuestionBoardResponse> => {
  const response = await apiClient.put<QuestionBoardResponse>(
    `/questions/${questionId}/board`,
    { xmlContent }
  );
  return response.data;
};

// ==========================================
// Flashcards & Sessões de Estudo
// ==========================================

export const getFlashcards = async (params?: {
  areaId?: number | '';
  subjectId?: number | '';
  folderId?: number | '';
  search?: string;
  createdByUserId?: number | '';
  page?: number;
  size?: number;
}): Promise<PageResponse<Flashcard>> => {
  try {
    const page = params?.page ?? 0;
    const size = params?.size ?? 50;
    const queryParams: Record<string, any> = { page, size };

    if (params?.areaId) queryParams.areaId = params.areaId;
    if (params?.subjectId) queryParams.subjectId = params.subjectId;
    if (params?.folderId) queryParams.folderId = params.folderId;
    if (params?.search) queryParams.search = params.search;
    if (params?.createdByUserId) queryParams.createdByUserId = params.createdByUserId;

    const response = await apiClient.get('/flashcards', { params: queryParams });
    const data = response.data;

    if (data && Array.isArray(data.content)) {
      return data;
    }

    return {
      content: Array.isArray(data) ? data : [],
      totalPages: 1,
      totalElements: Array.isArray(data) ? data.length : 0,
      number: page,
      size,
      first: page === 0,
      last: true,
    };
  } catch (err) {
    console.warn('API /flashcards error:', err);
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 50,
      first: true,
      last: true,
    };
  }
};

export const getFlashcardById = async (id: number): Promise<Flashcard> => {
  const response = await apiClient.get<Flashcard>(`/flashcards/${id}`);
  return response.data;
};

export const createFlashcard = async (data: FlashcardRequest): Promise<Flashcard> => {
  const response = await apiClient.post<Flashcard>('/flashcards', data);
  return response.data;
};

export const updateFlashcard = async (id: number, data: FlashcardRequest): Promise<Flashcard> => {
  const response = await apiClient.put<Flashcard>(`/flashcards/${id}`, data);
  return response.data;
};

export const toggleFlashcardVisibility = async (id: number): Promise<Flashcard> => {
  const response = await apiClient.patch<Flashcard>(`/flashcards/${id}/visibility`);
  return response.data;
};

export const deleteFlashcard = async (id: number): Promise<void> => {
  await apiClient.delete(`/flashcards/${id}`);
};

export const getFlashcardsInFolder = async (folderId: number): Promise<Flashcard[]> => {
  try {
    const response = await apiClient.get<Flashcard[]>(`/folders/${folderId}/flashcards`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn(`API /folders/${folderId}/flashcards error:`, err);
    return [];
  }
};

export const submitFlashcardSession = async (
  sessionData: FlashcardSessionRequest
): Promise<FlashcardSession> => {
  const response = await apiClient.post<FlashcardSession>('/flashcards/sessions', sessionData);
  return response.data;
};

export const getMyFlashcardSessions = async (): Promise<FlashcardSession[]> => {
  try {
    const response = await apiClient.get<FlashcardSession[]>('/flashcards/sessions/my');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('API /flashcards/sessions/my error:', err);
    return [];
  }
};

// Histórico de Questões do Usuário (Tentativas)
export const getUserQuestionAttempts = async (userId: number): Promise<QuestionAttemptHistory[]> => {
  try {
    const response = await apiClient.get<QuestionAttemptHistory[]>(`/users/${userId}/question-attempts`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn(`API /users/${userId}/question-attempts error:`, err);
    return [];
  }
};

// Flashcards em Pastas (N:N)
export const addFlashcardToFolder = async (
  folderId: number,
  flashcardId: number,
  notes?: string
): Promise<void> => {
  await apiClient.post(`/folders/${folderId}/flashcards/${flashcardId}`, null, { params: { notes } });
};

export const removeFlashcardFromFolder = async (
  folderId: number,
  flashcardId: number
): Promise<void> => {
  await apiClient.delete(`/folders/${folderId}/flashcards/${flashcardId}`);
};

export const getFolderIdsForFlashcard = async (flashcardId: number): Promise<number[]> => {
  try {
    const response = await apiClient.get<number[]>(`/folders/by-flashcard/${flashcardId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn(`API /folders/by-flashcard/${flashcardId} error:`, err);
    return [];
  }
};

// Questões em Provas/Simulados (N:N)
export const addQuestionToTest = async (testId: number, questionId: number): Promise<void> => {
  await apiClient.post(`/tests/${testId}/questions/${questionId}`);
};

export const removeQuestionFromTest = async (testId: number, questionId: number): Promise<void> => {
  await apiClient.delete(`/tests/${testId}/questions/${questionId}`);
};

export const getTestIdsForQuestion = async (questionId: number): Promise<number[]> => {
  try {
    const response = await apiClient.get<number[]>(`/tests/by-question/${questionId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn(`API /tests/by-question/${questionId} error:`, err);
    return [];
  }
};


