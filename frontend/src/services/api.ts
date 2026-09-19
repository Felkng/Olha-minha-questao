import axios from 'axios';
import {
  Area,
  AreaCard,
  Folder,
  Origin,
  OriginCard,
  Question,
  QuestionAttemptRequest,
  QuestionAttemptResponse,
  SavedQuestion,
  Test,
  TestCard,
  TestEvaluation,
  TestSubmissionRequest,
  TestSubmissionResponse,
} from '../types';
import { MOCK_AREAS, MOCK_ORIGINS, MOCK_QUESTIONS, MOCK_TESTS } from './mockData';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
});

// Normaliza campos aninhados retornados pela API Spring Data
const normalizeQuestion = (q: any): Question => ({
  ...q,
  originId: q.originId ?? q.origin?.id,
  originName: q.originName ?? q.origin?.name,
  areaId: q.areaId ?? q.area?.id,
  areaName: q.areaName ?? q.area?.name,
  testId: q.testId ?? q.test?.id,
  testName: q.testName ?? q.test?.name,
  difficultyLevel: q.difficultyLevel || 'SEM_DADOS',
  accuracyPercentage: q.accuracyPercentage ?? 0,
  totalAttempts: q.totalAttempts ?? 0,
});

export const getQuestions = async (params?: {
  originId?: number | '';
  areaId?: number | '';
  testId?: number | '';
  year?: number | '';
  difficulty?: string;
  search?: string;
  sort?: string;
}): Promise<Question[]> => {
  try {
    const queryParams: Record<string, any> = { size: 100 };
    if (params?.originId) queryParams.originId = params.originId;
    if (params?.areaId) queryParams.areaId = params.areaId;
    if (params?.testId) queryParams.testId = params.testId;
    if (params?.year) queryParams.year = params.year;
    if (params?.difficulty) queryParams.difficulty = params.difficulty;
    if (params?.search) queryParams.search = params.search;
    if (params?.sort) queryParams.sort = params.sort;

    const response = await apiClient.get('/questions', { params: queryParams });
    const rawList: any[] = response.data?.content || (Array.isArray(response.data) ? response.data : []);

    if (rawList.length > 0) {
      return rawList.map(normalizeQuestion);
    }
    return [];
  } catch (err) {
    console.warn('API /questions error, using mock fallback:', err);
    return MOCK_QUESTIONS;
  }
};

export const submitQuestionAttempt = async (
  questionId: number,
  attempt: QuestionAttemptRequest
): Promise<QuestionAttemptResponse> => {
  const response = await apiClient.post<QuestionAttemptResponse>(`/questions/${questionId}/attempts`, attempt);
  return response.data;
};

export const getOrigins = async (): Promise<Origin[]> => {
  try {
    const response = await apiClient.get<Origin[]>('/origins');
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return MOCK_ORIGINS;
  } catch (err) {
    console.warn('API /origins error, using mock fallback:', err);
    return MOCK_ORIGINS;
  }
};

export const getOriginCards = async (): Promise<OriginCard[]> => {
  try {
    const response = await apiClient.get<OriginCard[]>('/origins/cards');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('API /origins/cards error:', err);
    return [];
  }
};

export const getOriginQuestions = async (originId: number): Promise<Question[]> => {
  try {
    const response = await apiClient.get(`/origins/${originId}/questions`, { params: { size: 100 } });
    const rawList: any[] = response.data?.content || (Array.isArray(response.data) ? response.data : []);
    return rawList.map(normalizeQuestion);
  } catch (err) {
    console.warn(`API /origins/${originId}/questions error:`, err);
    return [];
  }
};

export const getAreas = async (): Promise<Area[]> => {
  try {
    const response = await apiClient.get<Area[]>('/areas');
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return MOCK_AREAS;
  } catch (err) {
    console.warn('API /areas error, using mock fallback:', err);
    return MOCK_AREAS;
  }
};

export const getAreaCards = async (): Promise<AreaCard[]> => {
  try {
    const response = await apiClient.get<AreaCard[]>('/areas/cards');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('API /areas/cards error:', err);
    return [];
  }
};

export const getAreaQuestions = async (areaId: number): Promise<Question[]> => {
  try {
    const response = await apiClient.get(`/areas/${areaId}/questions`, { params: { size: 100 } });
    const rawList: any[] = response.data?.content || (Array.isArray(response.data) ? response.data : []);
    return rawList.map(normalizeQuestion);
  } catch (err) {
    console.warn(`API /areas/${areaId}/questions error:`, err);
    return [];
  }
};

export const getTests = async (): Promise<Test[]> => {
  try {
    const response = await apiClient.get<Test[]>('/tests');
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    return MOCK_TESTS;
  } catch (err) {
    console.warn('API /tests error, using mock fallback:', err);
    return MOCK_TESTS;
  }
};

export const getTestCards = async (): Promise<TestCard[]> => {
  try {
    const response = await apiClient.get<TestCard[]>('/tests/cards');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('API /tests/cards error:', err);
    return [];
  }
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

// ==========================================
// Folders & Saved Questions API
// ==========================================

export const getFolders = async (): Promise<Folder[]> => {
  try {
    const response = await apiClient.get<Folder[]>('/folders');
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('API /folders error:', err);
    return [];
  }
};

export const createFolder = async (folder: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Folder> => {
  const response = await apiClient.post<Folder>('/folders', folder);
  return response.data;
};

export const updateFolder = async (
  id: number,
  folder: { name: string; description?: string; color?: string }
): Promise<Folder> => {
  const response = await apiClient.put<Folder>(`/folders/${id}`, folder);
  return response.data;
};

export const deleteFolder = async (id: number): Promise<void> => {
  await apiClient.delete(`/folders/${id}`);
};

export const getQuestionsInFolder = async (folderId: number): Promise<Question[]> => {
  try {
    const response = await apiClient.get<Question[]>(`/folders/${folderId}/questions`);
    const rawList: any[] = Array.isArray(response.data) ? response.data : [];
    return rawList.map(normalizeQuestion);
  } catch (err) {
    console.warn(`API /folders/${folderId}/questions error:`, err);
    return [];
  }
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
