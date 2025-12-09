import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Upload, AlertCircle, CheckCircle, Droplets, DollarSign, Shield, Loader2 } from 'lucide-react';
import { detectDisease } from '../lib/api';
import { calculateTotalCost } from '../lib/pesticides';

interface DetailedScanResult {
  diseaseDetected: boolean;
  diseaseName?: string;
  description?: string;
  confidence: number;
  recommendations: {
    pesticides: any[];
    practices: string[];
  };
}


export default function ScanPage() {
  console.log('ScanPage component rendering');
  const { token } = useAuth();
  const [cropType, setCropType] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DetailedScanResult | null>(null);
  const [error, setError] = useState('');

  // Image upload UI restored for future use (no image data is sent to the backend)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleScan = async () => {
    console.log('handleScan called, selectedImage present:', !!selectedImage, 'cropType:', cropType);
    if (!cropType.trim()) return;

    setScanning(true);
    setError('');

    try {
      // Call backend API for disease detection (DB-driven)
      const detectionResult = await detectDisease(cropType.trim(), token || undefined);
      console.log('Detection result:', detectionResult);
      
      // Create result for display
      const scanResult: DetailedScanResult = {
        diseaseDetected: detectionResult.confidence > 50,
        diseaseName: detectionResult.disease,
        description: detectionResult.description,
        confidence: detectionResult.confidence,
        recommendations: {
          pesticides: detectionResult.pesticides || [],
          practices: [
            'Maintain good sanitation practices in the field',
            'Monitor plants regularly for early disease detection',
            'Provide proper air circulation and drainage',
            'Use disease-resistant varieties when available',
            'Follow appropriate watering and fertilization practices',
          ],
        },
      };

      setResult(scanResult);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during scanning');
    } finally {
      setScanning(false);
    }
  };

  const handleNewScan = () => {
    if (selectedImage) setSelectedImage(null);
    setCropType('');
    setResult(null);
    setError('');
  };

  if (result) {
    const pesticides = result.recommendations.pesticides;
    const costs = calculateTotalCost(pesticides);
    const averageCost = pesticides.length > 0 ? costs.perApplication / pesticides.length : 0;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
          result.diseaseDetected ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
        }`}>
          <div className="flex items-start gap-4">
            {result.diseaseDetected ? (
              <div className="bg-red-500 p-3 rounded-full flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="bg-green-500 p-3 rounded-full flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}

            <div className="flex-1">
              <h3 className={`text-2xl font-bold mb-2 ${
                result.diseaseDetected ? 'text-red-800' : 'text-green-800'
              }`}>
                {result.diseaseDetected ? 'Disease Detected' : 'Healthy Crop'}
              </h3>
              {result.diseaseName && (
                <p className="text-xl font-semibold text-red-700 mb-3">
                  {result.diseaseName}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Confidence:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.diseaseDetected ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${result.confidence}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {result.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {result.diseaseDetected && pesticides.length > 0 && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                Recommended Pesticides
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pesticides.map((pesticide) => (
                  <div
                    key={pesticide.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{pesticide.name}</h4>
                        <p className="text-sm text-gray-600">{pesticide.type}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        pesticide.priorityLevel === 'high'
                          ? 'bg-red-100 text-red-700'
                          : pesticide.priorityLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {pesticide.priorityLevel.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-3">
                      <p className="text-gray-700">{pesticide.description}</p>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600">
                          <span className="font-semibold">Active Ingredient:</span> {pesticide.activeIngredients}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-gray-600">Method</p>
                        <p className="font-semibold text-gray-800">{pesticide.applicationMethod}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-gray-600">Dosage</p>
                        <p className="font-semibold text-gray-800">{pesticide.recommendedDosage}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Frequency: {pesticide.applicationFrequency}</span>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Cost</p>
                        <p className="text-lg font-bold text-green-600">
                          {pesticide.currency} {pesticide.costPerUnit.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Safety Precautions:</p>
                      <p className="text-xs text-gray-700 bg-amber-50 p-2 rounded">
                        {pesticide.safetyPrecautions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-gray-600">Cost per Application</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {costs.currency} {costs.perApplication.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">For all {pesticides.length} products</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-gray-600">Average per Product</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {costs.currency} {averageCost.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Single pesticide cost</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-gray-600">Total for 3-Month Cycle</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {costs.currency} {(costs.perApplication * 12).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">~4 applications</p>
              </div>
            </div>
          </>
        )}

        {result.recommendations.practices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Best Practices to Prevent This Disease</h4>
            <ul className="space-y-3">
              {result.recommendations.practices.map((practice, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleNewScan}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 rounded-lg transition duration-200"
        >
          Scan Another Crop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Scan Crop</h2>
            <p className="text-gray-600">You can optionally upload an image for future AI features. Current detection uses the crop name only.</p>
          </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crop Type
          </label>
          <input
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            placeholder="e.g., Tomato, Beans, Kales, Okra, Capsicum,Blacknight shade"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
          />
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image (Future AI Feature)
            </label>

            {!selectedImage ? (
              <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium mb-1">Upload a picture of the infected crop (Future AI Feature)</p>
                <p className="text-sm text-gray-500">PNG, JPG — image is optional and not sent to the server</p>
              </label>
            ) : (
              <div className="space-y-4">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected crop"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="flex-1 py-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    Choose Different Image
                  </button>
                </div>
              </div>
            )}
          </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={!cropType.trim() || scanning}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {scanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing the disease, be patient...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Scan for Diseases
            </>
          )}
        </button>
      </div>
    </div>
  );
}
