import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import CVViewer from "@/components/CVViewer";

interface Company {
  name: string;
  position: string;
  location: string;
  description: string;
  coordinates: [number, number];
}

interface CVData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary: string;
  education: Array<{ degree: string; institution: string; year: string }>;
  experience: Array<{ title: string; company: string; period: string; description: string }>;
  skills: string[];
}

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const messages = location.state?.messages || [];
  const importedCvData = location.state?.cvData;
  const importedCompanies = location.state?.companies;

  useEffect(() => {
    const generateMatches = async () => {
      // If CV and companies were imported, use them directly
      if (importedCvData && importedCompanies) {
        setCompanies(importedCompanies);
        setCvData(importedCvData);
        setIsLoading(false);
        return;
      }

      if (!messages.length) {
        navigate("/chat");
        return;
      }

      try {
        // Generate matches and CV in parallel
        const [matchesResponse, cvResponse] = await Promise.all([
          supabase.functions.invoke("generate-matches", { body: { messages } }),
          supabase.functions.invoke("generate-cv", { body: { messages } })
        ]);

        if (matchesResponse.error) {
          if (matchesResponse.error.message?.includes("429")) {
            toast.error("Too many requests. Please wait a moment and try again.");
          } else if (matchesResponse.error.message?.includes("402")) {
            toast.error("Service limit reached. Please contact support.");
          } else {
            throw matchesResponse.error;
          }
          return;
        }

        if (cvResponse.error) {
          console.error("CV generation error:", cvResponse.error);
          toast.error("Failed to generate CV");
        }

        setCompanies(matchesResponse.data.companies || []);
        setCvData(cvResponse.data.cv || null);
      } catch (error) {
        console.error("Error generating matches:", error);
        toast.error("Failed to generate job matches. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    generateMatches();
  }, [messages, navigate, importedCvData, importedCompanies]);

  useEffect(() => {
    if (!mapContainer.current || companies.length === 0) return;

    const MAPBOX_TOKEN = "pk.eyJ1IjoiamF5YmlyZDAtMCIsImEiOiJjbWkwN3gxNXMwcjczMmtzZm90YTR3MmsxIn0.shSGbC47Cncskh3-97e-yA";
    
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: companies[0].coordinates,
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each company
    companies.forEach((company) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "hsl(var(--primary))";
      el.style.border = "3px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="padding: 8px; cursor: pointer;" class="popup-content">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: hsl(var(--foreground));">${company.name}</h3>
          <p style="margin: 0; font-size: 12px; color: hsl(var(--muted-foreground));">${company.position}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(company.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        navigate("/job-details", { state: { company, messages, companies, cvData } });
      });

      markers.current.push(marker);
    });

      return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [companies, navigate]);

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
          <div className="w-10" />
        </div>
      </header>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-73px)]">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Info Banner */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-card/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-large border border-border">
          <p className="text-sm font-medium">
            📍 {companies.length} job matches found - Click pins to see details
          </p>
        </div>

        {/* CV Viewer */}
        {cvData && <CVViewer cvData={cvData} />}
      </div>
    </div>
  );
};

export default Map;
