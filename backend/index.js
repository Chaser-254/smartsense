const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { detectDiseaseWithGemini } = require('./gemini-detection');
const { detectDiseaseWithOpenAI } = require('./openai-detection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Crop Disease Detection API' });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName, phone, location, farmSize, cropTypes } = req.body;
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        full_name: fullName,
        phone: phone || '',
        location: location || '',
        farm_size: farmSize || '',
        crop_types: cropTypes || [],
        profile: {
          bio: '',
          experience: '',
          preferredCrops: [],
          farmingMethods: []
        },
        settings: {
          notifications: true,
          emailAlerts: true,
          language: 'en'
        },
        subscription: {
          plan: 'free',
          startDate: new Date().toISOString(),
          features: ['basic_detection', 'limited_recommendations']
        },
        statistics: {
          totalScans: 0,
          successfulDetections: 0,
          lastScanDate: null,
          favoriteCrops: []
        }
      }])
      .select()
      .single();

    if (userError) throw userError;

    // Log activity
    await supabase
      .from('user_activities')
      .insert([{
        user_id: user.id,
        action: 'registration',
        details: {
          email,
          fullName,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || req.connection.remoteAddress
        }
      }]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const { password: _, ...userResponse } = user;

    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: { 
        email: user.email, 
        fullName: user.full_name, 
        id: user.id,
        phone: user.phone,
        location: user.location,
        farmSize: user.farm_size,
        cropTypes: user.crop_types,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Log activity
    await supabase
      .from('user_activities')
      .insert([{
        user_id: user.id,
        action: 'login',
        details: {
          email,
          timestamp: new Date().toISOString(),
          ipAddress: req.ip || req.connection.remoteAddress
        }
      }]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const { password: _, ...userResponse } = user;

    res.json({ 
      success: true, 
      message: 'Signed in successfully',
      user: { 
        email: user.email, 
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        location: user.location,
        farmSize: user.farm_size,
        cropTypes: user.crop_types,
        profile: user.profile,
        settings: user.settings,
        subscription: user.subscription,
        statistics: user.statistics,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString()
      },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// User profile routes
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, ...userProfile } = user;
    res.json({ 
      success: true, 
      data: {
        ...userProfile,
        fullName: user.full_name,
        farmSize: user.farm_size
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { fullName, phone, location, farmSize } = req.body;
    
    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        phone: phone,
        location: location,
        farm_size: farmSize,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId);

    if (error) throw error;

    // Log activity
    await supabase
      .from('user_activities')
      .insert([{
        user_id: decoded.userId,
        action: 'profile_update',
        details: {
          updatedFields: ['fullName', 'phone', 'location', 'farmSize'],
          timestamp: new Date().toISOString()
        }
      }]);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disease detection route
app.post('/api/detect-disease', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { imageBase64, aiProvider = 'huggingface' } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId;
      } catch (error) {
        // Token invalid, continue without user tracking
      }
    }

    let detectionResult;

    // Use different AI providers based on selection
    switch (aiProvider.toLowerCase()) {
      case 'gemini':
        detectionResult = await detectDiseaseWithGemini(imageBase64);
        break;
      case 'openai':
        detectionResult = await detectDiseaseWithOpenAI(imageBase64);
        break;
      case 'huggingface':
      default:
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const formData = new FormData();
        formData.append('image', imageBuffer, 'plant.jpg');

        const response = await axios.post(
          'https://api-inference.huggingface.co/models/Intel/plant-disease-detection',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
            }
          }
        );

        const predictions = response.data;
        if (!predictions || predictions.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No disease detected'
          });
        }

        const topPrediction = predictions[0];
        detectionResult = {
          disease: topPrediction.label || "Unknown Disease",
          confidence: topPrediction.score || 0.5,
          description: `Detected ${topPrediction.label || "Unknown Disease"} with ${Math.round((topPrediction.score || 0.5) * 100)}% confidence`
        };
        break;
    }

    const diseaseName = detectionResult.disease;
    const confidence = Math.round(detectionResult.confidence * 100);

    // Get pesticide recommendations
    const pesticideRecommendations = await getPesticideRecommendations(diseaseName);

    // Update user statistics if authenticated
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('statistics')
        .eq('id', userId)
        .single();

      const stats = user.statistics;
      stats.totalScans += 1;
      stats.successfulDetections += 1;
      stats.lastScanDate = new Date().toISOString();

      await supabase
        .from('users')
        .update({ 
          statistics: stats,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Log detection activity
      await supabase
        .from('user_activities')
        .insert([{
          user_id: userId,
          action: 'disease_detection',
          details: {
            disease: diseaseName,
            confidence: confidence,
            timestamp: new Date().toISOString()
          }
        }]);

      // Store scan result
      await supabase
        .from('scan_results')
        .insert([{
          user_id: userId,
          detected_disease: diseaseName,
          confidence_score: confidence,
          description: detectionResult.description,
          recommendations: detectionResult.recommendations || [],
          pesticides: pesticideRecommendations
        }]);
    }

    res.json({
      success: true,
      disease: diseaseName,
      confidence: confidence,
      description: detectionResult.description || `Detected ${diseaseName} with ${confidence}% confidence`,
      pesticides: pesticideRecommendations
    });

  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Pesticide recommendation function
async function getPesticideRecommendations(disease) {
  try {
    const pesticideDatabase = {
      'Leaf Blight': [
        { name: 'Copper Fungicide', type: 'Fungicide', activeIngredient: 'Copper hydroxide' },
        { name: 'Chlorothalonil', type: 'Fungicide', activeIngredient: 'Chlorothalonil' },
        { name: 'Mancozeb', type: 'Fungicide', activeIngredient: 'Mancozeb' }
      ],
      'Powdery Mildew': [
        { name: 'Sulfur Fungicide', type: 'Fungicide', activeIngredient: 'Sulfur' },
        { name: 'Neem Oil', type: 'Organic', activeIngredient: 'Azadirachtin' },
        { name: 'Potassium Bicarbonate', type: 'Fungicide', activeIngredient: 'Potassium bicarbonate' }
      ],
      'Rust': [
        { name: 'Myclobutanil', type: 'Fungicide', activeIngredient: 'Myclobutanil' },
        { name: 'Tebuconazole', type: 'Fungicide', activeIngredient: 'Tebuconazole' },
        { name: 'Copper Soap', type: 'Fungicide', activeIngredient: 'Copper octanoate' }
      ],
      'Bacterial Spot': [
        { name: 'Copper Hydroxide', type: 'Fungicide', activeIngredient: 'Copper hydroxide' },
        { name: 'Streptomycin', type: 'Antibiotic', activeIngredient: 'Streptomycin' },
        { name: 'Bacillus subtilis', type: 'Biological', activeIngredient: 'Bacillus subtilis' }
      ]
    };

    let recommendations = [];
    
    if (pesticideDatabase[disease]) {
      recommendations = pesticideDatabase[disease];
    } else {
      for (const [key, pesticides] of Object.entries(pesticideDatabase)) {
        if (disease.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(disease.toLowerCase())) {
          recommendations = pesticides;
          break;
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations = [
        { name: 'Broad Spectrum Fungicide', type: 'Fungicide', activeIngredient: 'Multi-purpose formula' },
        { name: 'Neem Oil', type: 'Organic', activeIngredient: 'Azadirachtin' }
      ];
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting pesticide recommendations:', error);
    return [];
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
