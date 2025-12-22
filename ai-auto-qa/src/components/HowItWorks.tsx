import { Card } from "@/components/ui/card";
import { Globe, Brain, Zap, FileCheck } from "lucide-react";

const steps = [
  {
    icon: Globe,
    number: "01",
    title: "Enter URL & Credentials",
    description: "Simply provide your website URL and optional login details. No setup or configuration needed."
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Agent Explores",
    description: "Our intelligent crawler discovers all pages, forms, workflows, and API endpoints automatically."
  },
  {
    icon: Zap,
    number: "03",
    title: "Tests Execute",
    description: "Comprehensive tests run across functional, API, UI, security, and performance dimensions."
  },
  {
    icon: FileCheck,
    number: "04",
    title: "Get Insights",
    description: "Receive detailed reports with AI-powered recommendations and risk predictions."
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-20" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to complete website testing automation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 relative group"
            >
              <div className="absolute top-6 right-6 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                {step.number}
              </div>
              <step.icon className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform relative z-10" />
              <h3 className="text-xl font-semibold mb-3 relative z-10">{step.title}</h3>
              <p className="text-muted-foreground relative z-10">{step.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">No coding required • No framework knowledge needed</span>
          </div>
        </div>
      </div>
    </section>
  );
};
