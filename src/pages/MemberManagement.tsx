import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { memberService } from '@/services/memberService';
import { Member, MEMBER_RANKS, MemberRank } from '@/types';
import { Plus, Edit2, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';

const MemberManagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    birth_date: '',
    join_year: '',
    rank: 'schuetze' as MemberRank,
    is_active: true
  });

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadMembers();
  }, [navigate]);

  const loadMembers = async () => {
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglieder konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      birth_date: '',
      join_year: '',
      rank: 'schuetze',
      is_active: true
    });
  };

  const handleAddMember = async () => {
    try {
      const memberData = {
        ...formData,
        join_year: formData.join_year ? parseInt(formData.join_year) : undefined,
        birth_date: formData.birth_date || undefined
      };
      await memberService.create(memberData);
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich hinzugefügt.",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglied konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    
    try {
      const updateData = {
        ...formData,
        join_year: formData.join_year ? parseInt(formData.join_year) : null,
        birth_date: formData.birth_date || null
      };
      await memberService.update(editingMember.id, updateData);
      toast({
        title: "Erfolg",
        description: "Mitglied wurde erfolgreich aktualisiert.",
      });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      resetForm();
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Mitglied konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (member: Member) => {
    try {
      await memberService.toggleActive(member.id);
      toast({
        title: "Erfolg",
        description: `${member.first_name} ${member.last_name} wurde ${member.is_active ? 'deaktiviert' : 'aktiviert'}.`,
      });
      loadMembers();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      nickname: member.nickname || '',
      email: member.email || '',
      phone: member.phone || '',
      birth_date: member.birth_date || '',
      join_year: member.join_year?.toString() || '',
      rank: member.rank || 'schuetze',
      is_active: member.is_active
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Mitgliederverwaltung</h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Mitglied
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neues Mitglied hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie ein neues Mitglied zur Schützengesellschaft hinzu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="first_name">Vorname *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nachname *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="nickname">Spitzname</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="rank">Rang</Label>
                <Select value={formData.rank} onValueChange={(value) => setFormData({...formData, rank: value as MemberRank})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEMBER_RANKS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">Geburtsdatum</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="join_year">Beitrittsjahr</Label>
                <Input
                  id="join_year"
                  type="number"
                  value={formData.join_year}
                  onChange={(e) => setFormData({...formData, join_year: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddMember} disabled={!formData.first_name || !formData.last_name}>
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Mitglieder ({members.length})</CardTitle>
          <CardDescription>
            Verwalten Sie die Mitglieder der Schützengesellschaft
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rang</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Beitrittsjahr</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                      {member.nickname && (
                        <div className="text-sm text-muted-foreground">
                          "{member.nickname}"
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {MEMBER_RANKS[member.rank || 'schuetze']}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{member.join_year}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(member)}
                      >
                        {member.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mitglied bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen des Mitglieds.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="edit_first_name">Vorname *</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_last_name">Nachname *</Label>
              <Input
                id="edit_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_nickname">Spitzname</Label>
              <Input
                id="edit_nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_rank">Rang</Label>
              <Select value={formData.rank} onValueChange={(value) => setFormData({...formData, rank: value as MemberRank})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEMBER_RANKS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_email">E-Mail</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_phone">Telefon</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_birth_date">Geburtsdatum</Label>
              <Input
                id="edit_birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_join_year">Beitrittsjahr</Label>
              <Input
                id="edit_join_year"
                type="number"
                value={formData.join_year}
                onChange={(e) => setFormData({...formData, join_year: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditMember} disabled={!formData.first_name || !formData.last_name}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberManagement;