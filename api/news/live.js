import axios from 'axios';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'News API key not configured' 
      });
    }

    const pageSize = parseInt(req.query.pageSize) || 6;
    const country = req.query.country || 'in';

    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: country,
        pageSize: pageSize,
        apiKey: apiKey
      },
      timeout: 10000
    });

    res.status(200).json({
      success: true,
      data: {
        articles: response.data.articles || [],
        totalResults: response.data.totalResults || 0
      }
    });

  } catch (error) {
    console.error('Live news fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live news',
      error: error.message
    });
  }
}