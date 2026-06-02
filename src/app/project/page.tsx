import type { Metadata } from 'next';
import ProjectManager from '@/components/ProjectManager';

export const metadata: Metadata = {
  title: 'Projects — Penlabs Lighting Calculator',
  description:
    'Plan lighting for an entire home or building. Group rooms into a project, roll up fixtures and cost, and export a professional report.',
};

export default function ProjectPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">Phase 2 · Professional</p>
        <h1 className="font-display text-3xl mb-2 mt-1">Projects</h1>
        <p className="text-muted-foreground">
          Plan a whole home or building. Add the rooms you&apos;ve saved, see the totals roll up, and export a
          report for your client or contractor.
        </p>
      </div>
      <ProjectManager />
    </div>
  );
}
