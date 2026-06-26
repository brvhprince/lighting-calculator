import type { Metadata } from 'next';
import RoomDesigner from '@/components/RoomDesigner';

export const metadata: Metadata = {
  title: 'Room Designer, Penlabs Lighting Calculator',
  description:
    'Draw rectangular, L-shaped, T-shaped or freeform rooms to scale and auto-place fixtures with a live light-coverage heatmap.',
};

export default function DesignerPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-2 mt-1">Room Designer</h1>
        <p className="text-muted-foreground">
          Sketch any floor plan to scale, including irregular, L-shaped and T-shaped rooms, and watch the
          fixture layout and light coverage update in real time.
        </p>
      </div>
      <RoomDesigner />
    </div>
  );
}
