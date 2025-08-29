import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { memberService } from '@/services/memberService';
import { penaltyService } from '@/services/penaltyService';
import { Penalty } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';

const IframePenaltyList = () => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPenalties();
  }, []);

  const loadPenalties = async () => {
    try {
      const penaltiesData = await penaltyService.getRecent(50, 0);
      setPenalties(penaltiesData);
    } catch (error) {
      console.error('Failed to load penalties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="text-center text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Aktuelle Strafenliste</h1>
          <p className="text-muted-foreground">
            {penalties.length} {penalties.length === 1 ? 'Strafe' : 'Strafen'} gefunden
          </p>
        </div>

        {penalties.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Keine Strafen vorhanden
          </div>
        ) : (
          <div className="space-y-3">
            {penalties.map((penalty) => (
              <div key={penalty.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex-1">
                  <div className="font-medium text-foreground text-lg">
                    {penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {penalty.penalty_type?.name || 'Unbekannt'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(penalty.created_time || penalty.date)}
                    </span>
                  </div>
                  {penalty.notes && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {penalty.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    {penalty.amount}€
                  </div>
                  {penalty.multiplier && penalty.multiplier > 1 && (
                    <div className="text-xs text-muted-foreground">
                      {penalty.multiplier}x Faktor
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IframePenaltyList;