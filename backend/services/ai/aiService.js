import { runStructured } from './client.js';
import * as P from './prompts.js';
import * as S from './schemas.js';

export const analyzeResume = (text) => runStructured({ ...P.resumeAnalysisPrompt(text), schema: S.resumeAnalysisSchema, maxTokens: 4000 });
export const detectDomain = (text) => runStructured({ ...P.domainDetectionPrompt(text), schema: S.domainDetectionSchema, maxTokens: 800 });
export const generateQuestions = (input) => runStructured({ ...P.questionGenerationPrompt(input), schema: S.questionBatchSchema, maxTokens: 6000 });
export const evaluateAnswer = (input) => runStructured({ ...P.answerEvaluationPrompt(input), schema: S.evaluationSchema, maxTokens: 1500 });
export const nextInterviewTurn = (input) => runStructured({ ...P.interviewTurnPrompt(input), schema: S.nextTurnSchema, maxTokens: 500 });
export const interviewReport = (input) => runStructured({ ...P.interviewReportPrompt(input), schema: S.interviewReportSchema, maxTokens: 1500 });
export const matchJob = (input) => runStructured({ ...P.jobMatchPrompt(input), schema: S.jobMatchSchema, maxTokens: 2000 });
export const generateLearningPlan = (input) => runStructured({ ...P.learningPlanPrompt(input), schema: S.learningPlanSchema, maxTokens: 3500 });
export const generateRecommendations = (input) => runStructured({ ...P.recommendationsPrompt(input), schema: S.recommendationsSchema, maxTokens: 1500 });
export const improveResume = (input) => runStructured({ ...P.resumeImprovementPrompt(input), schema: S.resumeImprovementSchema, maxTokens: 2500 });
export { summarizeAnalysis } from './prompts.js';
