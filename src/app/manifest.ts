import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Penlabs Lighting Calculator',
    short_name: 'Penlabs',
    description:
      'Design the perfect light for any space — lumens, fixtures, spacing, cost and energy, to the Pen Homes standard.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2EFE9',
    theme_color: '#2C332E',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
