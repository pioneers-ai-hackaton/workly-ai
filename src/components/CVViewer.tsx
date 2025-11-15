import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Edit2, Save, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";

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

const CVViewer = ({ cvData: initialCvData }: CVViewerProps) => {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cvData, setCvData] = useState(initialCvData);

  useEffect(() => {
    setCvData(initialCvData);
  }, [initialCvData]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Harvard CV Template Style
    // Header with name
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(cvData.name.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Contact information (centered)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const contactLine = [cvData.email, cvData.phone, cvData.location].filter(Boolean).join(" • ");
    doc.text(contactLine, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Summary Section
    if (cvData.summary) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", margin, yPosition);
      yPosition += 6;
      
      yPosition = addWrappedText(cvData.summary, margin, yPosition, contentWidth, 10);
      yPosition += 8;
    }

    // Education Section
    if (cvData.education.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("EDUCATION", margin, yPosition);
      yPosition += 6;

      cvData.education.forEach((edu) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(edu.degree, margin, yPosition);
        
        doc.setFont("helvetica", "normal");
        doc.text(edu.year, pageWidth - margin, yPosition, { align: "right" });
        yPosition += 5;
        
        doc.setFont("helvetica", "italic");
        doc.text(edu.institution, margin, yPosition);
        yPosition += 8;
      });
      yPosition += 4;
    }

    // Experience Section
    if (cvData.experience.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("EXPERIENCE", margin, yPosition);
      yPosition += 6;

      cvData.experience.forEach((exp, index) => {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(exp.title, margin, yPosition);
        
        doc.setFont("helvetica", "normal");
        doc.text(exp.period, pageWidth - margin, yPosition, { align: "right" });
        yPosition += 5;
        
        doc.setFont("helvetica", "italic");
        doc.text(exp.company, margin, yPosition);
        yPosition += 5;
        
        doc.setFont("helvetica", "normal");
        yPosition = addWrappedText(exp.description, margin, yPosition, contentWidth, 9);
        
        if (index < cvData.experience.length - 1) {
          yPosition += 6;
        }
      });
      yPosition += 4;
    }

    // Skills Section
    if (cvData.skills.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SKILLS", margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const skillsText = cvData.skills.join(" • ");
      yPosition = addWrappedText(skillsText, margin, yPosition, contentWidth, 10);
    }

    // Save the PDF
    doc.save(`${cvData.name.replace(/\s+/g, '_')}_CV.pdf`);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 shadow-elegant hover:shadow-glow z-20"
      >
        <FileText className="mr-2 h-5 w-5" />
        View Your CV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-12">
            <DialogTitle className="text-2xl">Your Generated CV</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 justify-end -mt-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>

          <div className="space-y-6 mt-4">
            {/* Personal Information */}
            <div className="text-center border-b pb-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={cvData.name}
                    onChange={(e) => setCvData({ ...cvData, name: e.target.value })}
                    className="text-center text-2xl font-bold"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                      placeholder="Email"
                    />
                    <Input
                      value={cvData.phone || ""}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                      placeholder="Phone"
                    />
                    <Input
                      value={cvData.location || ""}
                      onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                      placeholder="Location"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-2">{cvData.name}</h2>
                  <div className="text-sm text-muted-foreground space-x-3">
                    <span>{cvData.email}</span>
                    {cvData.phone && <span>• {cvData.phone}</span>}
                    {cvData.location && <span>• {cvData.location}</span>}
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-2 uppercase tracking-wide">Summary</h3>
              {isEditing ? (
                <Textarea
                  value={cvData.summary}
                  onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                  rows={4}
                />
              ) : (
                <p className="text-sm leading-relaxed">{cvData.summary}</p>
              )}
            </div>

            {/* Education */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold uppercase tracking-wide">Education</h3>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCvData({
                      ...cvData,
                      education: [...cvData.education, { degree: "", institution: "", year: "" }]
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Education
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {cvData.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4 relative">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <Input
                            value={edu.degree}
                            onChange={(e) => {
                              const newEdu = [...cvData.education];
                              newEdu[index] = { ...edu, degree: e.target.value };
                              setCvData({ ...cvData, education: newEdu });
                            }}
                            placeholder="Degree"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newEdu = cvData.education.filter((_, i) => i !== index);
                              setCvData({ ...cvData, education: newEdu });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          value={edu.institution}
                          onChange={(e) => {
                            const newEdu = [...cvData.education];
                            newEdu[index] = { ...edu, institution: e.target.value };
                            setCvData({ ...cvData, education: newEdu });
                          }}
                          placeholder="Institution"
                        />
                        <Input
                          value={edu.year}
                          onChange={(e) => {
                            const newEdu = [...cvData.education];
                            newEdu[index] = { ...edu, year: e.target.value };
                            setCvData({ ...cvData, education: newEdu });
                          }}
                          placeholder="Year"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold">{edu.degree}</p>
                          <span className="text-sm text-muted-foreground">{edu.year}</span>
                        </div>
                        <p className="text-sm italic text-muted-foreground">{edu.institution}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold uppercase tracking-wide">Experience</h3>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCvData({
                      ...cvData,
                      experience: [...cvData.experience, { title: "", company: "", period: "", description: "" }]
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {cvData.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4 relative">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <Input
                            value={exp.title}
                            onChange={(e) => {
                              const newExp = [...cvData.experience];
                              newExp[index] = { ...exp, title: e.target.value };
                              setCvData({ ...cvData, experience: newExp });
                            }}
                            placeholder="Job Title"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newExp = cvData.experience.filter((_, i) => i !== index);
                              setCvData({ ...cvData, experience: newExp });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...cvData.experience];
                            newExp[index] = { ...exp, company: e.target.value };
                            setCvData({ ...cvData, experience: newExp });
                          }}
                          placeholder="Company"
                        />
                        <Input
                          value={exp.period}
                          onChange={(e) => {
                            const newExp = [...cvData.experience];
                            newExp[index] = { ...exp, period: e.target.value };
                            setCvData({ ...cvData, experience: newExp });
                          }}
                          placeholder="Period"
                        />
                        <Textarea
                          value={exp.description}
                          onChange={(e) => {
                            const newExp = [...cvData.experience];
                            newExp[index] = { ...exp, description: e.target.value };
                            setCvData({ ...cvData, experience: newExp });
                          }}
                          placeholder="Description"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold">{exp.title}</p>
                          <span className="text-sm text-muted-foreground">{exp.period}</span>
                        </div>
                        <p className="text-sm italic text-muted-foreground mb-2">{exp.company}</p>
                        <p className="text-sm leading-relaxed">{exp.description}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-lg font-semibold mb-2 uppercase tracking-wide">Skills</h3>
              {isEditing ? (
                <Input
                  value={cvData.skills.join(", ")}
                  onChange={(e) => setCvData({ ...cvData, skills: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="Skill 1, Skill 2, Skill 3"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CVViewer;
