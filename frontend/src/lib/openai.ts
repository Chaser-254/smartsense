// OpenAI API for disease detection
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface OpenAIDetectionResult {
  disease: string;
  confidence: number;
  description: string;
  recommendations: string[];
}

export async function detectDiseaseWithOpenAI(imageBase64: string): Promise<OpenAIDetectionResult> {
  try {
    const requestBody = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this plant image for diseases. Identify the disease, confidence level (0-100), provide a brief description, and list 3-5 treatment recommendations. Respond in JSON format with fields: disease, confidence, description, recommendations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.4
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      disease: result.disease || 'Unknown Disease',
      confidence: parseFloat(result.confidence) || 0.5,
      description: result.description || 'Disease detected in plant image',
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}
