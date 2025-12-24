export type Course = 
  | 'Data Structures & Programming Fundamentals'
  | 'Database Systems'
  | 'Operating Systems'
  | 'Web Development';

export type PredefinedTopic = 
  | 'Introduction & Basics'
  | 'Control Flow & Loops'
  | 'Functions & Modularity'
  | 'Data Structures (Arrays, Lists)'
  | 'Recursion'
  | 'Problem Solving Practice'
  | 'Other / Not Listed';

export type FrictionCategory = 'Conceptual' | 'Curriculum Structure' | 'Delivery & Assessment';

export type ConceptualFriction = 
  | 'Conceptual confusion'
  | 'Difficulty connecting concepts'
  | 'Prerequisite gap';

export type CurriculumFriction = 
  | 'Topics jump without smooth transition'
  | 'No clear learning sequence'
  | 'Too many concepts introduced at once';

export type DeliveryFriction = 
  | 'Pace too fast'
  | 'Insufficient worked examples'
  | 'Assessment feels misaligned';

export type FrictionType = ConceptualFriction | CurriculumFriction | DeliveryFriction;

export type Severity = 1 | 2 | 3;

export interface CustomCourseData {
  name: string;
  institution?: string;
}

export interface FrictionSubmission {
  id: string;
  course: Course | string;
  customCourse?: CustomCourseData;
  isCustomCourse?: boolean;
  topic: PredefinedTopic;
  customTopic?: string;
  frictionCategory: FrictionCategory;
  frictionType: FrictionType;
  severity: Severity;
  comment?: string;
  timestamp: Date;
}

export const COURSES: Course[] = [
  'Data Structures & Programming Fundamentals',
  'Database Systems',
  'Operating Systems',
  'Web Development',
];

export const PREDEFINED_TOPICS: PredefinedTopic[] = [
  'Introduction & Basics',
  'Control Flow & Loops',
  'Functions & Modularity',
  'Data Structures (Arrays, Lists)',
  'Recursion',
  'Problem Solving Practice',
  'Other / Not Listed',
];

export const FRICTION_CATEGORIES: FrictionCategory[] = [
  'Conceptual',
  'Curriculum Structure',
  'Delivery & Assessment',
];

export const FRICTION_SUBTYPES: Record<FrictionCategory, FrictionType[]> = {
  'Conceptual': [
    'Conceptual confusion',
    'Difficulty connecting concepts',
    'Prerequisite gap',
  ],
  'Curriculum Structure': [
    'Topics jump without smooth transition',
    'No clear learning sequence',
    'Too many concepts introduced at once',
  ],
  'Delivery & Assessment': [
    'Pace too fast',
    'Insufficient worked examples',
    'Assessment feels misaligned',
  ],
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  1: 'Minor friction',
  2: 'Moderate friction',
  3: 'Severe friction',
};
