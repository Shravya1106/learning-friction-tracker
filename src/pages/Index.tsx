import { useState } from 'react';
import { Header } from '@/components/Header';
import { StudentForm } from '@/components/StudentForm';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const [isTeacher, setIsTeacher] = useState(false);

  return (
    <>
      <Helmet>
        <title>Learning Friction Tracker | Reveal Curriculum Insights</title>
        <meta name="description" content="A structured feedback tool that helps students report learning friction and enables teachers to visualize curriculum pain points through aggregated insights." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header isTeacher={isTeacher} onToggle={setIsTeacher} />
        <main>
          {isTeacher ? <TeacherDashboard /> : <StudentForm />}
        </main>
      </div>
    </>
  );
};

export default Index;
