export interface GoogleSpeechResult {
    alternatives: {
      transcript: string;
      confidence: number;
    }[];
    languageCode?: string;
    resultEndTime?: string;
  }
  
//   export interface GoogleSpeechResponse {
//     results?: GoogleSpeechResult[];
//     error?: {
//       code: number;
//       message: string;
//       status: string;
//     };
//   }