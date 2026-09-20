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
  ParsedQuestion,
  ParsedAnswerKey,
  TestWithQuestionsRequest,
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
  alternatives: { identifier: string; text: string; isCorrect?: boolean }[];
}): Promise<Question> => {
  const response = await apiClient.post('/questions', questionData);
  return normalizeQuestion(response.data);
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

export const getTestById = async (id: number): Promise<TestCard> => {
  const response = await apiClient.get<TestCard>(`/tests/${id}`);
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
}): Promise<Test> => {
  const response = await apiClient.post<Test>('/tests', testData);
  return response.data;
};

export const createTestWithQuestions = async (
  data: TestWithQuestionsRequest
): Promise<Test> => {
  const response = await apiClient.post<Test>('/tests/with-questions', data);
  return response.data;
};

export const parseExamPdf = async (file: File): Promise<ParsedQuestion[]> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ParsedQuestion[]>('/tests/parse-exam-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return Array.isArray(response.data) ? response.data : [];
};

export const parseAnswerKeyPdf = async (file: File): Promise<ParsedAnswerKey[]> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ParsedAnswerKey[]>('/tests/parse-answer-key-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return Array.isArray(response.data) ? response.data : [];
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

// Pastas & Salvamentos (Questões & Provas)
export const getFolders = async (type?: FolderType): Promise<Folder[]> => {
  try {
    const response = await apiClient.get<Folder[]>('/folders', { params: type ? { type } : {} });
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
}): Promise<Folder> => {
  const response = await apiClient.post<Folder>('/folders', folder);
  return response.data;
};

export const updateFolder = async (
  id: number,
  folder: { name: string; description?: string; color?: string; folderType?: FolderType }
): Promise<Folder> => {
  const response = await apiClient.put<Folder>(`/folders/${id}`, folder);
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
