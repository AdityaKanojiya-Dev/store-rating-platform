import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Store, Star, Search, MapPin, Shield, User } from 'lucide-react';
import RatingStars from '../components/RatingStars';
import toast from 'react-hot-toast';

const Stores = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchStores();
  }, [searchTerm, sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await api.get(`/stores?${params.toString()}`);
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (storeId, rating) => {
    // Check if user is allowed to submit ratings
    if (user?.role !== 'user') {
      toast.error('Only regular users can submit ratings');
      return;
    }

    try {
      await api.post(`/ratings/${storeId}`, { rating });
      toast.success('Rating submitted successfully!');
      fetchStores(); // Refresh stores to show updated rating
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  const getMyRating = async (storeId) => {
    // Only fetch ratings for regular users
    if (user?.role !== 'user') {
      return null;
    }

    try {
      const response = await api.get(`/ratings/${storeId}/my-rating`);
      return response.data.rating?.rating || null;
    } catch (error) {
      console.error('Error fetching my rating:', error);
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">All Stores</h1>
        <p className="text-gray-600">
          Discover and rate stores in your area. Find the best places based on community ratings.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stores by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">Name</option>
              <option value="average_rating">Rating</option>
              <option value="created_at">Date Added</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No stores are available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <StoreListItem
              key={store.id}
              store={store}
              onRatingSubmit={handleRatingSubmit}
              getMyRating={getMyRating}
              user={user}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StoreListItem = ({ store, onRatingSubmit, getMyRating, user }) => {
  const [myRating, setMyRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRating = async () => {
      const rating = await getMyRating(store.id);
      setMyRating(rating);
      setLoading(false);
    };
    fetchMyRating();
  }, [store.id, getMyRating]);

  const handleRatingClick = (rating) => {
    onRatingSubmit(store.id, rating);
    setMyRating(rating);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 mb-4 lg:mb-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{store.name}</h3>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{store.address}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900">
                {store.average_rating}
              </span>
              <span className="text-sm text-gray-500">
                ({store.total_ratings} ratings)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 lg:items-end">
          {user?.role === 'user' ? (
            <>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-5 w-20 rounded mt-1"></div>
                  ) : myRating ? (
                    <div className="flex items-center space-x-1 mt-1">
                      <RatingStars rating={myRating} size="w-4 h-4" />
                      <span className="text-sm text-gray-600">({myRating})</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 mt-1 block">Not rated</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className="text-sm text-gray-600">Rate this store:</span>
                <RatingStars
                  rating={myRating || 0}
                  onRatingChange={handleRatingClick}
                  interactive={true}
                  size="w-6 h-6"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2 text-gray-500">
                {user?.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {user?.role === 'admin' ? 'Administrator' : 'Store Owner'} - Cannot rate stores
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stores;

