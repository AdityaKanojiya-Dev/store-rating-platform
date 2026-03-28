import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Star, Users, TrendingUp, Search, Filter } from 'lucide-react';
import RatingStars from '../components/RatingStars';
import toast from 'react-hot-toast';

const StoreOwnerDashboard = () => {
  const { user } = useAuth();
  const [myStores, setMyStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeRatings, setStoreRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchMyStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchStoreRatings(selectedStore.id);
    }
  }, [selectedStore, searchTerm, sortBy, sortOrder]);

  const fetchMyStores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stores/my-stores');
      const ownedStores = response.data.stores;
      setMyStores(ownedStores);
      if (ownedStores.length > 0 && !selectedStore) {
        setSelectedStore(ownedStores[0]);
      }
    } catch (error) {
      console.error('Error fetching my stores:', error);
      toast.error('Failed to fetch your stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreRatings = async (storeId) => {
    try {
      setRatingsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await api.get(`/ratings/store/${storeId}?${params.toString()}`);
      setStoreRatings(response.data.ratings);
    } catch (error) {
      console.error('Error fetching store ratings:', error);
      toast.error('Failed to fetch store ratings');
    } finally {
      setRatingsLoading(false);
    }
  };

  const getOverallStats = () => {
    if (!selectedStore) return { averageRating: 0, totalRatings: 0 };
    return {
      averageRating: selectedStore.average_rating,
      totalRatings: selectedStore.total_ratings
    };
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    storeRatings.forEach(rating => {
      distribution[rating.rating]++;
    });
    return distribution;
  };

  const stats = getOverallStats();
  const ratingDistribution = getRatingDistribution();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (myStores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Owner Dashboard</h1>
          <p className="text-gray-600">You don't have any stores assigned to you yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Owner Dashboard</h1>
        <p className="text-gray-600">Manage your stores and view customer ratings.</p>
      </div>

      {/* Store Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Store</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myStores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className={`p-4 rounded-lg border-2 text-left transition-colors duration-200 ${
                selectedStore?.id === store.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{store.address}</p>
              <div className="flex items-center space-x-1 mt-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">{store.average_rating}</span>
                <span className="text-sm text-gray-500">({store.total_ratings} ratings)</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedStore && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Ratings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRatings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Store Performance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating >= 4 ? 'Excellent' : 
                     stats.averageRating >= 3 ? 'Good' : 
                     stats.averageRating >= 2 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating];
                const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium text-gray-700">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Ratings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Ratings</h2>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search ratings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="created_at">Date</option>
                  <option value="rating">Rating</option>
                  <option value="user_name">User Name</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {ratingsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : storeRatings.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No ratings match your search criteria.' : 'Your store hasn\'t received any ratings yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {storeRatings.map((rating) => (
                  <div key={rating.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{rating.user_name}</h4>
                          <span className="text-sm text-gray-500">({rating.user_email})</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RatingStars rating={rating.rating} size="w-4 h-4" />
                          <span className="text-sm font-medium text-gray-700">{rating.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Rated on {new Date(rating.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StoreOwnerDashboard;

