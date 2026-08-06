// Wrapper around Google's Gemini API. Uses plain fetch (Node 18+ has this
// built in) rather than an SDK, to keep dependencies minimal.

const EMBEDDING_MODEL = "gemini-embedding-001";
const CHAT_MODEL = 'gemini-2.5-flash';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Converts a piece of text into a 768-dimension vector that captures its
// meaning. Used both when ingesting knowledge base documents, and when a
// user asks a question (so we can compare "meaning" via vector similarity).
async function embedText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

 const response = await fetch(
  `${BASE_URL}/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: {
        parts: [{ text }]
      },
      outputDimensionality: 768
    })
  }
);

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini embedding request failed: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  return data.embedding.values; // array of 768 numbers
}

// Sends a prompt (question + retrieved context) to Gemini and returns the
// generated answer text.
async function generateAnswer(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');

  const response = await fetch(
    `${BASE_URL}/${CHAT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini generation request failed: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  const candidate = data.candidates && data.candidates[0];
  if (!candidate || !candidate.content) {
    throw new Error('Gemini returned no answer (possibly blocked by safety filters)');
  }
  return candidate.content.parts.map((p) => p.text).join('');
}

module.exports = { embedText, generateAnswer };