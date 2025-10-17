import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Users,
  Share2,
  Edit3,
  Sparkle,
  LogOut,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Presentation } from "../types";

const FEATURES = [
  {
    title: "Real-Time Collaboration",
    description:
      "Work together with your team in real-time. See changes as they happen with live cursors and presence.",
    icon: Users,
  },
  {
    title: "Easy Sharing",
    description:
      "Share your entire presentation or individual slides with anyone. Perfect for focused collaboration.",
    icon: Share2,
  },
  {
    title: "Rich Text Editing",
    description:
      "Powerful text editing with formatting options. Undo/redo is scoped to your changes only.",
    icon: Edit3,
  },
];
export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [presentations, setPresentations] = useState<Presentation[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPresentations();
    }
  }, [isAuthenticated]);

  const loadPresentations = async () => {
    try {
      const data = await api.getUserPresentations();
      setPresentations(data);
    } catch (error) {
      console.error("Error loading presentations:", error);
    }
  };

  const createNewPresentation = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const presentation = await api.createPresentation(
        "Untitled Presentation"
      );
      toast.success("Presentation created successfully");
      navigate(`/presentation/${presentation.id}`);
    } catch (error: any) {
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation", {
        description: error.message || "Please try again later.",
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Odyssey</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.name}
                  </span>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate("/login")} variant="outline">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/register")}>Sign Up</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {isAuthenticated ? (
          // Authenticated User View - Show Presentations
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  My Presentations
                </h1>
                <p className="text-muted-foreground">
                  Create and manage your presentations
                </p>
              </div>
              <Button
                onClick={createNewPresentation}
                disabled={loading}
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "New Presentation"}
              </Button>
            </div>

            {presentations.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No presentations yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first presentation to get started
                </p>
                <Button onClick={createNewPresentation} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Presentation
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentations.map((presentation) => (
                  <Card
                    key={presentation.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/presentation/${presentation.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="line-clamp-1">
                        {presentation.title}
                      </CardTitle>
                      <CardDescription>
                        {presentation.slides.length} slide
                        {presentation.slides.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Updated{" "}
                        {new Date(presentation.updatedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Guest View - Landing Page
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <div className="flex items-center justify-center mb-6">
                <FileText
                  className="w-20 h-20 text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <h1 className="text-6xl font-bold text-foreground mb-4">
                Welcome to <span className="text-primary">Odyssey</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                A beautiful, collaborative slide editor that brings your team
                together in real-time. Create, share, and collaborate
                seamlessly.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button onClick={() => navigate("/register")} size="lg">
                  <Sparkle className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  size="lg"
                >
                  Sign In
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
