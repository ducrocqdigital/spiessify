import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Users, Cog, Calendar } from 'lucide-react';

const SettingsMenu = () => {
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline-inverse" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-popover border border-border shadow-lg">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-8 text-sm"
            onClick={() => navigate('/admin/members')}
          >
            <Users className="h-4 w-4 mr-2" />
            Mitglieder
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-8 text-sm"
            onClick={() => navigate('/admin/penalty-catalog')}
          >
            <Cog className="h-4 w-4 mr-2" />
            Strafenkatalog
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-8 text-sm"
            onClick={() => navigate('/events')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Veranstaltungen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsMenu;