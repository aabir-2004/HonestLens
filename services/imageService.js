const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ImageVerificationService {
  constructor() {
    this.googleVisionAPI = process.env.GOOGLE_VISION_API_KEY;
    this.reverseImageSearchAPIs = {
      google: 'https://www.googleapis.com/customsearch/v1',
      tineye: 'https://api.tineye.com/rest/search/'
    };
  }

  async verifyImage(imagePath) {
    try {
      const analysis = {
        metadata: await this.extractMetadata(imagePath),
        textAnalysis: await this.extractAndAnalyzeText(imagePath),
        manipulationDetection: await this.detectManipulation(imagePath),
        reverseImageSearch: await this.performReverseImageSearch(imagePath),
        visualAnalysis: await this.analyzeVisualContent(imagePath),
        finalScore: 0,
        credibilityLevel: '',
        evidence: [],
        flags: []
      };

      analysis.finalScore = this.calculateImageScore(analysis);
      analysis.credibilityLevel = this.determineImageCredibility(analysis.finalScore);
      analysis.evidence = this.generateImageEvidence(analysis);
      analysis.flags = this.generateImageFlags(analysis);

      return analysis;
    } catch (error) {
      console.error('Image verification error:', error);
      throw new Error('Failed to verify image');
    }
  }

  async extractMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = fs.statSync(imagePath);

      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        density: metadata.density,
        hasExif: !!metadata.exif,
        fileSize: stats.size,
        createdDate: stats.birthtime,
        modifiedDate: stats.mtime,
        suspiciousMetadata: this.analyzeSuspiciousMetadata(metadata, stats)
      };
    } catch (error) {
      console.error('Metadata extraction error:', error);
      return null;
    }
  }

  analyzeSuspiciousMetadata(metadata, stats) {
    const flags = [];

    // Check for missing EXIF data (could indicate manipulation)
    if (!metadata.exif) {
      flags.push('Missing EXIF data');
    }

    // Check for unusual dimensions
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio < 0.1 || aspectRatio > 10) {
        flags.push('Unusual aspect ratio');
      }
    }

    // Check file modification vs creation time
    const timeDiff = Math.abs(stats.mtime - stats.birthtime);
    if (timeDiff > 60000) { // More than 1 minute difference
      flags.push('File modified after creation');
    }

    // Check for unusually small or large file sizes
    const pixelCount = (metadata.width || 0) * (metadata.height || 0);
    const expectedSize = pixelCount * 3; // Rough estimate for RGB
    const compressionRatio = stats.size / expectedSize;
    
    if (compressionRatio < 0.01) {
      flags.push('Extremely high compression');
    } else if (compressionRatio > 1) {
      flags.push('Unusually large file size');
    }

    return flags;
  }

  async extractAndAnalyzeText(imagePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(imagePath, 'eng+hin', {
        logger: m => {} // Suppress logs
      });

      if (!text || text.trim().length === 0) {
        return {
          hasText: false,
          extractedText: '',
          textAnalysis: null
        };
      }

      // Analyze extracted text for misinformation patterns
      const textAnalysis = this.analyzeExtractedText(text);

      return {
        hasText: true,
        extractedText: text.trim(),
        textAnalysis
      };
    } catch (error) {
      console.error('OCR error:', error);
      return {
        hasText: false,
        extractedText: '',
        textAnalysis: null,
        error: error.message
      };
    }
  }

  analyzeExtractedText(text) {
    const analysis = {
      suspiciousPatterns: [],
      emotionalLanguage: 0,
      urgencyIndicators: 0,
      factualClaims: [],
      score: 50
    };

    const textLower = text.toLowerCase();

    // Check for suspicious patterns
    const suspiciousWords = [
      'breaking', 'urgent', 'shocking', 'unbelievable', 'viral',
      'share immediately', 'before deleted', 'government hiding',
      'doctors hate', 'secret revealed'
    ];

    suspiciousWords.forEach(word => {
      if (textLower.includes(word)) {
        analysis.suspiciousPatterns.push(word);
        analysis.score -= 5;
      }
    });

    // Check for emotional manipulation
    const emotionalWords = [
      'outraged', 'furious', 'devastated', 'terrified', 'shocked',
      'disgusted', 'appalled', 'heartbroken'
    ];

    analysis.emotionalLanguage = emotionalWords.filter(word => 
      textLower.includes(word)
    ).length;

    if (analysis.emotionalLanguage > 2) {
      analysis.score -= 10;
    }

    // Check for urgency indicators
    const urgencyWords = ['now', 'immediately', 'urgent', 'hurry', 'quick', 'fast'];
    analysis.urgencyIndicators = urgencyWords.filter(word => 
      textLower.includes(word)
    ).length;

    if (analysis.urgencyIndicators > 1) {
      analysis.score -= 8;
    }

    // Look for factual claims (dates, numbers, specific names)
    const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const numberPattern = /\b\d+(\.\d+)?\s*(percent|%|million|billion|thousand|crore|lakh)\b/gi;
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;

    analysis.factualClaims = [
      ...(text.match(datePattern) || []),
      ...(text.match(numberPattern) || []),
      ...(text.match(namePattern) || [])
    ];

    if (analysis.factualClaims.length > 0) {
      analysis.score += 10;
    }

    return analysis;
  }

  async detectManipulation(imagePath) {
    try {
      // Basic manipulation detection using image analysis
      const image = sharp(imagePath);
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

      const analysis = {
        compressionArtifacts: this.detectCompressionArtifacts(data, info),
        edgeConsistency: this.analyzeEdgeConsistency(data, info),
        colorConsistency: this.analyzeColorConsistency(data, info),
        noisePatterns: this.analyzeNoisePatterns(data, info),
        manipulationScore: 0
      };

      // Calculate manipulation score
      analysis.manipulationScore = this.calculateManipulationScore(analysis);

      return analysis;
    } catch (error) {
      console.error('Manipulation detection error:', error);
      return {
        compressionArtifacts: false,
        edgeConsistency: true,
        colorConsistency: true,
        noisePatterns: false,
        manipulationScore: 0,
        error: error.message
      };
    }
  }

  detectCompressionArtifacts(data, info) {
    // Simplified compression artifact detection
    // In a real implementation, this would use more sophisticated algorithms
    const { width, height, channels } = info;
    let artifactCount = 0;

    // Sample pixels and look for JPEG-like compression patterns
    for (let i = 0; i < data.length; i += channels * 8) {
      if (i + channels < data.length) {
        const diff = Math.abs(data[i] - data[i + channels]);
        if (diff > 50) artifactCount++;
      }
    }

    const artifactRatio = artifactCount / (width * height / 64);
    return artifactRatio > 0.1;
  }

  analyzeEdgeConsistency(data, info) {
    // Simplified edge consistency analysis
    const { width, height, channels } = info;
    let inconsistentEdges = 0;

    // Simple edge detection and consistency check
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * channels;
        const neighbors = [
          data[idx - width * channels], // top
          data[idx + width * channels], // bottom
          data[idx - channels], // left
          data[idx + channels]  // right
        ];

        const variance = this.calculateVariance(neighbors);
        if (variance > 100) inconsistentEdges++;
      }
    }

    const inconsistencyRatio = inconsistentEdges / (width * height);
    return inconsistencyRatio < 0.05; // True if edges are consistent
  }

  analyzeColorConsistency(data, info) {
    // Simplified color consistency analysis
    const { width, height, channels } = info;
    const colorHistogram = { r: {}, g: {}, b: {} };

    // Build color histogram
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      colorHistogram.r[r] = (colorHistogram.r[r] || 0) + 1;
      colorHistogram.g[g] = (colorHistogram.g[g] || 0) + 1;
      colorHistogram.b[b] = (colorHistogram.b[b] || 0) + 1;
    }

    // Check for unnatural color distributions
    const rValues = Object.keys(colorHistogram.r).length;
    const gValues = Object.keys(colorHistogram.g).length;
    const bValues = Object.keys(colorHistogram.b).length;

    const totalPixels = width * height;
    const avgColorsPerChannel = (rValues + gValues + bValues) / 3;
    const colorDiversity = avgColorsPerChannel / 256;

    return colorDiversity > 0.1; // True if colors seem natural
  }

  analyzeNoisePatterns(data, info) {
    // Simplified noise pattern analysis
    const { width, height, channels } = info;
    let noiseLevel = 0;

    // Sample random pixels and calculate noise
    for (let i = 0; i < 1000 && i < data.length; i += Math.floor(data.length / 1000)) {
      if (i + channels * 2 < data.length) {
        const pixel1 = data[i];
        const pixel2 = data[i + channels];
        noiseLevel += Math.abs(pixel1 - pixel2);
      }
    }

    const avgNoise = noiseLevel / 1000;
    return avgNoise > 10; // True if significant noise detected
  }

  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  calculateManipulationScore(analysis) {
    let score = 0;

    if (analysis.compressionArtifacts) score += 20;
    if (!analysis.edgeConsistency) score += 25;
    if (!analysis.colorConsistency) score += 20;
    if (!analysis.noisePatterns) score += 15; // Lack of natural noise can indicate manipulation

    return Math.min(100, score);
  }

  async performReverseImageSearch(imagePath) {
    // Placeholder for reverse image search
    // In production, integrate with Google Custom Search API or TinEye API
    try {
      return {
        totalResults: 0,
        similarImages: [],
        oldestMatch: null,
        newestMatch: null,
        credibilityImpact: 0
      };
    } catch (error) {
      console.error('Reverse image search error:', error);
      return null;
    }
  }

  async analyzeVisualContent(imagePath) {
    // Placeholder for visual content analysis
    // In production, use Google Vision API or similar service
    try {
      if (!this.googleVisionAPI) {
        return {
          objects: [],
          faces: [],
          text: [],
          landmarks: [],
          logos: [],
          safeSearch: {
            adult: 'VERY_UNLIKELY',
            medical: 'UNLIKELY',
            violence: 'UNLIKELY',
            racy: 'UNLIKELY'
          }
        };
      }

      // Placeholder for Google Vision API integration
      return {
        objects: [],
        faces: [],
        text: [],
        landmarks: [],
        logos: [],
        safeSearch: {
          adult: 'VERY_UNLIKELY',
          medical: 'UNLIKELY',
          violence: 'UNLIKELY',
          racy: 'UNLIKELY'
        }
      };
    } catch (error) {
      console.error('Visual content analysis error:', error);
      return null;
    }
  }

  calculateImageScore(analysis) {
    let score = 50; // Base score

    // Metadata analysis
    if (analysis.metadata) {
      if (analysis.metadata.hasExif) score += 10;
      score -= analysis.metadata.suspiciousMetadata.length * 5;
    }

    // Text analysis
    if (analysis.textAnalysis && analysis.textAnalysis.textAnalysis) {
      score += (analysis.textAnalysis.textAnalysis.score - 50);
    }

    // Manipulation detection
    if (analysis.manipulationDetection) {
      score -= analysis.manipulationDetection.manipulationScore * 0.5;
    }

    // Reverse image search (if available)
    if (analysis.reverseImageSearch && analysis.reverseImageSearch.totalResults > 0) {
      score += analysis.reverseImageSearch.credibilityImpact;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  determineImageCredibility(score) {
    if (score >= 85) return 'highly_credible';
    if (score >= 70) return 'mostly_credible';
    if (score >= 50) return 'mixed_credibility';
    if (score >= 30) return 'low_credibility';
    return 'not_credible';
  }

  generateImageEvidence(analysis) {
    const evidence = [];

    if (analysis.metadata) {
      if (analysis.metadata.hasExif) {
        evidence.push('Image contains EXIF metadata');
      }
      if (analysis.metadata.suspiciousMetadata.length === 0) {
        evidence.push('No suspicious metadata patterns detected');
      }
    }

    if (analysis.textAnalysis && analysis.textAnalysis.hasText) {
      if (analysis.textAnalysis.textAnalysis.factualClaims.length > 0) {
        evidence.push(`Contains ${analysis.textAnalysis.textAnalysis.factualClaims.length} factual claims`);
      }
    }

    if (analysis.manipulationDetection && analysis.manipulationDetection.manipulationScore < 30) {
      evidence.push('Low manipulation indicators detected');
    }

    return evidence;
  }

  generateImageFlags(analysis) {
    const flags = [];

    if (analysis.metadata && analysis.metadata.suspiciousMetadata.length > 0) {
      flags.push(...analysis.metadata.suspiciousMetadata);
    }

    if (analysis.textAnalysis && analysis.textAnalysis.textAnalysis) {
      const textAnalysis = analysis.textAnalysis.textAnalysis;
      if (textAnalysis.suspiciousPatterns.length > 0) {
        flags.push('Contains suspicious text patterns');
      }
      if (textAnalysis.emotionalLanguage > 2) {
        flags.push('High emotional manipulation in text');
      }
    }

    if (analysis.manipulationDetection && analysis.manipulationDetection.manipulationScore > 50) {
      flags.push('Potential image manipulation detected');
    }

    return flags;
  }
}

module.exports = new ImageVerificationService();
