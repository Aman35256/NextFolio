import { runPythonAgent } from '../agents/PythonAgentBridge.js';

/**
 * CommunicationAnalysisService
 * Analyzes user responses for fluency, pace, confidence, grammar, STAR structure, etc.
 */

export default class CommunicationAnalysisService {
  constructor() {
    this.hasApiKey = !!process.env.OPENAI_API_KEY;

    this.fillerWords = [
      'um', 'uh', 'like', 'actually', 'basically', 'literally',
      'you know', 'i mean', 'so', 'well', 'essentially', 'kind of',
      'sort of', 'fairly', 'really', 'quite', 'honestly', 'frankly'
    ];

    this.starFrameworkKeywords = {
      situation: ['situation', 'scenario', 'context', 'background', 'was', 'were', 'had'],
      task: ['task', 'goal', 'objective', 'need', 'needed', 'required', 'had to'],
      action: ['action', 'did', 'implemented', 'created', 'built', 'developed', 'took', 'performed'],
      result: ['result', 'outcome', 'achieved', 'accomplished', 'improved', 'succeeded', 'delivered']
    };
  }

  /**
   * Comprehensive analysis of a user response
   */
  async analyzeResponse(transcript, audioMetadata = {}, context = {}, audioAnalysis = null) {
    const { question = 'General Interview Question', persona = 'Senior Engineer', role = 'Software Engineer', company = 'Company', difficulty = 'medium' } = context;
    
    let analysisResult = null;
    
    if (this.hasApiKey) {
      try {
        analysisResult = await runPythonAgent('communication.analyze', { transcript, audioMetadata, context });
      } catch (err) {
        console.error('Python agent communication analysis failed, falling back to heuristics:', err);
      }
    }

    if (!analysisResult) {
      // Fallback to rules-based heuristics
      const fluencyScore = this.calculateFluencyScore(transcript);
      const clarityScore = this.calculateClarityScore(transcript);
      const pronunciationScore = this.calculatePronunciationScore(transcript);
      const confidenceScore = this.calculateConfidenceScore(transcript, audioMetadata);
      const grammarScore = this.calculateGrammarScore(transcript);
      const vocabularyScore = this.calculateVocabularyScore(transcript);
      const responseStructureScore = this.calculateResponseStructureScore(transcript);
      const starFrameworkScore = this.detectStarFramework(transcript);
      const fillers = this.detectFillers(transcript);
      const grammarIssues = this.detectGrammarIssues(transcript).map(i => i.message || i.example || 'General structure issue');
      const speakingPace = this.calculateSpeakingPace(transcript, audioMetadata);
      
      analysisResult = {
        fluencyScore,
        pronunciationScore,
        mispronouncedWords: [],
        speakingPace,
        fillers,
        grammarScore,
        grammarIssues,
        vocabularyScore,
        vocabularyFeedback: 'Simple vocabulary baseline.',
        confidenceScore,
        responseStructureScore,
        starFrameworkScore,
        starMissingSections: starFrameworkScore < 100 ? ['Result'] : [],
        technicalScore: 70, // generic fallback
        technicalFeedback: 'Completed response baseline.',
        suggestions: ['Practice speaking slower.', 'Incorporate more technical details.']
      };
    }

    // Merge SpeakSmart AI physical audio analysis if available
    if (audioAnalysis && audioAnalysis.success !== false) {
      analysisResult.confidenceScore = Math.round(
        (analysisResult.confidenceScore || 70) * 0.4 + (audioAnalysis.confidenceScore || 70) * 0.6
      );
      analysisResult.nervousnessScore = audioAnalysis.nervousnessScore || 0;
      analysisResult.pitchHistory = audioAnalysis.pitchHistory || [];
      analysisResult.rmsHistory = audioAnalysis.rmsHistory || [];
      analysisResult.timestamps = audioAnalysis.timestamps || [];
      analysisResult.confidenceHistory = audioAnalysis.confidenceHistory || [];
      analysisResult.nervousMoments = audioAnalysis.nervousMoments || [];
      analysisResult.audioSuggestions = audioAnalysis.suggestions || [];
      analysisResult.metrics = audioAnalysis.metrics || {};
      
      if (audioAnalysis.speakingRate > 0) {
        analysisResult.speakingPace = {
          wpm: audioAnalysis.speakingRate,
          pace: audioAnalysis.speakingRate < 110 ? 'slow' : audioAnalysis.speakingRate < 160 ? 'natural' : 'fast'
        };
      }

      if (audioAnalysis.suggestions && audioAnalysis.suggestions.length > 0) {
        analysisResult.suggestions = [
          ...new Set([...(analysisResult.suggestions || []), ...audioAnalysis.suggestions])
        ];
      }
    }

    // Calculate aggregated scores
    analysisResult.clarityScore = Math.round((analysisResult.fluencyScore + analysisResult.pronunciationScore) / 2);
    analysisResult.communicationScore = this.calculateCommunicationScore(analysisResult);

    return analysisResult;
  }

  /**
   * Calculate fluency score (0-100)
   * Measures: smoothness, flow, hesitation
   */
  calculateFluencyScore(transcript) {
    if (!transcript || transcript.length === 0) return 0;

    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = transcript.split(/\s+/).length;

    // Penalties for hesitations, long pauses
    let penalties = 0;
    
    // Detect ellipses and dashes (hesitations)
    const hesitations = (transcript.match(/\.\.\.|—/g) || []).length;
    penalties += hesitations * 5;

    // Short sentences are often less fluent
    const shortSentenceCount = sentences.filter(s => s.split(/\s+/).length < 5).length;
    penalties += (shortSentenceCount / sentences.length) * 15;

    let score = 100 - penalties;
    score = Math.max(0, Math.min(100, score));

    // Bonus for longer, coherent responses
    if (words > 100) score += 10;
    if (words > 200) score += 5;

    return Math.round(score);
  }

  /**
   * Calculate clarity score (0-100)
   * Based on sentence structure and word choice
   */
  calculateClarityScore(transcript) {
    if (!transcript || transcript.length === 0) return 0;

    let score = 70; // Base score
    const words = transcript.split(/\s+/);
    
    // Positive indicators
    if (words.length > 50) score += 10;
    if (transcript.includes('specifically') || transcript.includes('for example')) score += 10;
    if (transcript.includes('therefore') || transcript.includes('as a result')) score += 5;

    // Negative indicators
    const complexJargon = (transcript.match(/\b(paradigm|synergy|leverage|holistic|interface)\b/gi) || []).length;
    score -= Math.min(15, complexJargon * 3);

    const vaguePhrases = (transcript.match(/\b(thing|stuff|something|whatever|kinda|sorta)\b/gi) || []).length;
    score -= Math.min(20, vaguePhrases * 2);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate pronunciation score (0-100)
   * Estimated based on sentence structure and technical accuracy
   */
  calculatePronunciationScore(transcript) {
    if (!transcript || transcript.length === 0) return 0;

    let score = 80; // Assume good pronunciation as baseline
    
    // Lack of phonetic issues indicators (would need actual audio analysis for real pronunciation)
    const repetitions = (transcript.match(/\b(\w+)\s+\1\b/gi) || []).length;
    score -= Math.min(10, repetitions * 3);

    // Proper terminology usage
    const technicalTerms = (transcript.match(/\b(algorithm|database|cache|API|framework)\b/gi) || []).length;
    if (technicalTerms > 0) score += Math.min(15, technicalTerms * 2);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate confidence score (0-100)
   * Based on language patterns and hesitations
   */
  calculateConfidenceScore(transcript, audioMetadata = {}) {
    if (!transcript || transcript.length === 0) return 0;

    let score = 70;

    // Confident language
    const confidentPhrases = (transcript.match(/\b(I am confident|I know|I'm sure|definitely|absolutely|clearly)\b/gi) || []).length;
    score += Math.min(15, confidentPhrases * 3);

    // Uncertain language
    const uncertainPhrases = (transcript.match(/\b(I think|I guess|I'm not sure|maybe|perhaps|might)\b/gi) || []).length;
    score -= Math.min(20, uncertainPhrases * 3);

    // Filler words reduce confidence
    const fillerCount = this.detectFillers(transcript).length;
    score -= Math.min(15, fillerCount * 1.5);

    // Audio energy (if available)
    if (audioMetadata.avgEnergy) {
      if (audioMetadata.avgEnergy < 0.3) score -= 10;
      if (audioMetadata.avgEnergy > 0.7) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate grammar score (0-100)
   * Simple heuristic-based grammar analysis
   */
  calculateGrammarScore(transcript) {
    if (!transcript || transcript.length === 0) return 0;

    let score = 85;
    const issues = this.detectGrammarIssues(transcript);
    score -= issues.length * 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect common grammar issues
   */
  detectGrammarIssues(transcript) {
    const issues = [];

    // Subject-verb agreement (simplified)
    if (transcript.match(/\b(I|we|they|you)\s+is\b/gi)) {
      issues.push({ type: 'subject_verb_agreement', example: 'Incorrect: "I is"' });
    }
    if (transcript.match(/\b(he|she|it)\s+(are|were)\b/gi)) {
      issues.push({ type: 'subject_verb_agreement', example: 'Incorrect verb form' });
    }

    // Tense inconsistency (simplified)
    const hasPast = /\b(was|were|did|created|built)\b/gi.test(transcript);
    const hasPresent = /\b(is|are|create|build|am)\b/gi.test(transcript);
    if (hasPast && hasPresent) {
      issues.push({ type: 'tense_inconsistency', message: 'Mixed past and present tense' });
    }

    // Double negatives
    if (transcript.match(/\b(don't|didn't|can't)\s+(\w+\s+)?not\b/gi)) {
      issues.push({ type: 'double_negative', example: 'Double negative detected' });
    }

    return issues;
  }

  /**
   * Calculate vocabulary score (0-100)
   * Based on vocabulary richness and technical terms
   */
  calculateVocabularyScore(transcript) {
    if (!transcript || transcript.length === 0) return 0;

    const words = transcript.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;

    let score = 50;
    score += vocabularyDiversity * 30; // Max +30 for diversity

    // Technical vocabulary bonus
    const technicalTerms = (transcript.match(/\b(algorithm|architecture|design|pattern|optimization|scalability|system|framework|database|cache|API)\b/gi) || []).length;
    score += Math.min(20, technicalTerms * 2);

    // Repeat words penalty
    const topWords = this.getTopRepeatedWords(transcript);
    if (topWords.length > 0) {
      score -= Math.min(15, topWords.length * 2);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate response structure score (0-100)
   * Based on logical flow: Introduction, Explanation, Examples, Conclusion
   */
  calculateResponseStructureScore(transcript) {
    if (!transcript || transcript.length === 0) return 0;

    let score = 60;
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Check for introduction
    if (sentences[0] && sentences[0].length > 10) score += 10;

    // Check for examples (presence of "for example", "such as", etc.)
    if (/\b(for example|such as|like|instance|specifically)\b/gi.test(transcript)) score += 15;

    // Check for conclusion
    const lastSentence = sentences[sentences.length - 1];
    if (lastSentence && /\b(therefore|in conclusion|ultimately|as a result|so)\b/gi.test(lastSentence)) score += 10;

    // Check for logical connectors
    const connectors = (transcript.match(/\b(because|therefore|however|moreover|furthermore|additionally)\b/gi) || []).length;
    score += Math.min(15, connectors * 2);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect STAR framework usage (0-100)
   * Situation, Task, Action, Result
   */
  detectStarFramework(transcript) {
    let score = 0;
    let componentsFound = 0;

    for (const [component, keywords] of Object.entries(this.starFrameworkKeywords)) {
      const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
      if (regex.test(transcript)) {
        score += 25;
        componentsFound++;
      }
    }

    // Full score only if all components present
    if (componentsFound < 4) score = Math.min(75, score);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect filler words and their count
   */
  detectFillers(transcript) {
    const fillers = [];
    const lowerTranscript = transcript.toLowerCase();

    for (const filler of this.fillerWords) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = (lowerTranscript.match(regex) || []).length;
      if (matches > 0) {
        fillers.push({ word: filler, count: matches });
      }
    }

    return fillers.sort((a, b) => b.count - a.count);
  }

  /**
   * Extract keywords from transcript
   */
  extractKeywords(transcript) {
    // Simple keyword extraction - remove common words
    const commonWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'had', 'has', 'he',
      'her', 'his', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on',
      'or', 'our', 'so', 'that', 'the', 'to', 'we', 'which', 'who', 'with', 'you', 'your'
    ]);

    const words = transcript.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => w.length > 3 && !commonWords.has(w));

    // Count frequency
    const freq = {};
    keywords.forEach(kw => {
      freq[kw] = (freq[kw] || 0) + 1;
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Extract technical concepts mentioned
   */
  extractConcepts(transcript) {
    const technicalConcepts = {
      'system design': /\b(system design|architecture|scalability|load balancing|caching|database)\b/gi,
      'data structures': /\b(array|list|tree|hash|graph|queue|stack|heap)\b/gi,
      'algorithms': /\b(algorithm|sorting|search|recursion|dynamic programming|optimization)\b/gi,
      'web technologies': /\b(API|REST|GraphQL|HTTP|SQL|NoSQL|database|server)\b/gi,
      'programming': /\b(code|coding|function|class|module|variable|loop|condition)\b/gi,
    };

    const concepts = [];
    for (const [category, regex] of Object.entries(technicalConcepts)) {
      const matches = (transcript.match(regex) || []).length;
      if (matches > 0) {
        concepts.push({ category, mentions: matches });
      }
    }

    return concepts;
  }

  /**
   * Calculate speaking pace (Words Per Minute)
   */
  calculateSpeakingPace(transcript, audioMetadata = {}) {
    const words = transcript.split(/\s+/).length;
    const seconds = audioMetadata.duration || 60; // Default 1 minute

    const wpm = (words / seconds) * 60;
    const pace = wpm < 120 ? 'slow' : wpm < 160 ? 'natural' : 'fast';

    return { wpm: Math.round(wpm), pace };
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(transcript) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'successful', 'achieved', 'improved', 'excited'];
    const negativeWords = ['bad', 'failed', 'problem', 'issue', 'difficult', 'challenge', 'struggled'];

    const positive = (transcript.match(new RegExp(`\\b(${positiveWords.join('|')})\\b`, 'gi')) || []).length;
    const negative = (transcript.match(new RegExp(`\\b(${negativeWords.join('|')})\\b`, 'gi')) || []).length;

    const total = positive + negative;
    if (total === 0) return 0.5; // Neutral

    return positive / total; // 0-1 score, 0.5 = neutral
  }

  /**
   * Get top repeated words
   */
  getTopRepeatedWords(transcript) {
    const commonWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'had', 'has', 'he',
      'her', 'his', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on',
      'or', 'our', 'so', 'that', 'the', 'to', 'we', 'which', 'who', 'with', 'you', 'your'
    ]);

    const words = transcript.toLowerCase().split(/\s+/);
    const freq = {};

    words.forEach(w => {
      if (!commonWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });

    return Object.entries(freq)
      .filter(([, count]) => count > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Calculate overall communication score
   */
  calculateCommunicationScore(analysis) {
    const scores = [
      analysis.fluencyScore,
      analysis.clarityScore,
      analysis.pronunciationScore,
      analysis.grammarScore,
      analysis.vocabularyScore,
      analysis.responseStructureScore,
    ];

    // Weight confidence and STAR framework
    const weighted = [
      ...scores,
      analysis.confidenceScore * 0.8,
      analysis.starFrameworkScore * 0.8,
    ];

    const average = weighted.reduce((a, b) => a + b, 0) / weighted.length;
    return Math.round(average);
  }
}
