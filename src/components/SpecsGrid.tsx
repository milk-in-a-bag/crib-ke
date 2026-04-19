import React from 'react';
import { SquareIcon, BedIcon, BathIcon, HomeIcon } from 'lucide-react';
interface SpecsGridProps {
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
}
export function SpecsGrid({ sqft, bedrooms, bathrooms, type }: SpecsGridProps) {
  const specs = [
  {
    icon: SquareIcon,
    label: 'Area',
    value: `${sqft} sqft`
  },
  {
    icon: BedIcon,
    label: 'Bedrooms',
    value: bedrooms
  },
  {
    icon: BathIcon,
    label: 'Bathrooms',
    value: bathrooms
  },
  {
    icon: HomeIcon,
    label: 'Type',
    value: type
  }];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {specs.map(({ icon: Icon, label, value }) =>
      <div
        key={label}
        className="bg-white rounded-2xl p-6 text-center shadow-sm">
        
          <Icon className="w-8 h-8 mx-auto mb-3 text-accent" />
          <div className="text-2xl font-bold text-primary mb-1">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>
      )}
    </div>);

}