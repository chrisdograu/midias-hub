import { Star, StarHalf } from 'lucide-react';

interface HalfStarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export function HalfStarDisplay({ rating, size = 16, className = '' }: HalfStarRatingProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        if (rating >= starValue) {
          return <Star key={i} className="text-price fill-price" style={{ width: size, height: size }} />;
        }
        if (rating >= starValue - 0.5) {
          return (
            <div key={i} className="relative" style={{ width: size, height: size }}>
              <Star className="absolute text-muted-foreground" style={{ width: size, height: size }} />
              <StarHalf className="absolute text-price fill-price" style={{ width: size, height: size }} />
            </div>
          );
        }
        return <Star key={i} className="text-muted-foreground" style={{ width: size, height: size }} />;
      })}
    </div>
  );
}

interface InteractiveHalfStarProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}

export function InteractiveHalfStar({ value, onChange, size = 28 }: InteractiveHalfStarProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const halfValue = starValue - 0.5;
        return (
          <div key={i} className="relative cursor-pointer" style={{ width: size, height: size }}>
            {/* Left half - clicks 0.5 */}
            <div
              className="absolute inset-0 w-1/2 z-10"
              onClick={() => onChange(halfValue)}
              onMouseEnter={(e) => e.currentTarget.parentElement?.setAttribute('data-hover', String(halfValue))}
              onMouseLeave={(e) => e.currentTarget.parentElement?.removeAttribute('data-hover')}
            />
            {/* Right half - clicks 1.0 */}
            <div
              className="absolute inset-0 left-1/2 w-1/2 z-10"
              onClick={() => onChange(starValue)}
              onMouseEnter={(e) => e.currentTarget.parentElement?.setAttribute('data-hover', String(starValue))}
              onMouseLeave={(e) => e.currentTarget.parentElement?.removeAttribute('data-hover')}
            />
            {value >= starValue ? (
              <Star className="text-price fill-price transition-transform hover:scale-110" style={{ width: size, height: size }} />
            ) : value >= halfValue ? (
              <div className="relative" style={{ width: size, height: size }}>
                <Star className="absolute text-muted-foreground" style={{ width: size, height: size }} />
                <StarHalf className="absolute text-price fill-price" style={{ width: size, height: size }} />
              </div>
            ) : (
              <Star className="text-muted-foreground transition-transform hover:scale-110" style={{ width: size, height: size }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
