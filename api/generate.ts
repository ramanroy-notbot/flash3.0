export default async function handler(req: any, res: any) {
  // 1. Enable CORS for cross-origin requests from your PWA
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle browser preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Fetch the Gemini API Key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.'
      });
    }

    // 3. Extract request body data from frontend
    const body = req.body || {};
    const userPrompt = body.prompt || 'Generate flashcards from the provided medical material.';

    // 4. Forward the prompt to Google's Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: userPrompt }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Failed to call Gemini API'
      });
    }

    // 5. Return Gemini output to the frontend
    return res.status(200).json({
  success: true,
  deck: data
});
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Internal Server Error'
    });
  }
}

