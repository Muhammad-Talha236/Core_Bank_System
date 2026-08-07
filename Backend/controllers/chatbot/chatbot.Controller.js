const pool = require('../../config/db');
const { embedText, generateAnswer } = require('../../services/gemini.service');

exports.askChatbot = async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ success: false, error: 'A valid question is required.' });
  }

  try {
    // 1. Generate embedding for the user's question
    const queryEmbedding = await embedText(question);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    // 2. Query the database for the top 3 most relevant knowledge chunks using vector distance
    const { rows: chunks } = await pool.query(
      `SELECT "SourceDoc", "SourceSection", "Content", ("Embedding" <=> $1) AS "distance"
       FROM "KnowledgeChunk"
       ORDER BY "distance" ASC
       LIMIT 3`,
      [vectorLiteral]
    );

    if (chunks.length === 0) {
      return res.json({
        success: true,
        answer: "I'm sorry, I couldn't find any relevant information in the knowledge base to answer your question."
      });
    }

    // 3. Assemble the retrieved context
    const contextText = chunks
      .map((c, index) => `[Source ${index + 1}: ${c.SourceDoc} - ${c.SourceSection || 'General'}]\n${c.Content}`)
      .join('\n\n---\n\n');

    // 4. Construct a prompt for Gemini
    const prompt = `You are a helpful AI assistant for Meridian Bank employees and customers. Answer the user's question accurately using ONLY the provided context below. If you don't know the answer based on the context, state that you cannot find the information in the help guide.

Context:
${contextText}

User Question: ${question}

Answer:`;

    // 5. Generate the final answer using Gemini
    const answer = await generateAnswer(prompt);

    res.json({
      success: true,
      answer,
      sources: chunks.map(c => ({ doc: c.SourceDoc, section: c.SourceSection }))
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};