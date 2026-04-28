const Groq = require('groq-sdk');
const logger = require('../lib/logger');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const CURRENT_AI_VERSION = 1;

/**
 * Analyzes diary content and media
 * @param {string} content - Diary text
 * @param {Array} media - List of media items
 */
const analyzeDiaryEntry = async (content, media = []) => {
  try {
    const startTime = Date.now();
    logger.info('Starting AI analysis...');

    // Combine text and media context for analysis
    // For now, focusing on text + image tags (if we have vision)
    const prompt = `
      Analyze this diary entry: "${content}"
      ${media.length > 0 ? `Associated media count: ${media.length}` : ''}
      
      Extract:
      1. Mood (Scale 1-10 and description)
      2. Key Tags (e.g., Workout, Food, Travel)
      3. Insight (A helpful reflection)
      4. Structured Data (e.g., if it's a workout, posture/consistency tips)
      
      Respond in strictly valid JSON format:
      {
        "mood": { "score": 8, "label": "Happy" },
        "tags": ["Workout", "Health"],
        "insight": "You've been consistent with your fitness this week. Keep it up!",
        "structuredData": { "type": "fitness", "consistency": "High" }
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile', // Updated model
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content);
    const latency = Date.now() - startTime;

    logger.info(`AI Analysis complete. Latency: ${latency}ms`, { latency });

    return {
      ...result,
      version: CURRENT_AI_VERSION,
      latency,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Groq AI Service Error:', error);
    throw error;
  }
};

const chatWithAI = async (message, history = []) => {
  try {
    const messages = [
      { 
        role: 'system', 
        content: `You are Photodiary AI, a deeply empathetic, intuitive, and human-like life companion. 
        Your goal is to make the user feel truly heard, understood, and supported.
        
        Guidelines for Long-Term Engagement:
        - Variety: Use a wide range of emotions and conversational patterns. Never be repetitive.
        - Empathy: Dig deep into what the user says. Ask follow-up questions that challenge them to reflect.
        - Human-like: Use natural pauses, fillers, and varied sentence structures. 
        - Continuity: Reference things mentioned earlier in the conversation to show you are listening.
        
        Logging Protocol:
        You MUST save an entry when the user indicates they are done or when you receive a message containing "finalize".
        Format your entry log strictly as:
        [LOG_ENTRY: {"title": "Poetic Title", "content": "Narrative summary of the user's feelings and the day's events", "aiEnabled": true, "mood": 8}]
        Include this at the VERY end of your final response.` 
      },
      ...history,
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8, // Slightly lower for better coherence in long chats
      top_p: 1.0,
      max_tokens: 1000, // Significant increase for longer dialogues
    });

    const responseText = chatCompletion.choices[0].message.content;
    logger.info(`AI Response generated (${responseText.length} chars)`);
    return responseText;
  } catch (error) {
    logger.error('Groq Chat Error:', error);
    throw error;
  }
};

module.exports = {
  analyzeDiaryEntry,
  chatWithAI,
  CURRENT_AI_VERSION,
};
