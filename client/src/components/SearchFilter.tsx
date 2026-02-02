import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

export type SortOption = {
  id: string;
  label: string;
};

export type FilterConfig = {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
};

type SearchFilterProps = {
  placeholder?: string;
  filters?: FilterConfig[];
  sortOptions?: SortOption[];
  defaultSort?: string;
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, string[]>) => void;
  onSortChange: (sort: string) => void;
  className?: string;
  resultCount?: number;
};

export function SearchFilter({
  placeholder = "Search...",
  filters = [],
  sortOptions = [],
  defaultSort = "",
  onSearch,
  onFilterChange,
  onSortChange,
  className,
  resultCount,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [currentSort, setCurrentSort] = useState(defaultSort);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleFilterToggle = (filterId: string, optionId: string, multiple: boolean) => {
    setActiveFilters(prev => {
      const current = prev[filterId] || [];
      let updated: string[];
      
      if (multiple) {
        if (current.includes(optionId)) {
          updated = current.filter(id => id !== optionId);
        } else {
          updated = [...current, optionId];
        }
      } else {
        updated = current.includes(optionId) ? [] : [optionId];
      }
      
      const newFilters = { ...prev, [filterId]: updated };
      
      // Remove empty filter arrays
      if (updated.length === 0) {
        delete newFilters[filterId];
      }
      
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
    onSortChange(sort);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);
  }, [activeFilters]);

  const getActiveFilterLabels = useMemo(() => {
    const labels: { filterId: string; optionId: string; label: string }[] = [];
    
    for (const [filterId, optionIds] of Object.entries(activeFilters)) {
      const filter = filters.find(f => f.id === filterId);
      if (!filter) continue;
      
      for (const optionId of optionIds) {
        const option = filter.options.find(o => o.id === optionId);
        if (option) {
          labels.push({ filterId, optionId, label: option.label });
        }
      }
    }
    
    return labels;
  }, [activeFilters, filters]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter Button */}
        {filters.length > 0 && (
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={clearAllFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <Label className="text-sm font-medium">{filter.label}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {filter.options.map((option) => {
                        const isActive = activeFilters[filter.id]?.includes(option.id);
                        return (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${filter.id}-${option.id}`}
                              checked={isActive}
                              onCheckedChange={() => 
                                handleFilterToggle(filter.id, option.id, filter.multiple ?? true)
                              }
                            />
                            <label
                              htmlFor={`${filter.id}-${option.id}`}
                              className="text-sm cursor-pointer flex items-center gap-1"
                            >
                              {option.label}
                              {option.count !== undefined && (
                                <span className="text-muted-foreground text-xs">
                                  ({option.count})
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Active Filter Tags */}
      {getActiveFilterLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getActiveFilterLabels.map(({ filterId, optionId, label }) => (
            <Badge
              key={`${filterId}-${optionId}`}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  const filter = filters.find(f => f.id === filterId);
                  handleFilterToggle(filterId, optionId, filter?.multiple ?? true);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Result Count */}
      {resultCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultCount} {resultCount === 1 ? "result" : "results"} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}
    </div>
  );
}
