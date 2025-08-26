import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login - in real app, this would validate against backend
    if (username === 'spiess' && password === 'strafen2024') {
      localStorage.setItem('isAdmin', 'true');
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück, Spieß!",
      });
      navigate('/admin');
    } else {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Benutzername oder Passwort falsch",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary-glow/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-2xl font-bold">S</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Spieß Anmeldung</CardTitle>
            <CardDescription>
              Melden Sie sich an, um Strafen zu verwalten
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="spiess"
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow">
              Anmelden
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="text-sm"
            >
              Zur öffentlichen Rangliste
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;