const OpenAI = require('openai').OpenAI;

// Groq is OpenAI-compatible — same SDK, different baseURL + key
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

async function chatCompletion(messages, options = {}) {
  try {
    const response = await client.chat.completions.create({
      model: options.model || 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 4096,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('Groq API error:', err.status, err.message?.slice(0, 120));
    if (err.status === 401) throw new Error('Invalid Groq API key. Check GROQ_API_KEY in .env.');
    if (err.status === 429) throw new Error('Rate limit hit. Try again in a moment.');
    throw new Error('AI service unavailable. Please try again.');
  }
}

module.exports = { chatCompletion };
