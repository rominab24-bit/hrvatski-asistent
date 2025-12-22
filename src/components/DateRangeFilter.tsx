import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { hr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
}

export function DateRangeFilter({ startDate, endDate, onRangeChange }: DateRangeFilterProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const presets = [
    { 
      label: 'Ovaj tjedan', 
      getRange: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: new Date() }) 
    },
    { 
      label: 'Ovaj mjesec', 
      getRange: () => ({ start: startOfMonth(new Date()), end: new Date() }) 
    },
    { 
      label: 'Prošli mjesec', 
      getRange: () => ({ 
        start: startOfMonth(subMonths(new Date(), 1)), 
        end: endOfMonth(subMonths(new Date(), 1)) 
      }) 
    },
    { 
      label: 'Zadnja 3 mjeseca', 
      getRange: () => ({ start: startOfMonth(subMonths(new Date(), 2)), end: new Date() }) 
    },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    const { start, end } = preset.getRange();
    onRangeChange(start, end);
  };

  const clearFilter = () => {
    onRangeChange(null, null);
  };

  const hasFilter = startDate || endDate;

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={clearFilter}
          >
            <X className="w-3 h-3 mr-1" />
            Očisti
          </Button>
        )}
      </div>

      {/* Custom date range pickers */}
      <div className="flex gap-2">
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 justify-start text-left font-normal text-xs",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {startDate ? format(startDate, "d. MMM yyyy", { locale: hr }) : "Od datuma"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={(date) => {
                onRangeChange(date || null, endDate);
                setIsStartOpen(false);
              }}
              disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
              initialFocus
              locale={hr}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 justify-start text-left font-normal text-xs",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {endDate ? format(endDate, "d. MMM yyyy", { locale: hr }) : "Do datuma"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={(date) => {
                onRangeChange(startDate, date || null);
                setIsEndOpen(false);
              }}
              disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
              initialFocus
              locale={hr}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
