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
    // Mock trending data for now
    const mockTrending = [
      {
        title: "Government announces new digital initiative",
        category: "Technology",
        source: "PIB",
        avgTruthScore: 92
      },
      {
        title: "Economic reforms show positive impact",
        category: "Economy",
        source: "Ministry of Finance",
        avgTruthScore: 88
      },
      {
        title: "Healthcare infrastructure improvements",
        category: "Health",
        source: "Ministry of Health",
        avgTruthScore: 85
      },
      {
        title: "Education policy updates announced",
        category: "Education",
        source: "Ministry of Education",
        avgTruthScore: 90
      },
      {
        title: "Environmental conservation measures",
        category: "Environment",
        source: "Ministry of Environment",
        avgTruthScore: 87
      },
      {
        title: "Infrastructure development progress",
        category: "Infrastructure",
        source: "PIB",
        avgTruthScore: 89
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        trending: mockTrending
      }
    });

  } catch (error) {
    console.error('Trending news fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending topics',
      error: error.message
    });
  }
}