import React from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="w-full bg-white border-b sticky top-0 z-10 shadow-sm">
      <ScrollArea className="w-full">
        <div className="flex gap-2 p-4 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CategoryFilter;