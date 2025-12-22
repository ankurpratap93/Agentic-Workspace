export function generateInsights({ url, tests }) {
  const failed = tests.filter(t => t.status === 'failed');
  const countFailed = failed.length;
  const severeFailed = failed.filter(t => (t.severity === 'critical' || t.severity === 'high')).length;

  const insights = [
    {
      insight_type: 'recommendation',
      severity: countFailed > 0 ? 'medium' : 'low',
      title: 'Recommended Test Coverage',
      description: `We recommend adding ${Math.max(0, Math.floor(tests.length * 0.2))} more cases for broader coverage.`,
      affected_pages: [url]
    }
  ];
  if (severeFailed > 0) {
    insights.push({
      insight_type: 'security',
      severity: 'high',
      title: 'High-severity issues detected',
      description: `${severeFailed} critical/high tests failed. Prioritize remediation.`,
      affected_pages: [url]
    });
  }
  return insights;
}




