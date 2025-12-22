import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { TestingPortal } from "@/components/TestingPortal";
import { Results } from "@/components/Results";
import { TestProgress } from "@/components/TestProgress";

const Index = () => {
  const [currentTestRunId, setCurrentTestRunId] = useState<string | null>(null);

  const handleTestStarted = (testRunId: string) => {
    setCurrentTestRunId(testRunId);
    // Scroll to results after a brief delay
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <TestingPortal onTestStarted={handleTestStarted} />
      {currentTestRunId && (
        <div className="container mx-auto px-4 py-8">
          <TestProgress testRunId={currentTestRunId} />
          <div className="mt-6">
            <Results testRunId={currentTestRunId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
