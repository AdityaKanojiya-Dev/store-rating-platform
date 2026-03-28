import React from 'react';
import { X, User, Mail, MapPin, Shield, Star, Calendar } from 'lucide-react';
import RatingStars from './RatingStars';

const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5 text-red-500" />;
      case 'store_owner': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'user': return <User className="w-5 h-5 text-green-500" />;
      default: return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'System Administrator';
      case 'store_owner': return 'Store Owner';
      case 'user': return 'Normal User';
      default: return role;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin': return 'Full system access and management capabilities';
      case 'store_owner': return 'Can manage their stores and view ratings';
      case 'user': return 'Can browse stores and submit ratings';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {getRoleIcon(user.role)}
            <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center space-x-2 text-gray-600">
                {getRoleIcon(user.role)}
                <span>{getRoleDisplayName(user.role)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{getRoleDescription(user.role)}</p>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{user.address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Store Owner Specific Information */}
          {user.role === 'store_owner' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Owner Statistics</h3>
              
              {user.average_rating && user.total_ratings ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Average Rating:</span>
                    <div className="flex items-center space-x-2">
                      <RatingStars rating={parseFloat(user.average_rating)} size="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-900">
                        {parseFloat(user.average_rating).toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Ratings Received:</span>
                    <span className="text-sm font-medium text-gray-900">{user.total_ratings}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No ratings received yet</p>
              )}
            </div>
          )}

          {/* User Statistics */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-lg font-semibold text-gray-900">#{user.id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500">Account Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
