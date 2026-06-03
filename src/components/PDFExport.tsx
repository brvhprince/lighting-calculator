'use client';

import { useState } from 'react';
import { CalculationResult } from '@/types';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { useCurrency } from '@/context/CurrencyProvider';
import { gatherLightingReportData } from '@/lib/pdf/reportData';

type PDFExportProps = {
  result: CalculationResult;
  roomType: string;
  customRoomName?: string;
};

export function PDFExport({ result, roomType, customRoomName }: PDFExportProps) {
  const { market } = useCurrency();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const roomName = customRoomName || ROOM_TYPES[roomType]?.name || 'Room';

      // react-pdf is heavy — load it (and the document) only on demand.
      const { buildLightingReportBlob } = await import('@/lib/pdf/lightingReport');
      const blob = await buildLightingReportBlob(
        gatherLightingReportData({ result, roomType, roomName, market })
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `penlabs-lighting-${roomName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Sorry — the PDF could not be generated.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2" disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {busy ? 'Building PDF…' : 'Export PDF'}
    </Button>
  );
}
