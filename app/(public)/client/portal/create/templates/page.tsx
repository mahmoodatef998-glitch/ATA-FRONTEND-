"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/ui/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Zap, Settings, Wrench, Cog } from "lucide-react";

interface Template {
  id: number;
  name: string;
  category: string;
  description: string;
  fields: any;
}

const categoryIcons: Record<string, any> = {
  GENERATOR: Zap,
  ATS: Settings,
  SWITCHGEAR: Settings,
  SPARE_PARTS: Wrench,
  SERVICE: Cog,
};

export default function SelectTemplatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: number) => {
    router.push(`/client/portal/create?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client/portal">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold mb-2">Select Order Type</h1>
          <p className="text-muted-foreground">
            Choose a template to quickly create your request with pre-filled specifications
          </p>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const Icon = categoryIcons[template.category] || FileText;
              
              return (
                <Card
                  key={template.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {/* Custom Order Option */}
            <Card
              className="hover:shadow-lg transition-all cursor-pointer group border-dashed border-2"
              onClick={() => router.push("/client/portal/create")}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="group-hover:text-blue-600 transition-colors">
                  Custom Request
                </CardTitle>
                <CardDescription>
                  Create a custom order without using a template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Create Custom Order
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}




