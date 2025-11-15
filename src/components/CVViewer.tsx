import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CVViewerProps {
  cvData: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary: string;
    education: Array<{ degree: string; institution: string; year: string }>;
    experience: Array<{ title: string; company: string; period: string; description: string }>;
    skills: string[];
  };
}

const CVViewer = ({ cvData }: CVViewerProps) => {
  const [open, setOpen] = useState(false);

  const handleDownload = () => {
    const cvText = `
${cvData.name}
${cvData.email} | ${cvData.phone || ''} | ${cvData.location || ''}

PROFESSIONAL SUMMARY
${cvData.summary}

EDUCATION
${cvData.education.map(edu => `${edu.degree} - ${edu.institution} (${edu.year})`).join('\n')}

EXPERIENCE
${cvData.experience.map(exp => `${exp.title} at ${exp.company} (${exp.period})\n${exp.description}`).join('\n\n')}

SKILLS
${cvData.skills.join(', ')}
    `.trim();

    const blob = new Blob([cvText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvData.name.replace(/\s+/g, '_')}_CV.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-large bg-primary hover:bg-primary/90 z-20"
      >
        <FileText className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Your Generated CV
              <Button onClick={handleDownload} size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{cvData.name}</h2>
              <p className="text-sm text-muted-foreground">
                {cvData.email} {cvData.phone && `| ${cvData.phone}`} {cvData.location && `| ${cvData.location}`}
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Professional Summary</h3>
                <p className="text-sm">{cvData.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Education</h3>
                <div className="space-y-3">
                  {cvData.education.map((edu, idx) => (
                    <div key={idx}>
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground">
                        {edu.institution} - {edu.year}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Experience</h3>
                <div className="space-y-4">
                  {cvData.experience.map((exp, idx) => (
                    <div key={idx}>
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-sm text-muted-foreground">{exp.company} - {exp.period}</p>
                      <p className="text-sm mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CVViewer;
