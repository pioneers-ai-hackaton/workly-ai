import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Briefcase, Building2, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface CompanyDetails {
  name: string;
  position: string;
  location: string;
  description: string;
  coordinates: [number, number];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const JobDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const company = location.state?.company as CompanyDetails;
  const messages = location.state?.messages as Message[];
  const companies = location.state?.companies;
  const cvData = location.state?.cvData;

  if (!company) {
    navigate("/map");
    return null;
  }

  const handleApply = () => {
    toast.success("CV sent successfully! The company will review your application.");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/map", { state: { messages, companies, cvData } })}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Job Details</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-large">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2 flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  {company.name}
                </CardTitle>
                <CardDescription className="text-xl font-semibold text-foreground mt-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {company.position}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{company.location}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">About this Role</h3>
              <p className="text-foreground/90 leading-relaxed">{company.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Key Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>Lead and contribute to innovative projects</li>
                <li>Collaborate with cross-functional teams</li>
                <li>Drive continuous improvement and best practices</li>
                <li>Mentor and support team members</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">What We Offer</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground/90">
                <li>Competitive salary and benefits package</li>
                <li>Flexible working arrangements</li>
                <li>Professional development opportunities</li>
                <li>Modern office facilities</li>
                <li>Health and wellness programs</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleApply}
                className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6"
              >
                <Send className="mr-2 h-5 w-5" />
                Send CV & Apply for this Position
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetails;
