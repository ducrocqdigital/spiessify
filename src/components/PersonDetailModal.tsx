import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Euro, Calendar, User } from 'lucide-react';
import { penaltyService } from '@/services/penaltyService';
import { userService } from '@/services/userService';
import { formatDateTime } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';

interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    family_name_particle?: string;
    nickname?: string;
    rank: string;
    total_amount: number;
    total_penalties: number;
  };
  memberRank: number;
  totalMembers: number;
}

export const PersonDetailModal = ({ 
  isOpen, 
  onClose, 
  member, 
  memberRank, 
  totalMembers 
}: PersonDetailModalProps) => {
  const { isAuthenticated, isOberadmin, isChargierte } = useAuth();
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isInternal = isAuthenticated && (isOberadmin || isChargierte);

  useEffect(() => {
    if (isOpen && member.id) {
      loadPenalties();
    }
  }, [isOpen, member.id]);

  const loadPenalties = async () => {
    setLoading(true);
    try {
      // Load penalties for all users (public and internal)
      const penaltiesData = await penaltyService.getByMemberId(member.id);
      
      if (isInternal) {
        // Add assigned-by information for internal users
        const penaltiesWithAssignedBy = await Promise.all(
          penaltiesData.map(async (penalty) => {
            const assignedByInfo = await userService.getAssignedByInfo(penalty);
            return {
              ...penalty,
              assignedByMember: assignedByInfo
            };
          })
        );
        setPenalties(penaltiesWithAssignedBy);
      } else {
        // Public users see basic penalty information
        setPenalties(penaltiesData);
      }
    } catch (error) {
      console.error('Failed to load penalties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (member.nickname) return member.nickname;
    
    if (isInternal) {
      // Internal users see full names
      const particle = member.family_name_particle ? ` ${member.family_name_particle}` : '';
      return `${member.first_name}${particle} ${member.last_name}`;
    } else {
      // Public users see abbreviated names
      const abbreviatedLastName = member.last_name.charAt(0) + '.';
      const abbreviatedParticle = member.family_name_particle 
        ? ` ${member.family_name_particle.charAt(0)}.` 
        : '';
      return `${member.first_name}${abbreviatedParticle} ${abbreviatedLastName}`;
    }
  };

  const getAssignedByDisplayName = (assignedByMember: any) => {
    if (!assignedByMember) return '';
    
    if (isInternal) {
      // Internal users see full names
      const particle = assignedByMember.family_name_particle ? ` ${assignedByMember.family_name_particle}` : '';
      return `${assignedByMember.first_name}${particle} ${assignedByMember.last_name}`;
    } else {
      // Public users see abbreviated names
      const abbreviatedLastName = assignedByMember.last_name.charAt(0) + '.';
      const abbreviatedParticle = assignedByMember.family_name_particle 
        ? ` ${assignedByMember.family_name_particle.charAt(0)}.` 
        : '';
      return `${assignedByMember.first_name}${abbreviatedParticle} ${abbreviatedLastName}`;
    }
  };

  const getRankIcon = () => {
    switch (memberRank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <User className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getRankClass = () => {
    switch (memberRank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20";
      case 2:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20";
      case 3:
        return "bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20";
      default:
        return "bg-muted/30";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Übersicht – {getDisplayName()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Card with Rank and Total */}
          <Card className={`border ${getRankClass()}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getRankIcon()}
                  <div>
                    <div className="font-semibold">{getDisplayName()}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.rank || 'Schütze'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {member.total_amount}€
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gesamtstrafe
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Platz im Ranking:</span>
                  <Badge variant="secondary">
                    {memberRank} von {totalMembers}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {member.total_penalties} Strafen
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Penalties List */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Strafen
            </h3>
            
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Laden...</div>
            ) : penalties.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Keine Strafen vorhanden
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {penalties.map((penalty) => (
                  <div key={penalty.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(penalty.date)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {penalty.penalty_type?.name || 'Unbekannt'}
                          </Badge>
                        </div>
                        
                        {isInternal && (
                          <>
                            {penalty.notes && (
                              <div className="text-xs text-muted-foreground mb-1">
                                {penalty.notes}
                              </div>
                            )}
                            {penalty.assignedByMember && (
                              <div className="text-xs text-muted-foreground">
                                Eingetragen von: {getAssignedByDisplayName(penalty.assignedByMember)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="text-right ml-2">
                        <div className="font-bold text-primary">
                          {penalty.amount}€
                        </div>
                        {penalty.multiplier && penalty.multiplier !== 1 && (
                          <div className="text-xs text-muted-foreground">
                            x{penalty.multiplier}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4">
            <Button 
              onClick={onClose} 
              className="w-full"
              variant="outline"
            >
              {isInternal ? 'Zurück' : 'Schließen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};