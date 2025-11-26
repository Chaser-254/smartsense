import { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    diseaseDetected: 0,
    healthyScans: 0,
  });

  useEffect(() => {
    loadScans();
  }, [user]);

  const loadScans = async () => {
    if (!user) return;

    try {
      const mockScans = [
        {
          id: '1',
          crop_type: 'Tomato',
          image_url: 'https://images.pexels.com/photos/96715/pexels-photo-96715.jpeg?auto=compress&cs=tinysrgb&w=400',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          detected_disease_id: '1',
          confidence_score: 85
        },
        {
          id: '2', 
          crop_type: 'Corn',
          image_url: 'https://images.pexels.com/photos/96715/pexels-photo-96715.jpeg?auto=compress&cs=tinysrgb&w=400',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          detected_disease_id: null,
          confidence_score: 95
        }
      ];
      
      setScans(mockScans);

      const total = mockScans.length;
      const diseased = mockScans.filter(s => s.detected_disease_id).length;
      const healthy = total - diseased;

      setStats({
        totalScans: total,
        diseaseDetected: diseased,
        healthyScans: healthy,
      });
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h2>
        <p className="text-gray-600">Monitor your crop health status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Scans</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalScans}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Diseases Detected</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.diseaseDetected}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Healthy Crops</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.healthyScans}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Recent Scans
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {scans.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No scans yet. Start scanning your crops!</p>
            </div>
          ) : (
            scans.map((scan) => (
              <div key={scan.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  <img
                    src={scan.image_url || 'https://images.pexels.com/photos/96715/pexels-photo-96715.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt="Crop scan"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{scan.crop_type}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(scan.created_at)}
                        </p>
                      </div>
                      {scan.detected_disease_id ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Disease Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Healthy
                        </span>
                      )}
                    </div>
                    {scan.confidence_score > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${scan.confidence_score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {scan.confidence_score}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
