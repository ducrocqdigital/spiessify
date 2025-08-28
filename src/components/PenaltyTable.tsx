import { useState } from 'react';
import { Penalty } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, MapPin, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateTime } from '@/utils/dateUtils';
import { memberService } from '@/services/memberService';

interface PenaltyTableProps {
  penalties: Penalty[];
  onEdit: (id: string, updates: Partial<Penalty>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  members?: any[];
  penaltyTypes?: any[];
}

const PenaltyTable = ({ penalties, onEdit, onDelete, members = [], penaltyTypes = [] }: PenaltyTableProps) => {
  const [editDialog, setEditDialog] = useState<{ penalty: Penalty | null; open: boolean }>({ penalty: null, open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ penalty: Penalty | null; open: boolean }>({ penalty: null, open: false });
  const [editForm, setEditForm] = useState({
    member_id: '',
    penalty_type_id: '',
    amount: 0,
    notes: '',
    date: ''
  });

  const openEditDialog = (penalty: Penalty) => {
    setEditForm({
      member_id: penalty.member_id,
      penalty_type_id: penalty.penalty_type_id,
      amount: penalty.amount,
      notes: penalty.notes || '',
      date: penalty.date
    });
    setEditDialog({ penalty, open: true });
  };

  const openDeleteDialog = (penalty: Penalty) => {
    setDeleteDialog({ penalty, open: true });
  };

  const handleEdit = async () => {
    if (!editDialog.penalty) return;
    
    await onEdit(editDialog.penalty.id, editForm);
    setEditDialog({ penalty: null, open: false });
  };

  const handleDelete = async () => {
    if (!deleteDialog.penalty) return;
    
    await onDelete(deleteDialog.penalty.id);
    setDeleteDialog({ penalty: null, open: false });
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'timing': return 'destructive';
      case 'soziales': return 'secondary';
      case 'abnahme': return 'outline';
      case 'maschieren': return 'default';
      case 'sonstiges': return 'default';
      default: return 'default';
    }
  };

  const handlePenaltyTypeChange = (value: string) => {
    const penaltyType = penaltyTypes.find(pt => pt.id === value);
    setEditForm(prev => ({
      ...prev,
      penalty_type_id: value,
      amount: penaltyType?.amount || prev.amount
    }));
  };

  return (
    <>
      <div className="space-y-3">
        {penalties.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Keine Strafen vorhanden</div>
        ) : (
          penalties.map((penalty) => (
            <div key={penalty.id} className="border border-border rounded-lg p-3 md:p-4 bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {/* Member Avatar - smaller on mobile */}
                <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                  <AvatarImage 
                    src={penalty.member?.profile_photo} 
                    alt={penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-5 w-5 md:h-6 md:w-6" />
                  </AvatarFallback>
                </Avatar>
                
                {/* Content - more compact on mobile */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-1 md:gap-2 mb-1 md:mb-2">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                      <h4 className="font-medium text-card-foreground text-sm md:text-base">
                        {penalty.member ? memberService.getDisplayName(penalty.member) : 'Unbekannt'}
                      </h4>
                      <Badge variant={getCategoryBadgeVariant(penalty.penalty_type?.category || '')} className="text-xs">
                        {penalty.penalty_type?.category || 'Unbekannt'}
                      </Badge>
                    </div>
                    <div className="text-base md:text-lg font-bold text-primary">{penalty.amount}€</div>
                  </div>
                  
                  <div className="text-xs md:text-sm text-muted-foreground space-y-0.5 md:space-y-1">
                    <div className="font-medium text-card-foreground text-xs md:text-sm">
                      {penalty.penalty_type?.name || 'Unbekannt'}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{formatDateTime(penalty.created_time || penalty.created_at)}</span>
                      {penalty.location_latitude && penalty.location_longitude && (
                        <MapPin className="w-3 h-3" />
                      )}
                    </div>
                    {penalty.notes && (
                      <div className="text-xs bg-muted p-1.5 md:p-2 rounded text-muted-foreground">
                        {penalty.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions - smaller on mobile */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(penalty)}
                    className="h-7 w-7 md:h-8 md:w-8 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(penalty)}
                    className="h-7 w-7 md:h-8 md:w-8 p-0 hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafe bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Details der Strafe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mitglied</Label>
              <Select value={editForm.member_id} onValueChange={(value) => setEditForm(prev => ({ ...prev, member_id: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {memberService.getDisplayName(member)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Strafart</Label>
              <Select value={editForm.penalty_type_id} onValueChange={handlePenaltyTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {penaltyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.amount}€)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Betrag (€)</Label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Zusätzliche Notizen..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ penalty: null, open: false })}>
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Strafe löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie diese Strafe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ penalty: null, open: false })}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PenaltyTable;