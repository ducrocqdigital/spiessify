import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Users, Cog } from 'lucide-react';

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
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-popover-foreground">Einstellungen</h4>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 text-sm"
              onClick={() => navigate('/admin/members')}
            >
              <Users className="h-4 w-4 mr-2" />
              Mitglieder verwalten
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 text-sm"
              onClick={() => navigate('/admin/penalty-catalog')}
            >
              <Cog className="h-4 w-4 mr-2" />
              Strafenkatalog verwalten
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsMenu;