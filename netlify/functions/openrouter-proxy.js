// netlify/functions/openrouter-proxy.js
exports.handler = async (event) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const body = event.body;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.text();
    return {
      statusCode: response.status,
      body: data,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}; 