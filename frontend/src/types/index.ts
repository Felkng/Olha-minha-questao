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
}

export interface FilterState {
  search: string;
  type: 'all' | 'questions' | 'tests';
  originId: number | '';
  areaId: number | '';
  year: number | '';
  testId: number | '';
}
