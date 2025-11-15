import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Company {
  name: string;
  position: string;
  location: string;
  description: string;
}

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messages = location.state?.messages || [];

  useEffect(() => {
    const generateMatches = async () => {
      if (!messages.length) {
        navigate("/chat");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("generate-matches", {
          body: { messages },
        });

        if (error) {
          if (error.message?.includes("429")) {
            toast.error("Too many requests. Please wait a moment and try again.");
          } else if (error.message?.includes("402")) {
            toast.error("Service limit reached. Please contact support.");
          } else {
            throw error;
          }
          return;
        }

        setCompanies(data.companies || []);
      } catch (error) {
        console.error("Error generating matches:", error);
        toast.error("Failed to generate job matches. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    generateMatches();
  }, [messages, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Your Job Matches</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">We found {companies.length} matches for you!</h2>
          <p className="text-muted-foreground">
            Based on your profile and preferences, here are companies looking for talent like you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company, index) => (
            <Card key={index} className="shadow-medium hover:shadow-large transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      {company.name}
                    </CardTitle>
                    <CardDescription className="mt-1 font-medium text-foreground">
                      {company.position}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{company.location}</p>
                <p className="text-sm">{company.description}</p>
                <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90">
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Map;
