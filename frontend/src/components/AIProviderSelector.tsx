import React from 'react';
import { Brain, Cpu, Zap } from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  cost: string;
  accuracy: string;
}

const aiProviders: AIProvider[] = [
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Specialized plant disease detection model',
    icon: <Brain className="w-5 h-5" />,
    cost: 'Free',
    accuracy: '85%'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'General AI vision with good accuracy',
    icon: <Cpu className="w-5 h-5" />,
    cost: 'Free tier',
    accuracy: '80%'
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    description: 'Highest accuracy with detailed analysis',
    icon: <Zap className="w-5 h-5" />,
    cost: 'Paid',
    accuracy: '95%'
  }
];

interface AIProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

export default function AIProviderSelector({ selectedProvider, onProviderChange }: AIProviderSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        AI Detection Provider
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {aiProviders.map((provider) => (
          <div
            key={provider.id}
            className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
              selectedProvider === provider.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onProviderChange(provider.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {provider.icon}
                <h3 className="font-semibold text-gray-900">{provider.name}</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                provider.cost === 'Free' || provider.cost === 'Free tier'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {provider.cost}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Accuracy: {provider.accuracy}</span>
              {selectedProvider === provider.id && (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Selected</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Recommendation:</strong> Start with Hugging Face (free and specialized), 
          try Gemini for variety, or use OpenAI for highest accuracy.
        </p>
      </div>
    </div>
  );
}
