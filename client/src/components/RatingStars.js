import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating, onRatingChange, interactive = false, size = 'w-5 h-5' }) => {
  const handleStarClick = (starRating) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            interactive 
              ? 'cursor-pointer hover:text-yellow-500 transition-colors duration-200' 
              : ''
          } ${
            star <= rating 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300'
          }`}
          onClick={() => handleStarClick(star)}
        />
      ))}
    </div>
  );
};

export default RatingStars;

