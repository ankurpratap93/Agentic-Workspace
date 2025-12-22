import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  const scrollToTester = () => {
    document.getElementById('testing-portal')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark">
        <img 
          src={heroImage} 
          alt="AI Testing Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-glow" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            AI-Powered Testing Revolution
          </span>
          <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-primary animate-fade-in-up">
          Test Any Website
          <br />
          <span className="text-foreground">Without Writing Code</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in-up">
          Just enter a URL. Our AI agent crawls, discovers, and tests your entire website automatically.
          <span className="block mt-2 text-primary font-semibold">
            Functional · API · Performance · Security
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
          <Button 
            variant="hero" 
            size="lg"
            onClick={scrollToTester}
            className="group"
          >
            Start Testing Now
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/history'}
          >
            View Test History
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/recordings'}
          >
            Test Recordings
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Automated</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-secondary mb-2">0</div>
            <div className="text-sm text-muted-foreground">Code Required</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-success mb-2">∞</div>
            <div className="text-sm text-muted-foreground">Test Cases</div>
          </div>
        </div>
      </div>
    </section>
  );
};
