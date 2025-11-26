const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { detectDiseaseWithGemini } = require('./gemini-detection');
const { detectDiseaseWithOpenAI } = require('./openai-detection');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crop-disease-db';
let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
    
    // Create indexes for users collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

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
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected'
      });
    }

    const { email, password, fullName, phone, location, farmSize, cropTypes } = req.body;
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists'
      });
    }

    // Hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create comprehensive user profile
    const userProfile = {
      email,
      password: hashedPassword,
      fullName,
      phone: phone || '',
      location: location || '',
      farmSize: farmSize || '',
      cropTypes: cropTypes || [],
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
        startDate: new Date(),
        features: ['basic_detection', 'limited_recommendations']
      },
      statistics: {
        totalScans: 0,
        successfulDetections: 0,
        lastScanDate: null,
        favoriteCrops: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      isActive: true,
      isVerified: false
    };

    // Insert user into database
    const result = await db.collection('users').insertOne(userProfile);

    // Create user activity log
    await db.collection('user_activities').insertOne({
      userId: result.insertedId,
      action: 'registration',
      details: {
        email,
        fullName,
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress
      },
      createdAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertedId, email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data without sensitive information
    const { password: _, ...userResponse } = userProfile;

    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: { 
        email, 
        fullName, 
        id: result.insertedId,
        phone: userResponse.phone,
        location: userResponse.location,
        farmSize: userResponse.farmSize,
        cropTypes: userResponse.cropTypes,
        createdAt: userResponse.createdAt
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
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected'
      });
    }

    const { email, password } = req.body;
    
    // Find user
    const user = await db.collection('users').findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials'
      });
    }

    // Check if password is valid
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Log login activity
    await db.collection('user_activities').insertOne({
      userId: user._id,
      action: 'login',
      details: {
        email,
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress
      },
      createdAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data without sensitive information
    const { password: _, ...userResponse } = user;

    res.json({ 
      success: true, 
      message: 'Signed in successfully',
      user: { 
        email: user.email, 
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        location: user.location,
        farmSize: user.farmSize,
        cropTypes: user.cropTypes,
        profile: user.profile,
        settings: user.settings,
        subscription: user.subscription,
        statistics: user.statistics,
        createdAt: user.createdAt,
        lastLogin: new Date()
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
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId), 
      isActive: true 
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, ...userProfile } = user;
    res.json({ success: true, user: userProfile });
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
    const updates = req.body;
    
    // Remove sensitive fields from updates
    const { password, _id, createdAt, ...allowedUpdates } = updates;
    
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          ...allowedUpdates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Log profile update activity
    await db.collection('user_activities').insertOne({
      userId: new ObjectId(decoded.userId),
      action: 'profile_update',
      details: {
        updatedFields: Object.keys(allowedUpdates),
        timestamp: new Date()
      },
      createdAt: new Date()
    });

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
        userId = new ObjectId(decoded.userId);
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
        // Convert base64 to buffer for Hugging Face
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        
        // Create form data for Hugging Face API
        const formData = new FormData();
        formData.append('image', imageBuffer, 'plant.jpg');

        // Call Hugging Face API
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
    const confidence = detectionResult.confidence;

    // Get pesticide recommendations with prices
    const pesticideRecommendations = await getPesticideRecommendations(diseaseName);

    // Update user statistics if authenticated
    if (userId) {
      await db.collection('users').updateOne(
        { _id: userId },
        {
          $inc: { 'statistics.totalScans': 1, 'statistics.successfulDetections': 1 },
          $set: { 
            'statistics.lastScanDate': new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Log detection activity
      await db.collection('user_activities').insertOne({
        userId,
        action: 'disease_detection',
        details: {
          disease: diseaseName,
          confidence: confidence,
          timestamp: new Date()
        },
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      disease: diseaseName,
      confidence: confidence,
      description: detectionResult.description || `Detected ${diseaseName} with ${Math.round(confidence * 100)}% confidence`,
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

// Pesticide recommendation function with web scraping
async function getPesticideRecommendations(disease) {
  try {
    // Pesticide database for common plant diseases
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
      ],
      'healthy': [
        { name: 'Preventive Copper Spray', type: 'Preventive', activeIngredient: 'Copper' },
        { name: 'Neem Oil', type: 'Organic Preventive', activeIngredient: 'Azadirachtin' }
      ]
    };

    // Find matching pesticides for the detected disease
    let recommendations = [];
    
    // Try to find exact match first
    if (pesticideDatabase[disease]) {
      recommendations = pesticideDatabase[disease];
    } else {
      // Try to find partial match
      for (const [key, pesticides] of Object.entries(pesticideDatabase)) {
        if (disease.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(disease.toLowerCase())) {
          recommendations = pesticides;
          break;
        }
      }
    }

    // If no match found, provide general recommendations
    if (recommendations.length === 0) {
      recommendations = [
        { name: 'Broad Spectrum Fungicide', type: 'Fungicide', activeIngredient: 'Multi-purpose formula' },
        { name: 'Neem Oil', type: 'Organic', activeIngredient: 'Azadirachtin' }
      ];
    }

    // Scrape prices for each pesticide
    const recommendationsWithPrices = await Promise.all(
      recommendations.map(async (pesticide) => {
        try {
          const priceInfo = await scrapePesticidePrice(pesticide.name);
          return {
            ...pesticide,
            price: priceInfo.price,
            currency: priceInfo.currency,
            source: priceInfo.source,
            availability: priceInfo.availability
          };
        } catch (error) {
          console.error(`Error scraping price for ${pesticide.name}:`, error);
          return {
            ...pesticide,
            price: 'Price not available',
            currency: 'USD',
            source: 'Local store',
            availability: 'Check locally'
          };
        }
      })
    );

    return recommendationsWithPrices;
  } catch (error) {
    console.error('Error getting pesticide recommendations:', error);
    return [];
  }
}

// Web scraping function for pesticide prices
async function scrapePesticidePrice(pesticideName) {
  try {
    // Try multiple e-commerce sites for agricultural supplies
    const sites = [
      {
        name: 'Amazon',
        url: `https://www.amazon.com/s?k=${encodeURIComponent(pesticideName + ' fungicide pesticide')}`,
        priceSelector: '.a-price-whole',
        availabilitySelector: '.a-color-success'
      },
      {
        name: 'Home Depot',
        url: `https://www.homedepot.com/s/${encodeURIComponent(pesticideName + ' fungicide')}`,
        priceSelector: '.price',
        availabilitySelector: '.availability'
      }
    ];

    for (const site of sites) {
      try {
        const response = await axios.get(site.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 5000
        });

        const $ = cheerio.load(response.data);
        
        // Extract price
        const priceElement = $(site.priceSelector).first();
        let price = 'Price not available';
        
        if (priceElement.length > 0) {
          price = priceElement.text().trim();
        }

        // Extract availability
        const availabilityElement = $(site.availabilitySelector).first();
        let availability = 'Check availability';
        
        if (availabilityElement.length > 0) {
          availability = availabilityElement.text().trim();
        }

        return {
          price: price,
          currency: 'USD',
          source: site.name,
          availability: availability
        };
      } catch (siteError) {
        console.log(`Failed to scrape ${site.name}:`, siteError.message);
        continue;
      }
    }

    // If all sites fail, return mock data
    return {
      price: `$${(Math.random() * 50 + 10).toFixed(2)}`,
      currency: 'USD',
      source: 'Estimated price',
      availability: 'In stock'
    };
  } catch (error) {
    console.error('Error scraping pesticide price:', error);
    return {
      price: 'Price not available',
      currency: 'USD',
      source: 'Local store',
      availability: 'Check locally'
    };
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDB();
});
