import { GraduationCap, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  isTeacher: boolean;
  onToggle: (isTeacher: boolean) => void;
}

export const Header = ({ isTeacher, onToggle }: HeaderProps) => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Learning Friction Tracker</h1>
            <p className="text-sm text-muted-foreground">Reveal curriculum insights</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full">
            <Label 
              htmlFor="role-toggle" 
              className={`text-sm font-medium cursor-pointer transition-colors ${!isTeacher ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              Student
            </Label>
            <Switch
              id="role-toggle"
              checked={isTeacher}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-primary"
            />
            <Label 
              htmlFor="role-toggle" 
              className={`text-sm font-medium cursor-pointer transition-colors ${isTeacher ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <GraduationCap className="h-4 w-4 inline mr-1" />
              Teacher
            </Label>
          </div>
        </div>
      </div>
    </header>
  );
};
