import { PesticideRecommendation } from './supabase';

const pesticidesDatabase: Record<string, PesticideRecommendation[]> = {
  'Early Blight': [
    {
      id: 'eb-1',
      name: 'Chlorothalonil (Bravo)',
      type: 'Fungicide - Contact',
      activeIngredients: 'Chlorothalonil 75%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Wear protective gloves and mask. Do not apply in rain. Avoid drift to non-target plants.',
      costPerUnit: 12.50,
      currency: 'USD',
      recommendedDosage: '1.5 lbs per 100 gallons of water',
      applicationFrequency: 'Every 7-10 days',
      priorityLevel: 'high',
      description: 'Broad-spectrum fungicide effective against early blight. Non-systemic protection.',
    },
    {
      id: 'eb-2',
      name: 'Copper Fungicide',
      type: 'Fungicide - Contact',
      activeIngredients: 'Copper Oxide 40%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Use in well-ventilated areas. Avoid excessive application. Can cause phytotoxicity in hot weather.',
      costPerUnit: 8.75,
      currency: 'USD',
      recommendedDosage: '2-3 tablespoons per gallon of water',
      applicationFrequency: 'Every 7-14 days',
      priorityLevel: 'medium',
      description: 'Organic-approved fungicide. Effective preventative when applied before disease appears.',
    },
    {
      id: 'eb-3',
      name: 'Mancozeb (Dithane)',
      type: 'Fungicide - Protectant',
      activeIngredients: 'Mancozeb 80%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Apply in early morning or evening. Avoid application during extreme heat.',
      costPerUnit: 9.25,
      currency: 'USD',
      recommendedDosage: '1.5 lbs per 100 gallons of water',
      applicationFrequency: 'Every 7-10 days',
      priorityLevel: 'high',
      description: 'Multi-site contact fungicide. Good preventative for early blight management.',
    },
    {
      id: 'eb-4',
      name: 'Bacillus subtilis (Serenade)',
      type: 'Fungicide - Biological',
      activeIngredients: 'Bacillus subtilis strain QST 713',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Biodegradable and safe. No restrictions. Can be used up to harvest.',
      costPerUnit: 35.00,
      currency: 'USD',
      recommendedDosage: '2-3 tablespoons per gallon',
      applicationFrequency: 'Every 7 days',
      priorityLevel: 'medium',
      description: 'Organic certified. Biocontrol agent. Ideal for organic farming practices.',
    },
  ],
  'Late Blight': [
    {
      id: 'lb-1',
      name: 'Metalaxyl-M + Mancozeb',
      type: 'Fungicide - Systemic + Protectant',
      activeIngredients: 'Metalaxyl-M 4% + Mancozeb 64%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Excellent coverage required. Rotate with other fungicides to prevent resistance.',
      costPerUnit: 22.50,
      currency: 'USD',
      recommendedDosage: '2 lbs per 100 gallons of water',
      applicationFrequency: 'Every 7-10 days',
      priorityLevel: 'high',
      description: 'Excellent for late blight control. Systemic action for preventative protection.',
    },
    {
      id: 'lb-2',
      name: 'Fluopicolide (Presidio)',
      type: 'Fungicide - Systemic',
      activeIngredients: 'Fluopicolide 38.7%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Do not apply more than 2 consecutive sprays. Rotate with other fungicides.',
      costPerUnit: 28.75,
      currency: 'USD',
      recommendedDosage: '4 fl oz per 100 gallons of water',
      applicationFrequency: 'Every 7-10 days',
      priorityLevel: 'high',
      description: 'New generation fungicide. Excellent disease control and plant health benefits.',
    },
    {
      id: 'lb-3',
      name: 'Copper Hydroxide + Sulfur',
      type: 'Fungicide - Contact',
      activeIngredients: 'Copper Hydroxide 25% + Sulfur 50%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Do not apply within 2 weeks of oil spray. Avoid use in high temperatures.',
      costPerUnit: 15.50,
      currency: 'USD',
      recommendedDosage: '3 tablespoons per gallon of water',
      applicationFrequency: 'Every 10-14 days',
      priorityLevel: 'medium',
      description: 'Organic option for late blight prevention. Non-synthetic formulation.',
    },
  ],
  'Powdery Mildew': [
    {
      id: 'pm-1',
      name: 'Sulfur (Flour)',
      type: 'Fungicide - Contact',
      activeIngredients: 'Sulfur 99.5%',
      applicationMethod: 'Dust or spray',
      safetyPrecautions: 'Do not apply within 2 weeks of oil spray. Wear mask to avoid inhalation.',
      costPerUnit: 5.50,
      currency: 'USD',
      recommendedDosage: '2-3 lbs per 100 gallons water',
      applicationFrequency: 'Every 7-14 days',
      priorityLevel: 'low',
      description: 'Most economical option. Organic certified. Long history of effectiveness.',
    },
    {
      id: 'pm-2',
      name: 'Potassium Bicarbonate (Milstop)',
      type: 'Fungicide - Contact',
      activeIngredients: 'Potassium Bicarbonate 85%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Organic approved. Very low toxicity. Safe for beneficial insects.',
      costPerUnit: 18.50,
      currency: 'USD',
      recommendedDosage: '1-2 tablespoons per gallon of water',
      applicationFrequency: 'Every 7-10 days',
      priorityLevel: 'medium',
      description: 'Organic-approved fungicide. Works by changing leaf surface pH.',
    },
    {
      id: 'pm-3',
      name: 'Trichoderma harzianum',
      type: 'Fungicide - Biological',
      activeIngredients: 'Trichoderma harzianum spores',
      applicationMethod: 'Foliar spray or soil drench',
      safetyPrecautions: 'Safe for all beneficial organisms. No re-entry restrictions.',
      costPerUnit: 32.00,
      currency: 'USD',
      recommendedDosage: '1-2 tablespoons per gallon',
      applicationFrequency: 'Every 7 days',
      priorityLevel: 'medium',
      description: 'Biocontrol fungicide. Organic certified. Excellent for preventive programs.',
    },
  ],
  'Leaf Spot': [
    {
      id: 'ls-1',
      name: 'Chlorothalonil',
      type: 'Fungicide - Contact',
      activeIngredients: 'Chlorothalonil 75%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Wear protective equipment. Do not apply during rain.',
      costPerUnit: 11.75,
      currency: 'USD',
      recommendedDosage: '1.5 lbs per 100 gallons of water',
      applicationFrequency: 'Every 7-10 days',
      priorityLevel: 'high',
      description: 'Broad-spectrum protectant fungicide. Excellent for leaf spot prevention.',
    },
    {
      id: 'ls-2',
      name: 'Streptomycin',
      type: 'Fungicide - Antibiotic',
      activeIngredients: 'Streptomycin Sulfate 17%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Restricted use in some areas. Check local regulations.',
      costPerUnit: 24.50,
      currency: 'USD',
      recommendedDosage: '100 ppm solution',
      applicationFrequency: 'Every 7 days',
      priorityLevel: 'high',
      description: 'Systemic antibiotic. Highly effective for bacterial leaf spots.',
    },
  ],
  'Powdery Mildew Tomato': [
    {
      id: 'pmt-1',
      name: 'Neem Oil',
      type: 'Fungicide - Botanical',
      activeIngredients: 'Azadirachtin 0.5%',
      applicationMethod: 'Foliar spray',
      safetyPrecautions: 'Do not apply in direct sunlight. Best applied in evening.',
      costPerUnit: 14.25,
      currency: 'USD',
      recommendedDosage: '2% solution in water',
      applicationFrequency: 'Every 7-14 days',
      priorityLevel: 'medium',
      description: 'Organic-approved. Multi-purpose fungicide and insecticide.',
    },
  ],
};

export function getPesticideRecommendations(disease: string): PesticideRecommendation[] {
  const normalizedDisease = disease
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  for (const [key, pesticides] of Object.entries(pesticidesDatabase)) {
    if (key.toLowerCase().includes(normalizedDisease) || normalizedDisease.includes(key.toLowerCase())) {
      return pesticides;
    }
  }

  return [];
}

export function calculateTotalCost(pesticides: PesticideRecommendation[], applicationCount: number = 1): {
  totalCost: number;
  currency: string;
  perApplication: number;
} {
  const totalCost = pesticides.reduce((sum, p) => sum + p.costPerUnit, 0);

  return {
    totalCost: totalCost * applicationCount,
    currency: pesticides[0]?.currency || 'USD',
    perApplication: totalCost,
  };
}

export function getCostAnalysis(disease: string, applicationCount: number = 1) {
  const pesticides = getPesticideRecommendations(disease);
  const costs = calculateTotalCost(pesticides, applicationCount);

  return {
    disease,
    pesticideCount: pesticides.length,
    costPerApplication: costs.perApplication,
    totalCostForCycle: costs.totalCost,
    currency: costs.currency,
    pesticides: pesticides.map(p => ({
      name: p.name,
      cost: p.costPerUnit,
      frequency: p.applicationFrequency,
    })),
  };
}
