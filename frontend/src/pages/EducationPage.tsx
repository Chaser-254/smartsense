import { useState } from 'react';
import { BookOpen, Search, Leaf, Droplets, Sun, Bug } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
}

const articles: Article[] = [
  {
    id: '1',
    category: 'Disease Prevention',
    title: 'Early Blight Prevention in Tomatoes',
    summary: 'Learn how to prevent and manage early blight disease in your tomato crops.',
    content: `Early blight is caused by the fungus Alternaria solani and affects tomato plants worldwide. Here are key prevention strategies:

1. Crop Rotation: Rotate tomatoes with non-solanaceous crops for at least 2-3 years to reduce pathogen buildup in soil.

2. Proper Spacing: Plant tomatoes with adequate spacing (18-24 inches) to ensure good air circulation and reduce humidity.

3. Mulching: Apply organic mulch around plants to prevent soil splash, which spreads spores to lower leaves.

4. Watering Practices: Water at the base of plants early in the day. Avoid overhead irrigation that keeps foliage wet.

5. Sanitation: Remove and destroy infected plant debris. Clean tools between uses.

6. Resistant Varieties: Choose tomato varieties with resistance to early blight when available.

7. Fungicide Application: Apply preventive fungicides before disease appears, especially during humid conditions.`,
    imageUrl: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '2',
    category: 'Best Practices',
    title: 'Soil Health Management',
    summary: 'Essential practices for maintaining healthy soil and improving crop yield.',
    content: `Healthy soil is the foundation of productive agriculture. Follow these practices:

1. Organic Matter: Add compost, manure, or cover crops to increase soil organic matter, which improves structure and water retention.

2. pH Management: Test soil pH regularly. Most crops prefer 6.0-7.0. Adjust with lime or sulfur as needed.

3. Minimize Tillage: Reduce soil disturbance to preserve structure, beneficial organisms, and organic matter.

4. Cover Crops: Plant cover crops during off-season to prevent erosion, add nutrients, and suppress weeds.

5. Crop Rotation: Rotate different crop families to break pest cycles and balance nutrient demands.

6. Proper Fertilization: Use soil tests to determine nutrient needs. Apply balanced fertilizers based on test results.

7. Drainage: Ensure proper drainage to prevent waterlogging, which damages roots and reduces oxygen.`,
    imageUrl: 'https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '3',
    category: 'Water Management',
    title: 'Efficient Irrigation Techniques',
    summary: 'Optimize water use and improve crop health with smart irrigation methods.',
    content: `Water is a precious resource. Use these techniques for efficient irrigation:

1. Drip Irrigation: Delivers water directly to plant roots, reducing evaporation and weed growth by 30-50%.

2. Timing: Irrigate early morning or late evening to minimize water loss through evaporation.

3. Soil Moisture Monitoring: Use moisture sensors or simple tests to water only when needed.

4. Mulching: Apply mulch to retain soil moisture and reduce watering frequency.

5. Rainwater Harvesting: Collect and store rainwater for irrigation during dry periods.

6. Crop-Specific Needs: Different crops have different water requirements. Group plants with similar needs.

7. System Maintenance: Regularly check for leaks, clogs, and ensure even water distribution.`,
    imageUrl: 'https://images.pexels.com/photos/3076899/pexels-photo-3076899.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '4',
    category: 'Pest Control',
    title: 'Integrated Pest Management',
    summary: 'Sustainable approaches to managing pests without excessive chemical use.',
    content: `Integrated Pest Management (IPM) combines multiple strategies for effective pest control:

1. Monitoring: Regularly inspect crops to identify pests early before populations explode.

2. Cultural Controls: Use crop rotation, resistant varieties, and proper spacing to reduce pest pressure.

3. Physical Barriers: Install row covers, screens, or traps to exclude pests from crops.

4. Biological Control: Encourage beneficial insects like ladybugs and lacewings that prey on pests.

5. Organic Pesticides: When needed, use neem oil, insecticidal soaps, or other organic options first.

6. Threshold-Based Treatment: Only apply pesticides when pest populations exceed economic damage thresholds.

7. Record Keeping: Document pest problems, treatments, and results to improve future management.`,
    imageUrl: 'https://images.pexels.com/photos/2165688/pexels-photo-2165688.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '5',
    category: 'Best Practices',
    title: 'Crop Rotation Benefits',
    summary: 'Why rotating crops is essential for long-term farm sustainability.',
    content: `Crop rotation is one of the oldest and most effective farming practices:

1. Disease Management: Different crops host different diseases. Rotation breaks disease cycles.

2. Pest Disruption: Pests that overwinter in soil lose their food source when crops are rotated.

3. Soil Fertility: Legumes fix nitrogen, while deep-rooted crops bring up nutrients from subsoil.

4. Weed Control: Different crops compete with weeds differently, reducing weed pressure over time.

5. Soil Structure: Varied root systems improve soil structure and prevent compaction.

6. Risk Diversification: Growing multiple crops reduces financial risk from crop failure.

7. Planning Tips: Create a 3-4 year rotation plan. Follow heavy feeders with nitrogen-fixing legumes.`,
    imageUrl: 'https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '6',
    category: 'Disease Prevention',
    title: 'Powdery Mildew Control',
    summary: 'Identify and prevent powdery mildew in various crops.',
    content: `Powdery mildew is a common fungal disease affecting many crops:

1. Identification: White or gray powdery spots on leaves, stems, and sometimes fruits.

2. Environmental Factors: Thrives in moderate temperatures (60-80°F) with high humidity but not wet conditions.

3. Air Circulation: Prune plants and provide adequate spacing to improve airflow.

4. Resistant Varieties: Choose varieties bred for resistance to powdery mildew.

5. Organic Treatments: Spray with baking soda solution (1 tbsp per gallon) or neem oil weekly.

6. Sulfur Applications: Dust or spray with sulfur fungicides at first sign of infection.

7. Remove Infected Parts: Prune and dispose of heavily infected leaves to prevent spread.`,
    imageUrl: 'https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

const categories = ['All', 'Best Practices', 'Disease Prevention', 'Water Management', 'Pest Control'];

const categoryIcons = {
  'Best Practices': Leaf,
  'Disease Prevention': Bug,
  'Water Management': Droplets,
  'Pest Control': Bug,
};

export function EducationPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (selectedArticle) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedArticle(null)}
          className="text-green-600 hover:text-green-700 font-medium mb-4 transition"
        >
          ← Back to Articles
        </button>

        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <img
            src={selectedArticle.imageUrl}
            alt={selectedArticle.title}
            className="w-full h-64 object-cover"
          />

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                {categoryIcons[selectedArticle.category as keyof typeof categoryIcons] &&
                  (() => {
                    const Icon = categoryIcons[selectedArticle.category as keyof typeof categoryIcons];
                    return <Icon className="w-3 h-3" />;
                  })()
                }
                {selectedArticle.category}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-800">
              {selectedArticle.title}
            </h1>

            <div className="prose prose-green max-w-none">
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Learning Center</h2>
        <p className="text-gray-600">Best practices and prevention strategies</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === category
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => {
          const Icon = categoryIcons[article.category as keyof typeof categoryIcons] || BookOpen;
          return (
            <div
              key={article.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-48 object-cover"
              />

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                    <Icon className="w-3 h-3" />
                    {article.category}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800 text-lg">
                  {article.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {article.summary}
                </p>

                <button className="text-green-600 hover:text-green-700 font-medium text-sm transition">
                  Read More →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No articles found matching your search</p>
        </div>
      )}
    </div>
  );
}
