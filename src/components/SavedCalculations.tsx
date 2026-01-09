'use client';

import { useState, useEffect } from 'react';
import { SavedCalculation } from '@/types/saved-calculations';
import { getSavedCalculations, deleteCalculation } from '@/lib/savedCalculations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Trash2, Clock, Calculator, Lightbulb } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';

type SavedCalculationsProps = {
  onLoad?: (calculation: SavedCalculation) => void;
};

export function SavedCalculations({ onLoad }: SavedCalculationsProps) {
  const [saved, setSaved] = useState<SavedCalculation[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSaved(getSavedCalculations());
    }
  }, [open]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCalculation(id);
    setSaved(getSavedCalculations());
  };

  const handleLoad = (calculation: SavedCalculation) => {
    if (onLoad) {
      onLoad(calculation);
      setOpen(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Saved Calculations ({saved.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Calculations</DialogTitle>
          <DialogDescription>
            Load a previously saved calculation or delete ones you no longer need.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {saved.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No saved calculations yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete a calculation and click Save to store it
              </p>
            </div>
          ) : (
            saved.map((calc) => (
              <Card
                key={calc.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleLoad(calc)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {calc.type === 'full' ? (
                        <Calculator className="h-4 w-4 text-primary" />
                      ) : (
                        <Lightbulb className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <CardTitle className="text-base">{calc.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(calc.timestamp)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(calc.id, e)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span className="font-medium">Room:</span>{' '}
                      {ROOM_TYPES[calc.input.roomType]?.name || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Dimensions:</span>{' '}
                      {calc.input.length} × {calc.input.width} {calc.input.unitSystem === 'metric' ? 'mm' : 'in'}
                    </div>
                    {calc.type === 'full' && 'numberOfFixtures' in calc.result && (
                      <>
                        <div>
                          <span className="font-medium">Fixtures:</span> {calc.result.numberOfFixtures}
                        </div>
                        <div>
                          <span className="font-medium">Lumens:</span>{' '}
                          {calc.result.totalLumensNeeded.toLocaleString()}
                        </div>
                      </>
                    )}
                    {calc.type === 'lumens' && 'totalLumens' in calc.result && (
                      <div className="col-span-2">
                        <span className="font-medium">Total Lumens:</span>{' '}
                        {calc.result.totalLumens.toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
