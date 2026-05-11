import { apiClient } from './client';

export const aiApi = {
  generateContent: (prompt: string) =>
    apiClient.post('/ai/generate-content', { prompt }),
  analyzeEvent: (eventData: any) =>
    apiClient.post('/ai/analyze-event', eventData),
};
