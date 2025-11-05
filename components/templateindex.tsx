import React, { useMemo } from "react";
import TemplatePreview from "../components/templatepreview";
import { dummyData } from "../lib/dummy";
import { getAllTemplates, renderTemplate } from "../lib/templateRegistry";
import { preprocessResume } from "../lib/resumePreprocess";

type Props = {
  selectedTemplate: string | null;
  onSelect: (id: string) => void;
};

export default function TemplatesIndex({ selectedTemplate, onSelect }: Props) {
  const templates = getAllTemplates();
  
  // Preprocess dummy data once for consistent template previews
  const processedDummyData = useMemo(() => {
    try {
      return preprocessResume(dummyData);
    } catch (error) {
      console.warn('Failed to preprocess dummy data, using original:', error);
      return dummyData;
    }
  }, []);

  return (
    <div className="flex justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl">
        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
        {templates.map((template) => (
          <TemplatePreview
            key={template.id}
            id={template.id}
            title={template.name}
            description={template.description}
            features={template.features}
            category={template.category}
            selected={selectedTemplate === template.id}
            onSelect={onSelect}
          >
              {renderTemplate(template.id, processedDummyData, 'preview')}
          </TemplatePreview>
        ))}
        </div>
      </div>
    </div>
  );
}

