import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Users, Euro, BarChart3, LogOut } from 'lucide-react';
import { MOCK_MEMBERS, MOCK_PENALTIES } from '@/data/mockData';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in as admin
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const totalMembers = MOCK_MEMBERS.length;
  const totalPenalties = MOCK_PENALTIES.length;
  const totalAmount = MOCK_PENALTIES.reduce((sum, penalty) => sum + penalty.amount, 0);
  const todayPenalties = MOCK_PENALTIES.filter(p => p.date === new Date().toISOString().split('T')[0]).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Spieß Dashboard</h1>
              <p className="text-primary-foreground/80">Strafen verwalten</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{totalMembers}</div>
              <div className="text-sm text-muted-foreground">Schützen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{totalPenalties}</div>
              <div className="text-sm text-muted-foreground">Strafen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Euro className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{totalAmount}€</div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <PlusCircle className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{todayPenalties}</div>
              <div className="text-sm text-muted-foreground">Heute</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>
              Verwalten Sie Strafen mit wenigen Klicks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate('/add-penalty')}
              className="w-full h-16 text-lg bg-gradient-to-r from-primary to-primary-glow"
            >
              <PlusCircle className="w-6 h-6 mr-3" />
              Neue Strafe hinzufügen
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="h-12"
              >
                Öffentliche Rangliste
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard?filter=today')}
                className="h-12"
              >
                Heutige Strafen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Penalties */}
        <Card>
          <CardHeader>
            <CardTitle>Neueste Strafen</CardTitle>
            <CardDescription>
              Die letzten hinzugefügten Strafen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_PENALTIES.slice(0, 5).map((penalty) => (
                <div key={penalty.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{penalty.memberName}</div>
                    <div className="text-sm text-muted-foreground">
                      {penalty.category} • {penalty.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{penalty.amount}€</div>
                    {penalty.notes && (
                      <div className="text-xs text-muted-foreground">{penalty.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;