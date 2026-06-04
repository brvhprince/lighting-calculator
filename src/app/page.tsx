import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrackedLink } from '@/components/TrackedLink';
import {
  Calculator,
  Lightbulb,
  Pentagon,
  Building2,
  Ruler,
  Layers,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react';

const PENCASA_URL = process.env.NEXT_PUBLIC_PENCASA_URL;

const ecosystem = [
  {
    id: 'pen-homes',
    name: 'Pen Homes',
    role: 'The Architect',
    body: 'Design-build studio fusing premium architecture with native smart-home logic — your home built with its operating system already inside.',
    href: 'https://pen.homes',
    cta: 'Visit Pen Homes',
    available: true,
  },
  {
    id: 'pencasa',
    name: 'Pencasa',
    role: 'The Shop',
    body: 'The curated boutique for the smart products used in Pen Homes projects — chosen to the same standard.',
    href: PENCASA_URL,
    cta: PENCASA_URL ? 'Shop Pencasa' : 'Coming soon',
    available: !!PENCASA_URL,
  },
  {
    id: 'penlabs',
    name: 'Penlabs',
    role: 'The Lab',
    body: 'The lighting hardware we manufacture when nothing off-the-shelf meets the standard — the fixtures this very tool specs.',
    href: 'https://penlabs.io',
    cta: 'Explore Penlabs',
    available: true,
  },
];

const tools = [
  {
    href: '/calculator',
    icon: Calculator,
    title: 'Complete Calculator',
    description: 'Fixtures, spacing, layered zones, cost & energy — the full plan.',
    points: ['Fixture count & spacing', 'Ceiling & daylight aware', 'Cost, energy & ROI'],
    primary: true,
  },
  {
    href: '/designer',
    icon: Pentagon,
    title: 'Room Designer',
    description: 'Draw any shape to scale — L, T, or freeform — and see the light.',
    points: ['Irregular floor plans', 'Auto fixture placement', 'Live coverage heatmap'],
  },
  {
    href: '/project',
    icon: Building2,
    title: 'Projects',
    description: 'Plan a whole home. Roll up fixtures, lumens and cost.',
    points: ['Multi-room rollup', 'Client-ready report', 'Export / import'],
  },
  {
    href: '/lumens-calculator',
    icon: Lightbulb,
    title: 'Lumens Only',
    description: 'A fast, room-aware estimate of the total lumens you need.',
    points: ['Instant estimate', 'Imperial & metric', 'Room presets'],
  },
];

const features = [
  {
    icon: Ruler,
    title: 'Engineered accuracy',
    body: 'Industry-standard formulas, adjusted for ceiling height and natural daylight.',
  },
  {
    icon: Layers,
    title: 'Layered by design',
    body: 'Ambient, task and accent layers planned the way a designer actually lights a room.',
  },
  {
    icon: DollarSign,
    title: 'Cost & energy clarity',
    body: 'Up-front cost, annual running cost, CO₂ and the payback of going LED.',
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="text-center space-y-5 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">
          Penlabs · From Code to Concrete
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-medium text-foreground max-w-3xl mx-auto">
          Design light with the precision of a system.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Most homes treat lighting as an afterthought. We engineer it from the first sketch — exact lumens,
          fixture counts, spacing, cost and energy, to the Pen Homes standard.
        </p>
        <div className="flex gap-3 justify-center flex-wrap pt-2">
          <Link href="/calculator">
            <Button size="lg">
              Start Calculating <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/designer">
            <Button size="lg" variant="outline">
              Open Room Designer
            </Button>
          </Link>
        </div>
      </div>

      {/* Tools */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {tools.map((tool) => (
          <Card
            key={tool.href}
            className={`flex flex-col transition-shadow hover:shadow-lg ${
              tool.primary ? 'border-brand-bronze/40' : ''
            }`}
          >
            <CardHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <tool.icon className="h-5 w-5 text-brand-bronze" />
              </div>
              <CardTitle className="font-display text-xl">{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-4">
              <ul className="space-y-2 mb-2">
                {tool.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-brand-sage" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link href={tool.href}>
                <Button className="w-full" variant={tool.primary ? 'default' : 'outline'}>
                  Open <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brand narrative */}
      <div className="mx-auto max-w-5xl rounded-2xl bg-brand-basalt px-8 py-14 text-brand-bone md:px-14">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">From Code to Concrete</p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl md:text-4xl">The Architecture of Intelligence</h2>
        <p className="mt-4 max-w-2xl text-brand-bone/80">
          Most homes are built as static structures, with technology bolted on later. At Pen Homes we
          build living systems — fusing high-end architectural design with native smart-home logic from the
          first sketch. This calculator is a glimpse of that rigour, shared freely.
        </p>
        <div className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
          <p className="text-brand-bone/70">
            <span className="block font-display text-lg text-brand-bone">Architects</span> think in spaces.
          </p>
          <p className="text-brand-bone/70">
            <span className="block font-display text-lg text-brand-bone">Engineers</span> think in systems.
          </p>
          <p className="text-brand-bone/70">
            <span className="block font-display text-lg text-brand-bone">Pen Homes</span> thinks in integrated living.
          </p>
        </div>
        <div className="mt-10">
          <TrackedLink
            href="https://pen.homes"
            event="brand_cta_click"
            data={{ brand: 'pen-homes', from: 'narrative' }}
          >
            <Button size="lg" className="gap-2 bg-brand-bronze text-brand-bone hover:bg-brand-bronze/90">
              Work with Pen Homes <ArrowUpRight className="h-4 w-4" />
            </Button>
          </TrackedLink>
        </div>
      </div>

      {/* Ecosystem */}
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-bronze">One ecosystem</p>
          <h2 className="mt-2 font-display text-3xl">Designed, curated, and built in-house</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {ecosystem.map((b) => (
            <Card key={b.name} className="flex flex-col">
              <CardHeader>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-bronze">{b.role}</p>
                <CardTitle className="font-display text-2xl">{b.name}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm text-muted-foreground">{b.body}</p>
                {b.available && b.href ? (
                  <TrackedLink
                    href={b.href}
                    event="brand_cta_click"
                    data={{ brand: b.id, from: 'ecosystem' }}
                    className="inline-flex"
                  >
                    <Button variant="outline" className="gap-2">
                      {b.cta} <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </TrackedLink>
                ) : (
                  <span className="inline-block rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">
                    {b.cta}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why */}
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-3xl text-center mb-10">Intentional, invisible technology</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="h-7 w-7 text-brand-bronze mb-2" />
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Supported rooms */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="font-display text-xl">Tuned for every space</CardTitle>
          <CardDescription>Pre-configured lighting levels for all common rooms — plus custom.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {['Kitchen', 'Living Room', 'Bedroom', 'Bathroom', 'Dining Room', 'Home Office', 'Garage', 'And more…'].map(
              (room) => (
                <div key={room} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-bronze" />
                  <span>{room}</span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4 py-10">
        <h2 className="font-display text-3xl">Ready to light your space?</h2>
        <p className="text-muted-foreground">Choose a tool and get a complete plan in seconds.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/calculator">
            <Button size="lg">Complete Calculator <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
          <Link href="/project">
            <Button size="lg" variant="outline">Plan a Project</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
