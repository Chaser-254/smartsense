// Google Gemini disease detection
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

async function detectDiseaseWithGemini(imageBase64) {
  try {
    const requestBody = {
      contents: [{
        parts: [
          {
            text: "Analyze this plant image for diseases. Identify the disease, confidence level (0-100), provide a brief description, and list 3-5 treatment recommendations. Respond in JSON format with fields: disease, confidence, description, recommendations."
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      disease: result.disease || 'Unknown Disease',
      confidence: parseFloat(result.confidence) || 0.5,
      description: result.description || 'Disease detected in plant image',
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
    };

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

module.exports = { detectDiseaseWithGemini };
