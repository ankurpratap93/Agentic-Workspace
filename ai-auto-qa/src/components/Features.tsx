import { Card } from "@/components/ui/card";
import { Brain, Zap, Shield, BarChart3, Globe, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Crawler",
    description: "Intelligent agent discovers all pages, workflows, and interactions automatically",
    color: "text-primary"
  },
  {
    icon: Zap,
    title: "Zero Setup",
    description: "No frameworks, no scripts, no configuration. Just URL and credentials",
    color: "text-secondary"
  },
  {
    icon: CheckCircle,
    title: "Complete Testing",
    description: "Functional, API, UI validation, link checks, and data verification",
    color: "text-success"
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description: "Detect vulnerabilities, broken auth, XSS, and exposed endpoints",
    color: "text-warning"
  },
  {
    icon: BarChart3,
    title: "Visual Reports",
    description: "Detailed Allure-style reports with AI-generated recommendations",
    color: "text-primary"
  },
  {
    icon: Globe,
    title: "Multi-Framework",
    description: "Choose Selenium, Playwright, or Cypress for test execution",
    color: "text-secondary"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need for
            <span className="block bg-clip-text text-transparent bg-gradient-primary mt-2">
              Autonomous Testing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete AI-driven QA platform that replaces manual testing workflows
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-primary group"
            >
              <feature.icon className={`w-12 h-12 ${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
