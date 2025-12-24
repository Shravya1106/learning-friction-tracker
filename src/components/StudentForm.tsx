import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Send, BookOpen, HelpCircle } from 'lucide-react';
import { 
  COURSES, 
  PREDEFINED_TOPICS, 
  FRICTION_CATEGORIES, 
  FRICTION_SUBTYPES,
  SEVERITY_LABELS,
  Course,
  PredefinedTopic,
  FrictionCategory,
  FrictionType,
  Severity,
} from '@/lib/types';
import { addSubmission } from '@/lib/demo-data';

export const StudentForm = () => {
  const [course, setCourse] = useState<Course | ''>('');
  const [useCustomCourse, setUseCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState('');
  const [customCourseInstitution, setCustomCourseInstitution] = useState('');
  const [topic, setTopic] = useState<PredefinedTopic | ''>('');
  const [customTopic, setCustomTopic] = useState('');
  const [frictionCategory, setFrictionCategory] = useState<FrictionCategory | ''>('');
  const [frictionType, setFrictionType] = useState<FrictionType | ''>('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isOtherTopic = topic === 'Other / Not Listed';
  const showFrictionTypes = frictionCategory !== '';
  const availableFrictionTypes = frictionCategory ? FRICTION_SUBTYPES[frictionCategory] : [];
  
  const courseValid = useCustomCourse ? customCourseName.trim() !== '' : course !== '';
  const isValid = 
    courseValid && 
    topic !== '' && 
    (!isOtherTopic || customTopic.trim() !== '') &&
    frictionCategory !== '' && 
    frictionType !== '' && 
    severity !== null;

  const handleCategoryChange = (value: FrictionCategory) => {
    setFrictionCategory(value);
    setFrictionType('');
  };

  const handleCustomCourseToggle = (checked: boolean) => {
    setUseCustomCourse(checked);
    if (checked) {
      setCourse('');
    } else {
      setCustomCourseName('');
      setCustomCourseInstitution('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    addSubmission({
      course: useCustomCourse ? customCourseName : (course as Course),
      isCustomCourse: useCustomCourse,
      customCourse: useCustomCourse ? {
        name: customCourseName,
        institution: customCourseInstitution || undefined,
      } : undefined,
      topic: topic as PredefinedTopic,
      customTopic: isOtherTopic ? customTopic : undefined,
      frictionCategory: frictionCategory as FrictionCategory,
      frictionType: frictionType as FrictionType,
      severity: severity as Severity,
      comment: comment || undefined,
    });

    setSubmitted(true);
    
    setTimeout(() => {
      setCourse('');
      setUseCustomCourse(false);
      setCustomCourseName('');
      setCustomCourseInstitution('');
      setTopic('');
      setCustomTopic('');
      setFrictionCategory('');
      setFrictionType('');
      setSeverity(null);
      setComment('');
      setSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center shadow-lg border-border/50">
          <CardContent className="pt-10 pb-10">
            <div className="bg-[hsl(var(--severity-minor))]/10 rounded-full p-5 w-fit mx-auto mb-5">
              <CheckCircle2 className="h-14 w-14 text-[hsl(var(--severity-minor))]" />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Thank You!</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Your feedback helps improve the learning experience for everyone.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-start justify-center py-10 px-4">
      <Card className="w-full max-w-2xl shadow-lg border-border/50 bg-card">
        <CardHeader className="pb-6 border-b border-border/30">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            Report Learning Friction
          </CardTitle>
          <CardDescription className="text-base mt-2 leading-relaxed">
            Help your instructors understand where you're experiencing difficulty. 
            This takes less than 30 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course Selection */}
            <div className="space-y-3">
              <Label htmlFor="course" className="text-sm font-medium">
                Course <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={course} 
                onValueChange={(v) => setCourse(v as Course)}
                disabled={useCustomCourse}
              >
                <SelectTrigger 
                  id="course" 
                  className={`h-11 ${useCustomCourse ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <SelectValue placeholder="Select your course" />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Course Section */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Can't find your course? Report it manually.
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="custom-course-toggle"
                        checked={useCustomCourse}
                        onCheckedChange={handleCustomCourseToggle}
                      />
                      <Label 
                        htmlFor="custom-course-toggle" 
                        className="text-sm font-normal cursor-pointer text-primary hover:text-primary/80 transition-colors"
                      >
                        Report a custom course
                      </Label>
                    </div>

                    {/* Animated Custom Course Inputs */}
                    <div 
                      className={`grid transition-all duration-300 ease-out ${
                        useCustomCourse 
                          ? 'grid-rows-[1fr] opacity-100' 
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-4 pt-3">
                          <div className="space-y-2">
                            <Label htmlFor="custom-course-name" className="text-sm">
                              Course Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="custom-course-name"
                              placeholder="e.g., Advanced Machine Learning"
                              value={customCourseName}
                              onChange={(e) => setCustomCourseName(e.target.value)}
                              className="h-10"
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custom-course-institution" className="text-sm text-muted-foreground">
                              Institution / Platform (optional)
                            </Label>
                            <Input
                              id="custom-course-institution"
                              placeholder="e.g., MIT OpenCourseWare, Coursera"
                              value={customCourseInstitution}
                              onChange={(e) => setCustomCourseInstitution(e.target.value)}
                              className="h-10"
                              maxLength={100}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Topic Selection */}
            <div className="space-y-3">
              <Label htmlFor="topic" className="text-sm font-medium">
                Topic <span className="text-destructive">*</span>
              </Label>
              <Select value={topic} onValueChange={(v) => setTopic(v as PredefinedTopic)}>
                <SelectTrigger id="topic" className="h-11">
                  <SelectValue placeholder="Select the topic" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Animated Custom Topic Input */}
              <div 
                className={`grid transition-all duration-300 ease-out ${
                  isOtherTopic 
                    ? 'grid-rows-[1fr] opacity-100' 
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <Input
                    placeholder="Enter topic name (max 30 chars)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value.slice(0, 30))}
                    maxLength={30}
                    className="mt-3 h-10"
                  />
                </div>
              </div>
            </div>

            {/* Friction Category */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                What type of friction? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup 
                value={frictionCategory} 
                onValueChange={(v) => handleCategoryChange(v as FrictionCategory)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {FRICTION_CATEGORIES.map((cat) => (
                  <div 
                    key={cat} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      frictionCategory === cat 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    <RadioGroupItem value={cat} id={cat} />
                    <Label htmlFor={cat} className="cursor-pointer text-sm font-normal flex-1">{cat}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Friction Subtype */}
            <div 
              className={`grid transition-all duration-300 ease-out ${
                showFrictionTypes 
                  ? 'grid-rows-[1fr] opacity-100' 
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <Label className="text-sm font-medium">
                    Specifically... <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup 
                    value={frictionType} 
                    onValueChange={(v) => setFrictionType(v as FrictionType)}
                    className="space-y-2"
                  >
                    {availableFrictionTypes.map((type) => (
                      <div 
                        key={type} 
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          frictionType === type 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => setFrictionType(type)}
                      >
                        <RadioGroupItem value={type} id={type} />
                        <Label htmlFor={type} className="cursor-pointer text-sm font-normal flex-1">{type}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                How severe is this friction? <span className="text-destructive">*</span>
              </Label>
              <RadioGroup 
                value={severity?.toString() || ''} 
                onValueChange={(v) => setSeverity(Number(v) as Severity)}
                className="grid grid-cols-3 gap-4"
              >
                {([1, 2, 3] as Severity[]).map((s) => (
                  <div 
                    key={s} 
                    className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      severity === s 
                        ? s === 1 ? 'border-[hsl(var(--severity-minor))] bg-[hsl(var(--severity-minor))]/10 shadow-sm' 
                        : s === 2 ? 'border-[hsl(var(--severity-moderate))] bg-[hsl(var(--severity-moderate))]/10 shadow-sm'
                        : 'border-[hsl(var(--severity-severe))] bg-[hsl(var(--severity-severe))]/10 shadow-sm'
                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
                    }`}
                    onClick={() => setSeverity(s)}
                  >
                    <RadioGroupItem value={s.toString()} id={`severity-${s}`} className="sr-only" />
                    <span className={`text-3xl font-bold ${
                      s === 1 ? 'text-[hsl(var(--severity-minor))]' 
                      : s === 2 ? 'text-[hsl(var(--severity-moderate))]'
                      : 'text-[hsl(var(--severity-severe))]'
                    }`}>{s}</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">{SEVERITY_LABELS[s]}</span>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Optional Comment */}
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-sm font-medium">
                Additional context <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Brief description of the issue..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                maxLength={200}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={!isValid} 
              className="w-full h-12 text-base font-medium shadow-sm" 
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
