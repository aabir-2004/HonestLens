import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Text must be at least 10 characters long'
      });
    }

    // Generate a request ID for tracking
    const requestId = uuidv4();

    // Simple keyword-based analysis for demo
    const keywords = ['government', 'official', 'ministry', 'pib', 'authentic', 'verified'];
    const suspiciousKeywords = ['fake', 'hoax', 'rumor', 'unverified', 'breaking'];
    
    const textLower = text.toLowerCase();
    const positiveMatches = keywords.filter(keyword => textLower.includes(keyword)).length;
    const negativeMatches = suspiciousKeywords.filter(keyword => textLower.includes(keyword)).length;
    
    // Calculate a basic truth score
    let truthScore = 50; // Base score
    truthScore += positiveMatches * 10;
    truthScore -= negativeMatches * 15;
    truthScore = Math.max(10, Math.min(95, truthScore)); // Clamp between 10-95

    const credibilityLevel = truthScore >= 80 ? 'High' : 
                           truthScore >= 60 ? 'Medium' : 
                           truthScore >= 40 ? 'Low' : 'Very Low';

    const mockResponse = {
      requestId: requestId,
      status: 'completed',
      estimatedTime: 'Instant',
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      result: {
        truthScore: truthScore,
        credibilityLevel: credibilityLevel,
        sources: positiveMatches > 0 ? ['Government Sources', 'Official Channels'] : ['General Analysis'],
        analysis: `Text analysis completed. Found ${positiveMatches} positive indicators and ${negativeMatches} suspicious indicators.`,
        keyFindings: [
          `Truth Score: ${truthScore}%`,
          `Credibility Level: ${credibilityLevel}`,
          `Text Length: ${text.length} characters`
        ]
      }
    };

    res.status(200).json({
      success: true,
      message: 'Text verification completed',
      data: mockResponse
    });

  } catch (error) {
    console.error('Text verification error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify text',
      error: error.message
    });
  }
}