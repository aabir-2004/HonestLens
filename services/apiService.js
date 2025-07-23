const axios = require('axios');
const cheerio = require('cheerio');
const RSSParser = require('rss-parser');
const puppeteer = require('puppeteer');

class APIIntegrationService {
  constructor() {
    this.rssParser = new RSSParser();
    this.factCheckAPIs = {
      newsAPI: {
        baseURL: 'https://newsapi.org/v2',
        key: process.env.NEWS_API_KEY
      },
      googleFactCheck: {
        baseURL: 'https://factchecktools.googleapis.com/v1alpha1',
        key: process.env.GOOGLE_FACT_CHECK_API_KEY
      },
      openAI: {
        key: process.env.OPENAI_API_KEY
      }
    };
    
    this.trustedIndianSources = [
      {
        name: 'PIB Fact Check',
        rss: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1',
        website: 'https://pib.gov.in/PressReleaseIframePage.aspx?PRID=1866782'
      },
      {
        name: 'MyGov India',
        website: 'https://www.mygov.in/covid-19',
        api: null
      },
      {
        name: 'Boom Live',
        rss: 'https://www.boomlive.in/feed',
        website: 'https://www.boomlive.in'
      },
      {
        name: 'Alt News',
        rss: 'https://www.altnews.in/feed/',
        website: 'https://www.altnews.in'
      },
      {
        name: 'FactChecker.in',
        rss: 'https://www.factchecker.in/feed/',
        website: 'https://www.factchecker.in'
      }
    ];
  }

  async verifyWithExternalAPIs(content, url = null) {
    const results = {
      newsAPIResults: null,
      googleFactCheckResults: null,
      openAIAnalysis: null,
      rssFactCheckResults: null,
      webScrapingResults: null,
      aggregatedScore: 50,
      sources: []
    };

    try {
      // Parallel API calls for better performance
      const [newsAPI, googleFactCheck, rssResults, openAIResult] = await Promise.allSettled([
        this.checkNewsAPI(content, url),
        this.checkGoogleFactCheckAPI(content),
        this.checkRSSFactCheckers(content),
        this.analyzeWithOpenAI(content)
      ]);

      if (newsAPI.status === 'fulfilled') results.newsAPIResults = newsAPI.value;
      if (googleFactCheck.status === 'fulfilled') results.googleFactCheckResults = googleFactCheck.value;
      if (rssResults.status === 'fulfilled') results.rssFactCheckResults = rssResults.value;
      if (openAIResult.status === 'fulfilled') results.openAIAnalysis = openAIResult.value;

      // Web scraping for additional verification
      if (url) {
        results.webScrapingResults = await this.scrapeAndAnalyze(url);
      }

      // Calculate aggregated score
      results.aggregatedScore = this.calculateAggregatedScore(results);
      results.sources = this.extractSources(results);

      return results;
    } catch (error) {
      console.error('External API verification error:', error);
      return results;
    }
  }

  async checkNewsAPI(content, url) {
    if (!this.factCheckAPIs.newsAPI.key) {
      console.log('NewsAPI key not configured');
      return null;
    }

    try {
      // Extract keywords from content for search
      const keywords = this.extractKeywords(content);
      const searchQuery = keywords.slice(0, 3).join(' OR ');

      const response = await axios.get(`${this.factCheckAPIs.newsAPI.baseURL}/everything`, {
        params: {
          q: searchQuery,
          language: 'en',
          sortBy: 'relevancy',
          pageSize: 10,
          apiKey: this.factCheckAPIs.newsAPI.key
        },
        timeout: 10000
      });

      const articles = response.data.articles || [];
      const relevantArticles = articles.filter(article => 
        this.calculateRelevance(content, article.title + ' ' + article.description) > 0.3
      );

      return {
        totalResults: response.data.totalResults,
        relevantArticles: relevantArticles.slice(0, 5),
        credibilityScore: this.assessNewsAPICredibility(relevantArticles)
      };
    } catch (error) {
      console.error('NewsAPI error:', error.message);
      return null;
    }
  }

  async checkGoogleFactCheckAPI(content) {
    if (!this.factCheckAPIs.googleFactCheck.key) {
      console.log('Google Fact Check API key not configured');
      return null;
    }

    try {
      const query = this.extractMainClaim(content);
      
      const response = await axios.get(`${this.factCheckAPIs.googleFactCheck.baseURL}/claims:search`, {
        params: {
          query: query,
          languageCode: 'en',
          key: this.factCheckAPIs.googleFactCheck.key
        },
        timeout: 10000
      });

      const claims = response.data.claims || [];
      return {
        totalClaims: claims.length,
        relevantClaims: claims.slice(0, 5),
        credibilityScore: this.assessGoogleFactCheckCredibility(claims)
      };
    } catch (error) {
      console.error('Google Fact Check API error:', error.message);
      return null;
    }
  }

  async analyzeWithOpenAI(content) {
    if (!this.factCheckAPIs.openAI.key) {
      console.log('OpenAI API key not configured');
      return null;
    }

    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({
        apiKey: this.factCheckAPIs.openAI.key
      });

      const prompt = `Analyze the following news content for factual accuracy and potential misinformation. Consider:
1. Factual claims and their verifiability
2. Language patterns that suggest bias or manipulation
3. Missing context or cherry-picked information
4. Overall credibility assessment

Content: "${content}"

Provide a JSON response with:
- credibilityScore (0-100)
- factualClaims (array of claims found)
- concerns (array of potential issues)
- reasoning (explanation of assessment)`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('OpenAI analysis error:', error.message);
      return null;
    }
  }

  async checkRSSFactCheckers(content) {
    const results = [];
    const keywords = this.extractKeywords(content);

    for (const source of this.trustedIndianSources) {
      if (!source.rss) continue;

      try {
        const feed = await this.rssParser.parseURL(source.rss);
        const relevantItems = feed.items.filter(item => {
          const itemText = (item.title + ' ' + item.contentSnippet).toLowerCase();
          return keywords.some(keyword => itemText.includes(keyword.toLowerCase()));
        });

        if (relevantItems.length > 0) {
          results.push({
            source: source.name,
            relevantItems: relevantItems.slice(0, 3),
            credibilityImpact: this.assessRSSCredibilityImpact(relevantItems, content)
          });
        }
      } catch (error) {
        console.error(`RSS parsing error for ${source.name}:`, error.message);
      }
    }

    return results;
  }

  async scrapeAndAnalyze(url) {
    try {
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      const content = await page.evaluate(() => {
        // Extract main content, avoiding ads and navigation
        const article = document.querySelector('article') || 
                       document.querySelector('.content') ||
                       document.querySelector('main') ||
                       document.body;
        
        return {
          title: document.title,
          text: article.innerText,
          publishDate: document.querySelector('time')?.getAttribute('datetime') ||
                      document.querySelector('[datetime]')?.getAttribute('datetime'),
          author: document.querySelector('[rel="author"]')?.innerText ||
                 document.querySelector('.author')?.innerText,
          images: Array.from(document.querySelectorAll('img')).map(img => img.src).slice(0, 5)
        };
      });

      await browser.close();

      return {
        extractedContent: content,
        credibilityIndicators: this.analyzeScrapedContent(content),
        domainTrust: this.assessDomainTrust(url)
      };
    } catch (error) {
      console.error('Web scraping error:', error.message);
      return null;
    }
  }

  extractKeywords(content) {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word));

    // Return top 10 most frequent words
    const frequency = {};
    words.forEach(word => frequency[word] = (frequency[word] || 0) + 1);
    
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10);
  }

  extractMainClaim(content) {
    // Extract the main claim from content
    const sentences = content.split(/[.!?]+/);
    return sentences.find(sentence => 
      sentence.length > 20 && sentence.length < 200
    ) || sentences[0] || content.substring(0, 200);
  }

  calculateRelevance(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  assessNewsAPICredibility(articles) {
    if (!articles || articles.length === 0) return 50;

    let score = 50;
    const trustedSources = ['reuters', 'bbc', 'apnews', 'timesofindia', 'thehindu', 'indianexpress'];
    
    const trustedCount = articles.filter(article => 
      trustedSources.some(source => article.source.name.toLowerCase().includes(source))
    ).length;

    score += (trustedCount / articles.length) * 30;
    return Math.min(100, score);
  }

  assessGoogleFactCheckCredibility(claims) {
    if (!claims || claims.length === 0) return 50;

    let score = 50;
    const negativeRatings = ['false', 'mostly false', 'mixture', 'unproven'];
    
    const negativeCount = claims.filter(claim => 
      claim.claimReview && claim.claimReview.some(review => 
        negativeRatings.some(rating => 
          review.textualRating?.toLowerCase().includes(rating)
        )
      )
    ).length;

    if (negativeCount > 0) {
      score -= (negativeCount / claims.length) * 40;
    }

    return Math.max(10, score);
  }

  assessRSSCredibilityImpact(items, originalContent) {
    // Assess how RSS fact-check items impact credibility
    let impact = 0;
    
    items.forEach(item => {
      const relevance = this.calculateRelevance(originalContent, item.title + ' ' + item.contentSnippet);
      if (relevance > 0.5) {
        // High relevance fact-check found
        if (item.title.toLowerCase().includes('false') || 
            item.title.toLowerCase().includes('fake') ||
            item.title.toLowerCase().includes('misleading')) {
          impact -= 30;
        } else if (item.title.toLowerCase().includes('true') ||
                  item.title.toLowerCase().includes('verified')) {
          impact += 20;
        }
      }
    });

    return impact;
  }

  analyzeScrapedContent(content) {
    const indicators = {
      hasAuthor: !!content.author,
      hasPublishDate: !!content.publishDate,
      contentLength: content.text.length,
      hasImages: content.images.length > 0,
      titleQuality: this.assessTitleQuality(content.title)
    };

    let score = 50;
    if (indicators.hasAuthor) score += 10;
    if (indicators.hasPublishDate) score += 10;
    if (indicators.contentLength > 500) score += 10;
    if (indicators.contentLength > 1500) score += 5;
    if (indicators.hasImages) score += 5;
    score += indicators.titleQuality;

    return { indicators, score: Math.min(100, score) };
  }

  assessTitleQuality(title) {
    if (!title) return -10;
    
    let score = 0;
    const sensationalWords = ['shocking', 'unbelievable', 'you won\'t believe'];
    const hasClickbait = sensationalWords.some(word => 
      title.toLowerCase().includes(word)
    );
    
    if (hasClickbait) score -= 15;
    if (title.length > 10 && title.length < 100) score += 5;
    if (!/[!]{2,}/.test(title)) score += 5; // No excessive exclamation marks
    
    return score;
  }

  assessDomainTrust(url) {
    try {
      const domain = new URL(url).hostname;
      const trustedDomains = [
        'pib.gov.in', 'mygov.in', 'timesofindia.com', 'thehindu.com',
        'indianexpress.com', 'ndtv.com', 'bbc.com', 'reuters.com',
        'apnews.com', 'altnews.in', 'boomlive.in', 'factchecker.in'
      ];

      if (trustedDomains.some(trusted => domain.includes(trusted))) {
        return { trusted: true, score: 85 };
      }

      return { trusted: false, score: 40 };
    } catch (error) {
      return { trusted: false, score: 20 };
    }
  }

  calculateAggregatedScore(results) {
    let totalScore = 0;
    let weights = 0;

    if (results.newsAPIResults) {
      totalScore += results.newsAPIResults.credibilityScore * 0.25;
      weights += 0.25;
    }

    if (results.googleFactCheckResults) {
      totalScore += results.googleFactCheckResults.credibilityScore * 0.3;
      weights += 0.3;
    }

    if (results.openAIAnalysis) {
      totalScore += results.openAIAnalysis.credibilityScore * 0.2;
      weights += 0.2;
    }

    if (results.rssFactCheckResults && results.rssFactCheckResults.length > 0) {
      const rssScore = 50 + results.rssFactCheckResults.reduce((sum, result) => 
        sum + result.credibilityImpact, 0) / results.rssFactCheckResults.length;
      totalScore += Math.max(0, Math.min(100, rssScore)) * 0.15;
      weights += 0.15;
    }

    if (results.webScrapingResults) {
      totalScore += results.webScrapingResults.credibilityIndicators.score * 0.1;
      weights += 0.1;
    }

    return weights > 0 ? Math.round(totalScore / weights) : 50;
  }

  extractSources(results) {
    const sources = [];

    if (results.newsAPIResults) {
      sources.push(...results.newsAPIResults.relevantArticles.map(article => ({
        name: article.source.name,
        url: article.url,
        type: 'news_api'
      })));
    }

    if (results.googleFactCheckResults) {
      sources.push(...results.googleFactCheckResults.relevantClaims.map(claim => ({
        name: claim.claimReview?.[0]?.publisher?.name || 'Google Fact Check',
        url: claim.claimReview?.[0]?.url,
        type: 'fact_check'
      })));
    }

    if (results.rssFactCheckResults) {
      results.rssFactCheckResults.forEach(result => {
        sources.push(...result.relevantItems.map(item => ({
          name: result.source,
          url: item.link,
          type: 'rss_fact_check'
        })));
      });
    }

    return sources.slice(0, 10); // Limit to top 10 sources
  }
}

module.exports = new APIIntegrationService();
