import axios from 'axios';
import { Area, Origin, Question, Test } from '../types';
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
});

export const getQuestions = async (params?: {
  originId?: number | '';
  areaId?: number | '';
  testId?: number | '';
  year?: number | '';
}): Promise<Question[]> => {
  try {
    const queryParams: Record<string, any> = { size: 100 };
    if (params?.originId) queryParams.originId = params.originId;
    if (params?.areaId) queryParams.areaId = params.areaId;
    if (params?.testId) queryParams.testId = params.testId;
    if (params?.year) queryParams.year = params.year;

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
