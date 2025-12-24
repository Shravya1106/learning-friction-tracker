import { FrictionSubmission, Course, PredefinedTopic, FrictionCategory, FrictionType, Severity, FRICTION_SUBTYPES } from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const randomDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
};

const createSubmission = (
  course: Course,
  topic: PredefinedTopic,
  frictionCategory: FrictionCategory,
  frictionType: FrictionType,
  severity: Severity,
  comment?: string,
  customTopic?: string,
  isCustomCourse?: boolean,
  customCourse?: { name: string; institution?: string }
): FrictionSubmission => ({
  id: generateId(),
  course,
  topic,
  customTopic,
  frictionCategory,
  frictionType,
  severity,
  comment,
  timestamp: randomDate(42),
  isCustomCourse,
  customCourse,
});

export const DEMO_SUBMISSIONS: FrictionSubmission[] = [
  // Data Structures - Recursion issues (high friction topic)
  createSubmission('Data Structures & Programming Fundamentals', 'Recursion', 'Conceptual', 'Conceptual confusion', 3, 'Call stack visualization is confusing'),
  createSubmission('Data Structures & Programming Fundamentals', 'Recursion', 'Conceptual', 'Prerequisite gap', 3, 'Need more math background'),
  createSubmission('Data Structures & Programming Fundamentals', 'Recursion', 'Curriculum Structure', 'Topics jump without smooth transition', 2),
  createSubmission('Data Structures & Programming Fundamentals', 'Recursion', 'Delivery & Assessment', 'Insufficient worked examples', 3, 'Only 2 examples before complex problems'),
  createSubmission('Data Structures & Programming Fundamentals', 'Recursion', 'Conceptual', 'Difficulty connecting concepts', 2),
  
  // Data Structures - Arrays (moderate friction)
  createSubmission('Data Structures & Programming Fundamentals', 'Data Structures (Arrays, Lists)', 'Curriculum Structure', 'Too many concepts introduced at once', 2),
  createSubmission('Data Structures & Programming Fundamentals', 'Data Structures (Arrays, Lists)', 'Delivery & Assessment', 'Pace too fast', 2),
  createSubmission('Data Structures & Programming Fundamentals', 'Data Structures (Arrays, Lists)', 'Conceptual', 'Difficulty connecting concepts', 1),
  
  // Data Structures - Functions
  createSubmission('Data Structures & Programming Fundamentals', 'Functions & Modularity', 'Conceptual', 'Conceptual confusion', 2, 'Scope rules are unclear'),
  createSubmission('Data Structures & Programming Fundamentals', 'Functions & Modularity', 'Curriculum Structure', 'No clear learning sequence', 1),
  
  // Database Systems - high friction topics
  createSubmission('Database Systems', 'Introduction & Basics', 'Conceptual', 'Prerequisite gap', 2, 'SQL syntax not covered before labs'),
  createSubmission('Database Systems', 'Problem Solving Practice', 'Delivery & Assessment', 'Assessment feels misaligned', 3, 'Exam covers topics not in lectures'),
  createSubmission('Database Systems', 'Problem Solving Practice', 'Delivery & Assessment', 'Insufficient worked examples', 2),
  createSubmission('Database Systems', 'Control Flow & Loops', 'Conceptual', 'Conceptual confusion', 2),
  
  // Operating Systems
  createSubmission('Operating Systems', 'Control Flow & Loops', 'Curriculum Structure', 'Topics jump without smooth transition', 3, 'Jumped from basics to threading'),
  createSubmission('Operating Systems', 'Control Flow & Loops', 'Conceptual', 'Prerequisite gap', 2),
  createSubmission('Operating Systems', 'Functions & Modularity', 'Delivery & Assessment', 'Pace too fast', 2),
  createSubmission('Operating Systems', 'Introduction & Basics', 'Conceptual', 'Difficulty connecting concepts', 1),
  
  // Web Development
  createSubmission('Web Development', 'Functions & Modularity', 'Curriculum Structure', 'Too many concepts introduced at once', 2, 'React hooks all at once'),
  createSubmission('Web Development', 'Functions & Modularity', 'Conceptual', 'Conceptual confusion', 2),
  createSubmission('Web Development', 'Data Structures (Arrays, Lists)', 'Conceptual', 'Difficulty connecting concepts', 1),
  createSubmission('Web Development', 'Introduction & Basics', 'Delivery & Assessment', 'Insufficient worked examples', 1),
  
  // Custom topics (Other / Not Listed)
  createSubmission('Data Structures & Programming Fundamentals', 'Other / Not Listed', 'Conceptual', 'Conceptual confusion', 3, 'Binary trees are very confusing', 'Binary Trees'),
  createSubmission('Database Systems', 'Other / Not Listed', 'Curriculum Structure', 'No clear learning sequence', 2, undefined, 'Query Optimization'),
  createSubmission('Operating Systems', 'Other / Not Listed', 'Conceptual', 'Prerequisite gap', 2, 'C pointers assumed known', 'Memory Management'),
  createSubmission('Web Development', 'Other / Not Listed', 'Delivery & Assessment', 'Pace too fast', 2, undefined, 'State Management'),
];

export const STORAGE_KEY = 'friction_submissions';

export const getSubmissions = (): FrictionSubmission[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed.map((s: FrictionSubmission) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));
  }
  // Initialize with demo data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_SUBMISSIONS));
  return DEMO_SUBMISSIONS;
};

export const addSubmission = (submission: Omit<FrictionSubmission, 'id' | 'timestamp'>): FrictionSubmission => {
  const submissions = getSubmissions();
  const newSubmission: FrictionSubmission = {
    ...submission,
    id: generateId(),
    timestamp: new Date(),
  };
  submissions.push(newSubmission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  return newSubmission;
};

export const prepopulateData = (): FrictionSubmission[] => {
  const existing = getSubmissions();
  // Generate fresh demo data with new timestamps
  const freshDemo = DEMO_SUBMISSIONS.map(s => ({
    ...s,
    id: generateId(),
    timestamp: randomDate(42),
  }));
  const combined = [...existing, ...freshDemo];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
  return combined.map(s => ({
    ...s,
    timestamp: new Date(s.timestamp),
  }));
};

export const hasExistingData = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const parsed = JSON.parse(stored);
  return parsed.length > 0;
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
