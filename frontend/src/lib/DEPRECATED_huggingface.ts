// DEPRECATED: Hugging Face integration (archived)
const HUGGINGFACE_API_KEY = (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) || '';
const MODEL_URL = 'https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';

export interface DetectionResult {
  disease: string;
  confidence: number;
  description?: string;
}

export async function detectDisease(imageBase64: string): Promise<DetectionResult> {
  console.log('DEPRECATED detectDisease called with imageBase64 length:', imageBase64.length);
  try {
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const blob = new Blob([imageBytes], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append("image", blob, "plant.jpg");

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${HUGGINGFACE_API_KEY}` },
      body: formData,
    });

    if (!response.ok) throw new Error(`Hugging Face API error: ${response.statusText}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const topPrediction = data[0];
      return { disease: topPrediction.label || "Unknown Disease", confidence: Math.round((topPrediction.score || 0) * 100), description: `Detected: ${topPrediction.label} with ${Math.round((topPrediction.score || 0) * 100)}% confidence` };
    }

    return { disease: "Unknown", confidence: 0, description: "Unable to detect disease" };
  } catch (error) {
    console.error("DEPRECATED Disease detection error:", error);
    return { disease: "Error", confidence: 0, description: error instanceof Error ? error.message : "Unknown error occurred" };
  }
}
