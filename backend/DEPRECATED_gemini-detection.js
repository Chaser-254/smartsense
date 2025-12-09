// DEPRECATED: Google Gemini disease detection (moved out)
// This file was renamed to preserve original AI integration for future restoration.
// Original content archived.
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadToSupabase(base64Image) {
  const buffer = Buffer.from(base64Image, 'base64');
  const filename = `gemini-upload-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`;
  const path = `images/${filename}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  const { publicURL, error: urlErr } = supabase.storage.from('images').getPublicUrl(path);
  if (urlErr) throw new Error(`Supabase getPublicUrl error: ${urlErr.message}`);

  return publicURL;
}

async function detectDiseaseWithGemini(imageBase64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GEMINI_API_KEY}`
  };

  const payload = {
    input: {
      text: `Please identify the plant disease shown in the provided image and give a short description and confidence.`,
      inline_image: { bytes: imageBase64 }
    },
    temperature: 0.0
  };

  try {
    const resp = await axios.post(url, payload, { headers, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
    return { disease: resp.data?.candidates?.[0]?.content || 'Unknown', confidence: resp.data?.candidates?.[0]?.safetyScore ?? 0.5, description: resp.data?.candidates?.[0]?.content || '' };
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error('Gemini inline request error:', status, body?.error || body);

    if (status === 400 || status === 413 || status === 422) {
      try {
        const publicUrl = await uploadToSupabase(imageBase64);
        const urlPromptPayload = { input: { text: `Analyze the plant image at this URL and identify the disease. Image URL: ${publicUrl}` }, temperature: 0.0 };
        const retryResp = await axios.post(url, urlPromptPayload, { headers, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
        return { disease: retryResp.data?.candidates?.[0]?.content || 'Unknown', confidence: retryResp.data?.candidates?.[0]?.safetyScore ?? 0.5, description: retryResp.data?.candidates?.[0]?.content || '' };
      } catch (retryErr) {
        console.error('Gemini retry with URL failed:', retryErr.response?.status, retryErr.response?.data || retryErr.message);
        throw retryErr;
      }
    }

    throw err;
  }
}

module.exports = { detectDiseaseWithGemini };
