import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Sector, LineChart, Line, Area, AreaChart } from 'recharts';
import { AlertTriangle, TrendingUp, FileText, Lightbulb, Brain, Calendar, RefreshCw, Database, RotateCcw } from 'lucide-react';
import { getSubmissions, prepopulateData, hasExistingData, clearAllData } from '@/lib/demo-data';
import { COURSES, PREDEFINED_TOPICS, Course, FrictionCategory, FrictionSubmission } from '@/lib/types';
import { startOfWeek, endOfWeek, format, subWeeks, isWithinInterval } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CHART_COLORS = [
  'hsl(220, 70%, 35%)',
  'hsl(200, 75%, 45%)',
  'hsl(160, 60%, 45%)',
];

const INSIGHTS: Record<FrictionCategory, string> = {
  'Conceptual': 'High conceptual friction suggests a need for prerequisite reinforcement or alternative explanations.',
  'Curriculum Structure': 'Curriculum structure issues may indicate pacing problems or unclear learning pathways.',
  'Delivery & Assessment': 'Delivery concerns often point to assessment alignment gaps or resource accessibility issues.',
};

// Custom animated bar component
const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, index } = props;
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(width);
    }, index * 80);
    return () => clearTimeout(timer);
  }, [width, index]);

  return (
    <rect
      x={x}
      y={y}
      width={animatedWidth}
      height={height}
      fill={fill}
      rx={4}
      ry={4}
      style={{
        transition: 'width 400ms ease-out',
      }}
    />
  );
};

// Custom tooltip for bar chart
const BarChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  
  const getSeverityLabel = (severity: number) => {
    if (severity < 1.5) return { text: 'Minor', color: 'hsl(var(--severity-minor))' };
    if (severity < 2.5) return { text: 'Moderate', color: 'hsl(var(--severity-moderate))' };
    return { text: 'Severe', color: 'hsl(var(--severity-severe))' };
  };
  
  const severity = getSeverityLabel(data.avgSeverity);
  
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">{data.fullTopic}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reports:</span>
          <span className="font-medium">{data.count}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Avg Severity:</span>
          <span className="font-medium flex items-center gap-1.5">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: severity.color }}
            />
            {severity.text} ({data.avgSeverity})
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom tooltip for pie chart
const PieChartTooltip = ({ active, payload, filteredSubmissions }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0];
  const category = data.name as FrictionCategory;
  const total = filteredSubmissions.reduce((sum: number, s: any) => sum + (s.frictionCategory === category ? 1 : 0), 0);
  
  // Calculate avg severity for this category
  const categorySubmissions = filteredSubmissions.filter((s: any) => s.frictionCategory === category);
  const avgSeverity = categorySubmissions.length > 0
    ? (categorySubmissions.reduce((sum: number, s: any) => sum + s.severity, 0) / categorySubmissions.length).toFixed(1)
    : '0';
  
  // Find most common subtype
  const subtypeCounts: Record<string, number> = {};
  categorySubmissions.forEach((s: any) => {
    subtypeCounts[s.frictionType] = (subtypeCounts[s.frictionType] || 0) + 1;
  });
  const commonSubtype = Object.entries(subtypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  const percent = ((data.value / filteredSubmissions.length) * 100).toFixed(0);
  
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium text-sm mb-2">{category}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Share:</span>
          <span className="font-medium">{percent}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Severity:</span>
          <span className="font-medium">{avgSeverity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Common Issue:</span>
          <span className="font-medium text-right max-w-[120px] truncate">{commonSubtype}</span>
        </div>
      </div>
    </div>
  );
};

// Active shape for pie chart hover
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
      />
    </g>
  );
};

export const TeacherDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [chartMounted, setChartMounted] = useState(false);
  const [submissions, setSubmissions] = useState<FrictionSubmission[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrepopulating, setIsPrepopulating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showPrepopulateDialog, setShowPrepopulateDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Initial load
  useEffect(() => {
    setSubmissions(getSubmissions());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setChartMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Refresh data handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setChartMounted(false);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    setSubmissions(getSubmissions());
    
    setTimeout(() => {
      setChartMounted(true);
      setIsRefreshing(false);
    }, 100);
  }, []);

  // Pre-populate handler
  const handlePrepopulate = useCallback(async () => {
    setShowPrepopulateDialog(false);
    setIsPrepopulating(true);
    setChartMounted(false);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newData = prepopulateData();
    setSubmissions(newData);
    
    setTimeout(() => {
      setChartMounted(true);
      setIsPrepopulating(false);
    }, 100);
  }, []);

  // Clear all data handler
  const handleClearAll = useCallback(async () => {
    setShowClearDialog(false);
    setIsClearing(true);
    setChartMounted(false);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    clearAllData();
    setSubmissions([]);
    setSelectedCourse('all');
    setSelectedTopic(null);
    
    setTimeout(() => {
      setChartMounted(true);
      setIsClearing(false);
    }, 100);
  }, []);

  // Check before prepopulating
  const initiatePrepopulate = useCallback(() => {
    if (hasExistingData()) {
      setShowPrepopulateDialog(true);
    } else {
      handlePrepopulate();
    }
  }, [handlePrepopulate]);

  const filteredSubmissions = useMemo(() => {
    let filtered = selectedCourse === 'all' ? submissions : submissions.filter(s => s.course === selectedCourse);
    if (selectedTopic) {
      filtered = filtered.filter(s => s.topic === selectedTopic);
    }
    return filtered;
  }, [submissions, selectedCourse, selectedTopic]);

  // Topic friction data (excluding "Other / Not Listed")
  const topicData = useMemo(() => {
    const baseSubmissions = selectedCourse === 'all' ? submissions : submissions.filter(s => s.course === selectedCourse);
    const topicsExcludingOther = PREDEFINED_TOPICS.filter(t => t !== 'Other / Not Listed');
    return topicsExcludingOther.map(topic => {
      const topicSubmissions = baseSubmissions.filter(s => s.topic === topic);
      const avgSeverity = topicSubmissions.length > 0
        ? topicSubmissions.reduce((sum, s) => sum + s.severity, 0) / topicSubmissions.length
        : 0;
      return {
        topic: topic.length > 20 ? topic.substring(0, 18) + '...' : topic,
        fullTopic: topic,
        count: topicSubmissions.length,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        isSelected: selectedTopic === topic,
      };
    }).sort((a, b) => b.count - a.count);
  }, [submissions, selectedCourse, selectedTopic]);

  // Top friction topics (for highlight cards)
  const topFrictionTopics = useMemo(() => {
    return topicData
      .filter(t => t.count > 0)
      .sort((a, b) => (b.count * b.avgSeverity) - (a.count * a.avgSeverity))
      .slice(0, 3);
  }, [topicData]);

  // Friction type distribution
  const frictionTypeData = useMemo(() => {
    const categories: FrictionCategory[] = ['Conceptual', 'Curriculum Structure', 'Delivery & Assessment'];
    return categories.map(cat => ({
      name: cat,
      value: filteredSubmissions.filter(s => s.frictionCategory === cat).length,
    })).filter(d => d.value > 0);
  }, [filteredSubmissions]);

  // Dominant friction type
  const dominantFriction = useMemo(() => {
    if (frictionTypeData.length === 0) return null;
    const sorted = [...frictionTypeData].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((sum, d) => sum + d.value, 0);
    const dominant = sorted[0];
    return {
      name: dominant.name,
      percent: Math.round((dominant.value / total) * 100),
    };
  }, [frictionTypeData]);

  // Custom/emerging topics
  const emergingTopics = useMemo(() => {
    const baseSubmissions = selectedCourse === 'all' ? submissions : submissions.filter(s => s.course === selectedCourse);
    const customSubmissions = baseSubmissions.filter(s => s.topic === 'Other / Not Listed' && s.customTopic);
    const topicMap = new Map<string, { count: number; totalSeverity: number }>();
    
    customSubmissions.forEach(s => {
      const key = s.customTopic!;
      const existing = topicMap.get(key) || { count: 0, totalSeverity: 0 };
      topicMap.set(key, {
        count: existing.count + 1,
        totalSeverity: existing.totalSeverity + s.severity,
      });
    });

    return Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        avgSeverity: Math.round((data.totalSeverity / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }, [submissions, selectedCourse]);

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const baseSubmissions = selectedCourse === 'all' ? submissions : submissions.filter(s => s.course === selectedCourse);
    const weeks: Array<{
      week: string;
      weekLabel: string;
      reports: number;
      avgSeverity: number;
      conceptual: number;
      curriculum: number;
      delivery: number;
    }> = [];

    // Generate last 6 weeks
    for (let i = 5; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      
      const weekSubmissions = baseSubmissions.filter(s => 
        isWithinInterval(new Date(s.timestamp), { start: weekStart, end: weekEnd })
      );

      const avgSeverity = weekSubmissions.length > 0
        ? weekSubmissions.reduce((sum, s) => sum + s.severity, 0) / weekSubmissions.length
        : 0;

      weeks.push({
        week: format(weekStart, 'MMM d'),
        weekLabel: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : format(weekStart, 'MMM d'),
        reports: weekSubmissions.length,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        conceptual: weekSubmissions.filter(s => s.frictionCategory === 'Conceptual').length,
        curriculum: weekSubmissions.filter(s => s.frictionCategory === 'Curriculum Structure').length,
        delivery: weekSubmissions.filter(s => s.frictionCategory === 'Delivery & Assessment').length,
      });
    }

    return weeks;
  }, [submissions, selectedCourse]);

  // Trend insight
  const trendInsight = useMemo(() => {
    if (weeklyTrendData.length < 2) return null;
    const currentWeek = weeklyTrendData[weeklyTrendData.length - 1];
    const lastWeek = weeklyTrendData[weeklyTrendData.length - 2];
    
    if (lastWeek.reports === 0) return { direction: 'neutral' as const, change: 0 };
    
    const change = Math.round(((currentWeek.reports - lastWeek.reports) / lastWeek.reports) * 100);
    return {
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
      change: Math.abs(change),
    };
  }, [weeklyTrendData]);

  const getSeverityColor = (severity: number) => {
    if (severity < 1.5) return 'bg-[hsl(var(--severity-minor))]';
    if (severity < 2.5) return 'bg-[hsl(var(--severity-moderate))]';
    return 'bg-[hsl(var(--severity-severe))]';
  };

  const getSeverityBadge = (severity: number) => {
    if (severity < 1.5) return <Badge className="bg-[hsl(var(--severity-minor))] text-primary-foreground">Minor</Badge>;
    if (severity < 2.5) return <Badge className="bg-[hsl(var(--severity-moderate))] text-primary-foreground">Moderate</Badge>;
    return <Badge className="bg-[hsl(var(--severity-severe))] text-primary-foreground">Severe</Badge>;
  };

  const handleBarClick = (data: any) => {
    if (selectedTopic === data.fullTopic) {
      setSelectedTopic(null);
    } else {
      setSelectedTopic(data.fullTopic);
    }
  };

  const clearTopicFilter = () => setSelectedTopic(null);

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Prepopulate Confirmation Dialog */}
        <AlertDialog open={showPrepopulateDialog} onOpenChange={setShowPrepopulateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Demo Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will add demo data alongside existing entries. Your current data will not be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePrepopulate}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Confirmation Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block">
                  This will remove all current courses, topics, and friction reports from the dashboard.
                </span>
                <span className="block text-muted-foreground">
                  This action is typically used to start a fresh analysis or demo.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>Clear & Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header & Controls Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Learning Friction Insights</h2>
            <p className="text-muted-foreground">
              {filteredSubmissions.length} reports analyzed
              {selectedTopic && (
                <button 
                  onClick={clearTopicFilter}
                  className="ml-2 text-primary hover:underline text-sm"
                >
                  (Clear filter: {selectedTopic})
                </button>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Course Filter */}
            <Select value={selectedCourse} onValueChange={(v) => setSelectedCourse(v as Course | 'all')}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {COURSES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isPrepopulating || isClearing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Dataset Controls Section */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">Dataset Controls</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use these controls for demos, testing, or fresh analysis.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Clear All Data Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                  disabled={isRefreshing || isPrepopulating || isClearing || submissions.length === 0}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className={`h-4 w-4 ${isClearing ? 'animate-spin' : ''}`} />
                  {isClearing ? 'Clearing...' : 'Clear All Data'}
                </Button>
                
                {/* Pre-populate Demo Data Button */}
                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={initiatePrepopulate}
                    disabled={isRefreshing || isPrepopulating || isClearing}
                    className="gap-2"
                  >
                    <Database className={`h-4 w-4 ${isPrepopulating ? 'animate-pulse' : ''}`} />
                    {isPrepopulating ? 'Adding...' : 'Pre-Populate Demo Data'}
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    Adds realistic sample data to explore patterns
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Friction Topics Highlight */}
        {topFrictionTopics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topFrictionTopics.map((topic, index) => (
              <Card 
                key={topic.fullTopic} 
                className={`transition-all duration-300 cursor-pointer hover:shadow-md ${
                  index === 0 ? 'border-destructive/50 bg-destructive/5' : ''
                } ${selectedTopic === topic.fullTopic ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleBarClick(topic)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`h-4 w-4 ${index === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <span className="text-sm text-muted-foreground">#{index + 1} Priority</span>
                      </div>
                      <h3 className="font-semibold">{topic.fullTopic}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {topic.count} reports · Avg severity: {topic.avgSeverity}
                      </p>
                    </div>
                    {getSeverityBadge(topic.avgSeverity)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Friction by Topic Bar Chart */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Friction by Topic
              </CardTitle>
              <CardDescription>Click a bar to filter dashboard by topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                {chartMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topicData} 
                      layout="vertical" 
                      margin={{ left: 20, right: 20 }}
                      onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0].payload)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis 
                        type="category" 
                        dataKey="topic" 
                        width={130}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip content={<BarChartTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                      <Bar 
                        dataKey="count" 
                        shape={(props: any) => {
                          const isSelected = props.payload.isSelected;
                          return (
                            <AnimatedBar 
                              {...props} 
                              fill={isSelected ? 'hsl(220, 80%, 45%)' : 'hsl(220, 70%, 35%)'}
                            />
                          );
                        }}
                        activeBar={{ fill: 'hsl(220, 80%, 50%)' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Friction Type Distribution */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Friction Type Distribution
              </CardTitle>
              <CardDescription>Breakdown by friction category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] relative">
                {chartMounted && frictionTypeData.length > 0 && (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={frictionTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(undefined)}
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          {frictionTypeData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              style={{
                                opacity: chartMounted ? 1 : 0,
                                transition: `opacity 400ms ease-out ${index * 150}ms`,
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieChartTooltip filteredSubmissions={filteredSubmissions} />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center text */}
                    {dominantFriction && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: '36px' }}>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Dominant</p>
                          <p className="text-sm font-semibold">{dominantFriction.name.split(' ')[0]}</p>
                          <p className="text-lg font-bold text-primary">{dominantFriction.percent}%</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Instructor Insight Panel */}
              {dominantFriction && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                        Instructor Insight
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {INSIGHTS[dominantFriction.name as FrictionCategory]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trend Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Friction Trend
                </CardTitle>
                <CardDescription>Report volume over the past 6 weeks</CardDescription>
              </div>
              {trendInsight && trendInsight.direction !== 'neutral' && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  trendInsight.direction === 'up' 
                    ? 'bg-[hsl(var(--severity-severe))]/10 text-[hsl(var(--severity-severe))]' 
                    : 'bg-[hsl(var(--severity-minor))]/10 text-[hsl(var(--severity-minor))]'
                }`}>
                  <span>{trendInsight.direction === 'up' ? '↑' : '↓'}</span>
                  <span>{trendInsight.change}% vs last week</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {chartMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220, 70%, 35%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(220, 70%, 35%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
                            <p className="font-medium text-sm mb-2">{data.weekLabel}</p>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Reports:</span>
                                <span className="font-medium">{data.reports}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Severity:</span>
                                <span className="font-medium">{data.avgSeverity || 'N/A'}</span>
                              </div>
                              <div className="pt-1.5 border-t border-border mt-1.5">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Conceptual:</span>
                                  <span className="font-medium">{data.conceptual}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Curriculum:</span>
                                  <span className="font-medium">{data.curriculum}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Delivery:</span>
                                  <span className="font-medium">{data.delivery}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reports"
                      stroke="hsl(220, 70%, 35%)"
                      strokeWidth={2}
                      fill="url(#colorReports)"
                      animationDuration={800}
                      animationEasing="ease-out"
                      dot={{ r: 4, fill: 'hsl(220, 70%, 35%)', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: 'hsl(220, 80%, 50%)', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>


        {emergingTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" />
                Emerging Topics
              </CardTitle>
              <CardDescription>
                Custom topics submitted by students that may need curriculum attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Topic</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Reports</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Avg Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergingTopics.map((topic, index) => (
                      <tr 
                        key={topic.topic} 
                        className="border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
                        style={{ 
                          opacity: chartMounted ? 1 : 0,
                          transition: `opacity 300ms ease-out ${index * 50}ms`,
                        }}
                      >
                        <td className="py-3 px-4 font-medium text-sm">{topic.topic}</td>
                        <td className="py-3 px-4 text-center text-sm">{topic.count}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getSeverityColor(topic.avgSeverity)}`} />
                            <span className="text-sm">{topic.avgSeverity}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Friction Reports Yet</h3>
              <p className="text-muted-foreground">
                Friction reports from students will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};