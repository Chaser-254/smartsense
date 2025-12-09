const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
// AI detection modules are deprecated and replaced with DB-driven detection.
// See DEPRECATED_gemini-detection.js and DEPRECATED_openai-detection.js for archived code.
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

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
    const { cropName } = req.body;

    if (!cropName || typeof cropName !== 'string' || !cropName.trim()) {
      return res.status(400).json({ success: false, error: 'cropName is required in request body' });
    }

    let userId = null;
    if (token) {
      try { const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret'); userId = decoded.userId; } catch (e) { /* ignore invalid token */ }
    }

    // Database-driven detection: infer most-likely disease from historical scan_results for the crop
    let diseaseName = 'Unknown';
    let confidence = 50; // default confidence when insufficient data
    let description = `Insufficient historical data for ${cropName}`;
    let pesticideRecommendations = [];

    try {
      const { data: pastScans, error: pastError } = await supabase
        .from('scan_results')
        .select('detected_disease, confidence_score')
        .ilike('crop_name', cropName)
        .limit(1000);

      if (pastError) {
        console.error('Error fetching past scans:', pastError);
      }

      if (Array.isArray(pastScans) && pastScans.length > 0) {
        const freq = {};
        for (const s of pastScans) {
          const d = s.detected_disease || 'Unknown';
          freq[d] = (freq[d] || 0) + 1;
        }

        const ranked = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        diseaseName = ranked[0][0];
        const count = ranked[0][1];
        const total = pastScans.length;
        confidence = Math.round((count / total) * 100);
        description = `Most likely disease for ${cropName} based on historical scans`;
      } else {
        // No historical scans for this crop; leave defaults
        diseaseName = 'Unknown';
        confidence = 50;
        description = `No historical data for ${cropName}`;
      }
    } catch (err) {
      console.error('DB-driven detection error:', err);
    }

    pesticideRecommendations = await getPesticideRecommendations(diseaseName);

    // Insert the scan result (record cropName instead of image URL)
    try {
      await supabase.from('scan_results').insert([{
        user_id: userId,
        crop_name: cropName,
        detected_disease: diseaseName,
        confidence_score: confidence,
        description,
        recommendations: pesticideRecommendations,
        pesticides: pesticideRecommendations
      }]);
    } catch (err) {
      console.error('Error inserting scan_result:', err);
    }

    // Update user statistics if authenticated
    if (userId) {
      try {
        const { data: user } = await supabase.from('users').select('statistics').eq('id', userId).single();
        const stats = user?.statistics || { totalScans: 0, successfulDetections: 0, lastScanDate: null, favoriteCrops: [] };
        stats.totalScans = (stats.totalScans || 0) + 1;
        if (diseaseName && diseaseName !== 'Unknown') stats.successfulDetections = (stats.successfulDetections || 0) + 1;
        stats.lastScanDate = new Date().toISOString();
        await supabase.from('users').update({ statistics: stats, updated_at: new Date().toISOString() }).eq('id', userId);

        await supabase.from('user_activities').insert([{ user_id: userId, action: 'disease_detection', details: { disease: diseaseName, confidence, timestamp: new Date().toISOString() } }]);
      } catch (err) {
        console.error('Error updating user statistics:', err);
      }
    }

    return res.json({ success: true, disease: diseaseName, confidence, description, pesticides: pesticideRecommendations });
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({ success: false, error: error.message });
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
