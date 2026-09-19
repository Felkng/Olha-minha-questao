import axios from 'axios';
import { Area, Origin, Question, Test } from '../types';
import { MOCK_AREAS, MOCK_ORIGINS, MOCK_QUESTIONS, MOCK_TESTS } from './mockData';

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 5000,
});

export const getQuestions = async (): Promise<Question[]> => {
  try {
    const response = await apiClient.get<Question[]>('/questions');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    return MOCK_QUESTIONS;
  } catch (err) {
    console.warn('API /questions unavailable or empty, using mock data:', err);
    return MOCK_QUESTIONS;
  }
};

export const getOrigins = async (): Promise<Origin[]> => {
  try {
    const response = await apiClient.get<Origin[]>('/origins');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    return MOCK_ORIGINS;
  } catch (err) {
    return MOCK_ORIGINS;
  }
};

export const getAreas = async (): Promise<Area[]> => {
  try {
    const response = await apiClient.get<Area[]>('/areas');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    return MOCK_AREAS;
  } catch (err) {
    return MOCK_AREAS;
  }
};

export const getTests = async (): Promise<Test[]> => {
  try {
    const response = await apiClient.get<Test[]>('/tests');
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    return MOCK_TESTS;
  } catch (err) {
    return MOCK_TESTS;
  }
};
