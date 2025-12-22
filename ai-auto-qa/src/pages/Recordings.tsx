import { useState, useEffect } from "react";
async function fetchRecordingsApi() {
  const r = await fetch('/api/test_recordings');
  if (!r.ok) throw new Error('Failed to load recordings');
  return r.json();
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle, XCircle, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/Header";

interface Recording {
  id: string;
  name: string;
  description: string | null;
  total_steps: number;
  duration: number;
  status: string;
  created_at: string;
  test_run_id: string;
}

export const Recordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const data = await fetchRecordingsApi();
      setRecordings((data || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      console.error('Error fetching recordings:', e);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'recording':
        return <Badge variant="secondary"><Camera className="w-3 h-3 mr-1 animate-pulse" />Recording</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Test Recordings</h1>
          <p className="text-muted-foreground">Browse and replay saved test scenarios with screenshots</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <Card className="p-12 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Recordings Yet</h3>
            <p className="text-muted-foreground mb-6">
              Test recordings will appear here after you run tests with recording enabled
            </p>
            <Button onClick={() => navigate('/')}>Start Testing</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map((recording) => (
              <Card key={recording.id} className="hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{recording.name}</CardTitle>
                      {recording.description && (
                        <p className="text-sm text-muted-foreground">{recording.description}</p>
                      )}
                    </div>
                    {getStatusBadge(recording.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{recording.total_steps}</div>
                      <div className="text-xs text-muted-foreground">Steps</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{formatDuration(recording.duration)}</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => navigate(`/playback/${recording.id}`)}
                    disabled={recording.status !== 'completed'}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Playback Recording
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recordings;
