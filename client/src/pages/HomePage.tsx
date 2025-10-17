import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, Share2, Edit3, Sparkle } from "lucide-react";
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

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createNewPresentation = async () => {
    setLoading(true);
    try {
      const presentation = await api.createPresentation(
        "Untitled Presentation"
      );
      navigate(`/presentation/${presentation.id}`);
    } catch (error) {
      console.error("Error creating presentation:", error);
      toast.error("Failed to create presentation", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
      toast.success("Presentation created successfully", {
        description: "You can now start editing your presentation.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-center mb-6">
              <FileText className="w-20 h-20 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-6xl font-bold text-foreground mb-4">
              Welcome to <span className="text-primary">Odyssey</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A beautiful, collaborative slide editor that brings your team
              together in real-time. Create, share, and collaborate seamlessly.
            </p>
            <Button
              onClick={createNewPresentation}
              disabled={loading}
              className="mx-auto h-auto flex items-center gap-2"
            >
              <Sparkle className="w-4 h-4" />
              {loading ? "Creating..." : "Create New Presentation"}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  Real-Time Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Work together with your team in real-time. See changes as they
                  happen with live cursors and presence.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share your entire presentation or individual slides with
                  anyone. Perfect for focused collaboration.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Edit3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Rich Text Editing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Powerful text editing with formatting options. Undo/redo is
                  scoped to your changes only.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
