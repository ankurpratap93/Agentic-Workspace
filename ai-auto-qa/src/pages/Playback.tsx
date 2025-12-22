import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
async function fetchRecordingApi(recordingId: string) {
  const r = await fetch(`/api/test_recordings`);
  if (!r.ok) throw new Error('Failed to load recordings');
  const recs = await r.json();
  return recs.find((x: any) => x.id === recordingId) || null;
}
async function fetchStepsApi(recordingId: string) {
  const r = await fetch(`/api/test_recording_steps?recording_id=${encodeURIComponent(recordingId)}`);
  if (!r.ok) return [];
  return r.json();
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";

interface RecordingStep {
  id: string;
  step_number: number;
  action_type: string;
  action_description: string;
  screenshot_url: string | null;
  element_selector: string | null;
  input_data: any;
  expected_result: string | null;
  actual_result: string | null;
  status: string;
  timestamp: string;
  execution_time: number | null;
}

interface Recording {
  id: string;
  name: string;
  description: string | null;
  total_steps: number;
  duration: number;
  status: string;
  narration_enabled: boolean;
  video_url: string | null;
}

export const Playback = () => {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [steps, setSteps] = useState<RecordingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (recordingId) {
      fetchRecording();
    }
  }, [recordingId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1;
          if (next >= steps.length - 1) {
            setIsPlaying(false);
          }
          return next;
        });
      }, 3000); // 3 seconds per step to allow narration
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, steps.length]);

  // Play narration when step changes
  useEffect(() => {
    if (narrationEnabled && recording?.narration_enabled && steps[currentStep]) {
      playNarration(steps[currentStep]);
    }
  }, [currentStep, narrationEnabled, recording?.narration_enabled]);

  const playNarration = async (step: RecordingStep) => {
    if (isGeneratingAudio) return;

    try {
      setIsGeneratingAudio(true);

      const narrationText = `Step ${step.step_number}: ${step.action_description}. ${
        step.status === 'passed' 
          ? 'Test passed successfully.' 
          : `Test failed with error: ${step.actual_result}`
      }`;

      // Local mode: narration is disabled unless custom TTS endpoint is added
      console.debug('Narration requested (disabled in local mode):', narrationText);
    } catch (error) {
      console.error('Error playing narration:', error);
      toast({
        title: "Narration Error",
        description: "Audio narration is disabled in local mode.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const toggleNarration = () => {
    setNarrationEnabled(!narrationEnabled);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const fetchRecording = async () => {
    setLoading(true);
    
    try {
      const rec = await fetchRecordingApi(recordingId as string);
      const stepsData = await fetchStepsApi(recordingId as string);
      if (rec) setRecording(rec);
      setSteps(stepsData || []);
    } catch (e) {
      console.error('Error fetching recording:', e);
    }
    
    setLoading(false);
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const currentStepData = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <Card className="p-8">
              <div className="aspect-video bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!recording || steps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-dark py-12">
        <div className="container mx-auto px-4 text-center">
          <Card className="p-12">
            <h2 className="text-2xl font-bold mb-4">Recording Not Found</h2>
            <p className="text-muted-foreground mb-6">This recording doesn't exist or has no steps.</p>
            <Button onClick={() => navigate('/recordings')}>Back to Recordings</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      <audio ref={audioRef} className="hidden" />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/recordings')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recordings
          </Button>
          
          {recording.narration_enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNarration}
            >
              {narrationEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Narration On
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Narration Off
                </>
              )}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{recording.name}</h1>
          {recording.description && (
            <p className="text-muted-foreground">{recording.description}</p>
          )}
          {recording.narration_enabled && (
            <Badge variant="secondary" className="mt-2">
              <Volume2 className="w-3 h-3 mr-1" />
              Audio Narration Enabled
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                {currentStepData?.screenshot_url ? (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={currentStepData.screenshot_url}
                      alt={`Step ${currentStep + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">No screenshot available</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                      <Badge variant={currentStepData?.status === 'passed' ? 'default' : 'destructive'}>
                        {currentStepData?.status === 'passed' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {currentStepData?.status}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentStep(0)}
                      disabled={currentStep === 0}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPrevStep}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="lg"
                      onClick={togglePlayback}
                      disabled={currentStep === steps.length - 1 && !isPlaying}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextStep}
                      disabled={currentStep === steps.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentStep(steps.length - 1)}
                      disabled={currentStep === steps.length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Action Type</div>
                  <Badge variant="outline" className="capitalize">
                    {currentStepData?.action_type}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Description</div>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData?.action_description}
                  </p>
                </div>

                {currentStepData?.element_selector && (
                  <div>
                    <div className="text-sm font-medium mb-1">Element</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {currentStepData.element_selector}
                    </code>
                  </div>
                )}

                {currentStepData?.expected_result && (
                  <div>
                    <div className="text-sm font-medium mb-1">Expected Result</div>
                    <p className="text-sm text-muted-foreground">
                      {currentStepData.expected_result}
                    </p>
                  </div>
                )}

                {currentStepData?.actual_result && (
                  <div>
                    <div className="text-sm font-medium mb-1">Actual Result</div>
                    <p className="text-sm text-muted-foreground">
                      {currentStepData.actual_result}
                    </p>
                  </div>
                )}

                {currentStepData?.execution_time && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {currentStepData.execution_time}ms
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        index === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Step {step.step_number}
                        </span>
                        {step.status === 'passed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs mt-1 opacity-80 truncate">
                        {step.action_description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playback;
