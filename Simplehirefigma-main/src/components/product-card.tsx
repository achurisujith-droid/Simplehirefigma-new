import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Check } from "lucide-react";

interface ProductCardProps {
  title: string;
  subtitle?: string;
  description: string;
  features: string[];
  price: string;
  priceSubtext: string;
  originalPrice?: string;
  buttonText: string;
  highlighted?: boolean;
  badge?: string;
  onPurchase?: () => void;
}

export function ProductCard({
  title,
  subtitle,
  description,
  features,
  price,
  priceSubtext,
  originalPrice,
  buttonText,
  highlighted = false,
  badge,
  onPurchase
}: ProductCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border ${
        highlighted
          ? "border-blue-300 shadow-lg shadow-blue-100 ring-2 ring-blue-100"
          : "border-slate-200 shadow-sm"
      } p-6 flex flex-col h-full transition-all hover:shadow-md`}
    >
      {/* Badge */}
      {badge && (
        <div className="mb-3">
          <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1">
            {badge}
          </Badge>
        </div>
      )}

      {/* Title */}
      <div className="mb-3">
        <h3 className="text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">{description}</p>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          {originalPrice && (
            <span className="text-slate-400 line-through text-lg">{originalPrice}</span>
          )}
          <span className="text-3xl text-slate-900">{price}</span>
        </div>
        <p className="text-sm text-slate-500">{priceSubtext}</p>
      </div>

      {/* Button */}
      <Button
        onClick={onPurchase}
        disabled={!onPurchase}
        className={`w-full ${
          highlighted
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {buttonText}
      </Button>
    </div>
  );
}