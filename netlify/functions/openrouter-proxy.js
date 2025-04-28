// netlify/functions/openrouter-proxy.js
exports.handler = async (event) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  let bodyObj = JSON.parse(event.body);
  // Check if a system message enforcing English already exists
  const hasEnglishSystemMsg = Array.isArray(bodyObj.messages) && bodyObj.messages.some(
    msg => msg.role === 'system' && /english/i.test(msg.content)
  );
  if (Array.isArray(bodyObj.messages) && !hasEnglishSystemMsg) {
    bodyObj.messages.unshift({
      role: "system",
      content: "You must always answer in English."
    });
  }
  const body = JSON.stringify(bodyObj);

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