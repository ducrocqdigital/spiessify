import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, BarChart3, Timer } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary-glow/10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Digitale Strafenverwaltung
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Schnelle und einfache Verwaltung von Strafen für Ihr Schützenfest
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline-inverse"
                onClick={() => navigate('/admin-login')}
              >
                <Shield className="w-5 h-5 mr-2" />
                Spieß Anmeldung
              </Button>
              <Button
                size="lg"
                variant="outline-inverse"
                onClick={() => navigate('/dashboard')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Öffentliche Rangliste
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Funktionen</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Optimiert für mobile Nutzung während des Marsches
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="text-center shadow-elegant">
            <CardHeader>
              <Timer className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle>3-Tap Eingabe</CardTitle>
              <CardDescription>
                Strafen in nur 3 Klicks hinzufügen - optimiert für schnelle Eingabe
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center shadow-elegant">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle>20 Schützen</CardTitle>
              <CardDescription>
                Verwalten Sie alle Mitglieder Ihres Zugs mit festen Kategorien
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center shadow-elegant">
            <CardHeader>
              <BarChart3 className="w-12 h-12 mx-auto text-primary mb-4" />
              <CardTitle>Live Rangliste</CardTitle>
              <CardDescription>
                Öffentliche Einsicht in Strafen und Rangliste für alle Schützen
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Login Info */}
        <div className="mt-16 max-w-md mx-auto">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-center text-lg">Demo-Zugang</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Benutzername:</strong> spiess<br />
                <strong>Passwort:</strong> strafen2024
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin-login')}
                className="w-full"
              >
                Demo testen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
