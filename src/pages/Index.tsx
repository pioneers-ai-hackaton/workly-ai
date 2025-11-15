import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, MapPin, Sparkles, Briefcase, Target, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Workly</h2>
            <p className="text-sm text-muted-foreground">Your career, simplified.</p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-in fade-in slide-in-from-top duration-500">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Job Matching</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom duration-700">
            Find Your Dream Job with AI
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            Tell us about yourself, your skills, and what you're looking for. Our AI assistant will match you with perfect opportunities in your area.
          </p>

          <Button
            onClick={() => navigate("/chat")}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 shadow-large animate-in fade-in slide-in-from-bottom duration-700 delay-200"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Start Your Job Search
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-2xl bg-card shadow-medium hover:shadow-large transition-all animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Conversational AI</h3>
            <p className="text-muted-foreground text-sm">
              Chat naturally with our AI assistant. No forms to fill—just tell us what you're looking for.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card shadow-medium hover:shadow-large transition-all animate-in fade-in slide-in-from-bottom duration-700 delay-400">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
            <p className="text-muted-foreground text-sm">
              AI analyzes your profile and preferences to find companies that perfectly match your skills.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card shadow-medium hover:shadow-large transition-all animate-in fade-in slide-in-from-bottom duration-700 delay-500">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Location-Based Results</h3>
            <p className="text-muted-foreground text-sm">
              See opportunities on a map based on your preferred work location and commute preferences.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start animate-in fade-in slide-in-from-left duration-700">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Share Your Background</h3>
                <p className="text-muted-foreground">
                  Tell the AI about your education, experience, skills, and career goals.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start animate-in fade-in slide-in-from-left duration-700 delay-100">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Define Your Preferences</h3>
                <p className="text-muted-foreground">
                  Specify what kind of role you want, your preferred location, and work environment.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start animate-in fade-in slide-in-from-left duration-700 delay-200">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Get Matched</h3>
                <p className="text-muted-foreground">
                  Our AI generates a CV and finds companies looking for someone just like you.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/chat")}
              size="lg"
              variant="outline"
              className="border-2 border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
