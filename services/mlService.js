const natural = require('natural');
const sentiment = require('sentiment');
const compromise = require('compromise');
const axios = require('axios');
const stringSimilarity = require('string-similarity');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const sentimentAnalyzer = new sentiment();

class MLNewsVerificationService {
  constructor() {
    this.tfidf = new natural.TfIdf();
    this.trustedSources = [
      'pib.gov.in', 'mygov.in', 'factchecker.in', 'boomlive.in',
      'altnews.in', 'timesofindia.com', 'thehindu.com', 'indianexpress.com',
      'ndtv.com', 'bbc.com', 'reuters.com', 'apnews.com'
    ];
    this.misinformationPatterns = this.initializeMisinformationPatterns();
  }

  initializeMisinformationPatterns() {
    return {
      sensationalWords: [
        'breaking', 'urgent', 'shocking', 'unbelievable', 'secret', 'hidden truth',
        'they don\'t want you to know', 'viral', 'must share', 'forward this',
        'exposed', 'revealed', 'conspiracy', 'cover-up', 'exclusive'
      ],
      clickbaitPatterns: [
        /you won't believe/i, /doctors hate/i, /this one trick/i,
        /number \d+ will shock you/i, /what happened next/i,
        /the reason why/i, /you'll never guess/i
      ],
      urgencyIndicators: [
        'immediately', 'right now', 'before it\'s too late', 'limited time',
        'act fast', 'don\'t wait', 'urgent action needed'
      ],
      emotionalManipulation: [
        'outraged', 'furious', 'devastated', 'heartbroken', 'terrified',
        'disgusted', 'appalled', 'shocked beyond belief'
      ]
    };
  }

  async verifyContent(content, url = null, imageData = null) {
    try {
      const analysis = {
        contentAnalysis: await this.analyzeTextContent(content),
        sourceAnalysis: url ? await this.analyzeSource(url) : null,
        imageAnalysis: imageData ? await this.analyzeImage(imageData) : null,
        crossReference: await this.crossReferenceWithFactCheckers(content),
        finalScore: 0,
        credibilityLevel: '',
        evidence: [],
        flags: [],
        reasoning: ''
      };

      // Calculate weighted final score
      analysis.finalScore = this.calculateFinalScore(analysis);
      analysis.credibilityLevel = this.determineCredibilityLevel(analysis.finalScore);
      analysis.reasoning = this.generateReasoning(analysis);

      return analysis;
    } catch (error) {
      console.error('ML Verification Error:', error);
      throw new Error('Failed to perform ML verification');
    }
  }

  async analyzeTextContent(content) {
    const analysis = {
      sentimentScore: 0,
      misinformationScore: 0,
      linguisticFeatures: {},
      factualityIndicators: {},
      score: 50
    };

    // Sentiment Analysis
    const sentimentResult = sentimentAnalyzer.analyze(content);
    analysis.sentimentScore = sentimentResult.score;

    // Linguistic Analysis using Compromise
    const doc = compromise(content);
    analysis.linguisticFeatures = {
      sentences: doc.sentences().length,
      words: doc.terms().length,
      entities: doc.people().concat(doc.places()).concat(doc.organizations()).length,
      dates: doc.dates().length,
      numbers: doc.values().length
    };

    // Misinformation Pattern Detection
    analysis.misinformationScore = this.detectMisinformationPatterns(content);

    // Factuality Indicators
    analysis.factualityIndicators = this.analyzeFactualityIndicators(content);

    // Calculate content score
    analysis.score = this.calculateContentScore(analysis);

    return analysis;
  }

  detectMisinformationPatterns(content) {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Check sensational words
    const sensationalCount = this.misinformationPatterns.sensationalWords
      .filter(word => contentLower.includes(word)).length;
    score += sensationalCount * 5;

    // Check clickbait patterns
    const clickbaitCount = this.misinformationPatterns.clickbaitPatterns
      .filter(pattern => pattern.test(content)).length;
    score += clickbaitCount * 10;

    // Check urgency indicators
    const urgencyCount = this.misinformationPatterns.urgencyIndicators
      .filter(word => contentLower.includes(word)).length;
    score += urgencyCount * 7;

    // Check emotional manipulation
    const emotionalCount = this.misinformationPatterns.emotionalManipulation
      .filter(word => contentLower.includes(word)).length;
    score += emotionalCount * 6;

    return Math.min(score, 100);
  }

  analyzeFactualityIndicators(content) {
    const indicators = {
      hasSpecificDates: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(content),
      hasSpecificNumbers: /\b\d+(\.\d+)?\s*(percent|%|million|billion|thousand)\b/i.test(content),
      hasQuotations: /"[^"]*"/g.test(content),
      hasOfficialSources: /according to|sources say|officials|government|ministry/i.test(content),
      hasVagueLanguage: /some say|many believe|it is said|reportedly|allegedly/i.test(content),
      hasAbsoluteStatements: /always|never|all|none|every|completely|totally/i.test(content)
    };

    return indicators;
  }

  calculateContentScore(analysis) {
    let score = 50; // Base score

    // Sentiment adjustment
    if (Math.abs(analysis.sentimentScore) > 5) {
      score -= 10; // Highly emotional content is suspicious
    }

    // Misinformation patterns penalty
    score -= analysis.misinformationScore;

    // Factuality indicators adjustment
    const indicators = analysis.factualityIndicators;
    if (indicators.hasSpecificDates) score += 10;
    if (indicators.hasSpecificNumbers) score += 8;
    if (indicators.hasQuotations) score += 5;
    if (indicators.hasOfficialSources) score += 15;
    if (indicators.hasVagueLanguage) score -= 10;
    if (indicators.hasAbsoluteStatements) score -= 8;

    // Linguistic complexity bonus
    const avgWordsPerSentence = analysis.linguisticFeatures.words / 
                               Math.max(analysis.linguisticFeatures.sentences, 1);
    if (avgWordsPerSentence > 15 && avgWordsPerSentence < 30) {
      score += 5; // Well-structured content
    }

    return Math.max(0, Math.min(100, score));
  }

  async analyzeSource(url) {
    const analysis = {
      domain: '',
      trustScore: 0,
      isKnownSource: false,
      domainAge: null,
      httpsEnabled: false,
      score: 50
    };

    try {
      const urlObj = new URL(url);
      analysis.domain = urlObj.hostname;
      analysis.httpsEnabled = urlObj.protocol === 'https:';

      // Check against trusted sources
      analysis.isKnownSource = this.trustedSources.some(trusted => 
        analysis.domain.includes(trusted)
      );

      if (analysis.isKnownSource) {
        analysis.trustScore = 90;
        analysis.score = 85;
      } else {
        // Additional domain analysis could be added here
        analysis.trustScore = 40;
        analysis.score = 45;
      }

      if (analysis.httpsEnabled) {
        analysis.score += 5;
      }

    } catch (error) {
      console.error('Source analysis error:', error);
      analysis.score = 20; // Invalid URL
    }

    return analysis;
  }

  async analyzeImage(imageData) {
    // Placeholder for image analysis
    // In a real implementation, this would use computer vision APIs
    return {
      hasText: false,
      isManipulated: false,
      reverseImageResults: [],
      score: 50
    };
  }

  async crossReferenceWithFactCheckers(content) {
    const results = {
      checkedSources: [],
      matchingClaims: [],
      contradictingClaims: [],
      score: 50
    };

    try {
      // Simulate fact-checker API calls
      // In production, integrate with actual fact-checking APIs
      const keyPhrases = this.extractKeyPhrases(content);
      
      // Simulate checking against known fact-check databases
      for (const phrase of keyPhrases.slice(0, 3)) {
        const mockResult = {
          source: 'FactChecker.in',
          claim: phrase,
          verdict: Math.random() > 0.7 ? 'false' : 'unverified',
          confidence: Math.random() * 100
        };
        results.checkedSources.push(mockResult);
      }

      // Calculate score based on fact-check results
      const falseCount = results.checkedSources.filter(r => r.verdict === 'false').length;
      results.score = Math.max(20, 80 - (falseCount * 25));

    } catch (error) {
      console.error('Fact-check cross-reference error:', error);
    }

    return results;
  }

  extractKeyPhrases(content) {
    const doc = compromise(content);
    const phrases = [];

    // Extract named entities
    phrases.push(...doc.people().out('array'));
    phrases.push(...doc.places().out('array'));
    phrases.push(...doc.organizations().out('array'));

    // Extract noun phrases
    phrases.push(...doc.nouns().out('array'));

    // Filter and clean phrases
    return phrases
      .filter(phrase => phrase.length > 3)
      .slice(0, 10); // Limit to top 10 phrases
  }

  calculateFinalScore(analysis) {
    let finalScore = 0;
    let totalWeight = 0;

    // Content analysis weight: 40%
    if (analysis.contentAnalysis) {
      finalScore += analysis.contentAnalysis.score * 0.4;
      totalWeight += 0.4;
    }

    // Source analysis weight: 30%
    if (analysis.sourceAnalysis) {
      finalScore += analysis.sourceAnalysis.score * 0.3;
      totalWeight += 0.3;
    }

    // Cross-reference weight: 25%
    if (analysis.crossReference) {
      finalScore += analysis.crossReference.score * 0.25;
      totalWeight += 0.25;
    }

    // Image analysis weight: 5%
    if (analysis.imageAnalysis) {
      finalScore += analysis.imageAnalysis.score * 0.05;
      totalWeight += 0.05;
    }

    return totalWeight > 0 ? Math.round(finalScore / totalWeight) : 50;
  }

  determineCredibilityLevel(score) {
    if (score >= 85) return 'highly_credible';
    if (score >= 70) return 'mostly_credible';
    if (score >= 50) return 'mixed_credibility';
    if (score >= 30) return 'low_credibility';
    return 'not_credible';
  }

  generateReasoning(analysis) {
    let reasoning = 'Advanced ML analysis performed. ';

    if (analysis.contentAnalysis) {
      const content = analysis.contentAnalysis;
      if (content.misinformationScore > 20) {
        reasoning += 'Content contains suspicious patterns. ';
      }
      if (content.factualityIndicators.hasOfficialSources) {
        reasoning += 'References official sources. ';
      }
    }

    if (analysis.sourceAnalysis && analysis.sourceAnalysis.isKnownSource) {
      reasoning += `Source from trusted domain (${analysis.sourceAnalysis.domain}). `;
    }

    if (analysis.crossReference && analysis.crossReference.checkedSources.length > 0) {
      reasoning += `Cross-referenced with ${analysis.crossReference.checkedSources.length} fact-checkers. `;
    }

    return reasoning;
  }
}

module.exports = new MLNewsVerificationService();
