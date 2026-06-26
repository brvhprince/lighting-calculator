import { ImageResponse } from 'next/og';

export const alt = 'Penlabs Lighting Calculator | by Pen Homes';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Branded social-share card (Deep Basalt + Bronze).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#2C332E',
          color: '#F5F2ED',
          padding: 80,
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              backgroundColor: '#A68966',
              color: '#F5F2ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            P
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 30 }}>Penlabs Lighting</div>
            <div style={{ fontSize: 16, letterSpacing: 6, color: '#8A9682', textTransform: 'uppercase' }}>
              by Pen Homes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, maxWidth: 900 }}>
            Design light with the precision of a system.
          </div>
          <div style={{ fontSize: 26, color: '#C9C2B6', fontFamily: 'sans-serif', maxWidth: 880 }}>
            Lumens, fixtures, spacing, layered zones, cost &amp; energy to to the Pen Homes standard.
          </div>
        </div>

        <div style={{ fontSize: 18, letterSpacing: 4, color: '#A68966', textTransform: 'uppercase' }}>
          The Architecture of Intelligence
        </div>
      </div>
    ),
    { ...size }
  );
}
