import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Lightbulb, Ruler, Grid3x3, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Professional Lighting Calculator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Calculate the perfect lighting for any room. Get accurate lumens, fixture counts, and spacing recommendations in seconds.
        </p>
      </div>

      {/* Calculator Options */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Complete Lighting Calculator</CardTitle>
            <CardDescription>
              Full solution for recessed lighting planning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Calculate number of fixtures needed</span>
              </li>
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Get precise spacing measurements</span>
              </li>
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>View fixture layout visualization</span>
              </li>
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Professional and homeowner modes</span>
              </li>
            </ul>
            <Link href="/calculator">
              <Button className="w-full" size="lg">
                Start Full Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Lumens Calculator</CardTitle>
            <CardDescription>
              Quick calculation for total lumens needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Fast lumens-only calculation</span>
              </li>
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Room-specific recommendations</span>
              </li>
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Imperial and metric support</span>
              </li>
              <li className="flex gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Perfect for quick estimates</span>
              </li>
            </ul>
            <Link href="/lumens-calculator">
              <Button className="w-full" size="lg" variant="outline">
                Start Lumens Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Why Use Pen Lighting Calculator?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Ruler className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Accurate Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Industry-standard formulas ensure proper lighting levels for every room type.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Grid3x3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Perfect Spacing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get exact measurements for fixture placement and spacing from walls.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Easy to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Whether you&apos;re a professional or homeowner, get results in seconds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Room Types Section */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Supported Room Types</CardTitle>
          <CardDescription>
            Pre-configured lighting recommendations for all common spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Kitchen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Living Room</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Bedroom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Bathroom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Dining Room</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Home Office</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Garage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>And more...</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="text-center space-y-4 py-12">
        <h2 className="text-3xl font-bold">Ready to Light Your Space?</h2>
        <p className="text-muted-foreground">
          Choose your calculator and get started in seconds
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/calculator">
            <Button size="lg">
              Complete Calculator
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/lumens-calculator">
            <Button size="lg" variant="outline">
              Lumens Only
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
