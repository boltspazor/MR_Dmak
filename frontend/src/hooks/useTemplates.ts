import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Template } from '../types';

export interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  loadTemplates: () => Promise<void>;
  createTemplate: (templateData: any) => Promise<void>;
  updateTemplate: (id: string, templateData: any) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (template: Template) => Template;
  exportTemplateAsPNG: (template: Template) => Promise<void>;
  exportTemplatesToCSV: () => void;
  exportTemplatesToPDF: () => void;
}

export const useTemplates = (): UseTemplatesReturn => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/meta-templates/all');
      const templatesData = response.data.data || response.data || [];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fallback to old API if Meta templates API fails
      try {
        const fallbackResponse = await api.get('/templates');
        const fallbackData = fallbackResponse.data.data || fallbackResponse.data || [];
        setTemplates(fallbackData);
      } catch (fallbackError) {
        console.error('Failed to load templates from fallback:', fallbackError);
        setTemplates([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (templateData: any) => {
    await api.post('/templates', templateData);
    await loadTemplates();
  }, [loadTemplates]);

  const updateTemplate = useCallback(async (id: string, templateData: any) => {
    await api.put(`/templates/${id}`, templateData);
    await loadTemplates();
  }, [loadTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    await api.delete(`/templates/${id}`);
    await loadTemplates();
  }, [loadTemplates]);

  const duplicateTemplate = useCallback((template: Template): Template => {
    return {
      ...template,
      name: `${template.name} (Copy)`,
      _id: '', // Will be set by backend
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, []);

  const exportTemplateAsPNG = useCallback(async (template: Template) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      let yPosition = 50;

      // Add template name
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(template.name, canvas.width / 2, yPosition);
      yPosition += 40;

      // Function to draw content and download
      const drawContentAndDownload = () => {
        // Add content
        ctx.fillStyle = '#374151';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const lines = template.content.split('\n');
        lines.forEach((line, index) => {
          if (yPosition + (index + 1) * 20 < canvas.height - 100) {
            ctx.fillText(line, 50, yPosition + (index + 1) * 20);
          }
        });
        yPosition += lines.length * 20 + 20;

        // Add footer image if exists
        if (template.footerImageUrl) {
          const footerImg = new Image();
          footerImg.crossOrigin = 'anonymous';
          footerImg.onload = () => {
            const footerHeight = 100;
            const footerWidth = Math.min(300, (footerImg.width * footerHeight) / footerImg.height);
            const footerX = (canvas.width - footerWidth) / 2;
            ctx.drawImage(footerImg, footerX, yPosition, footerWidth, footerHeight);

            // Download the image
            const link = document.createElement('a');
            link.download = `${template.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL();
            link.click();
          };
          footerImg.onerror = () => {
            // If footer image fails to load, download without it
            const link = document.createElement('a');
            link.download = `${template.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL();
            link.click();
          };
          footerImg.src = template.footerImageUrl;
        } else {
          // Download without footer image
          const link = document.createElement('a');
          link.download = `${template.name.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      };

      // Add header image if exists
      if (template.imageUrl) {
        const headerImg = new Image();
        headerImg.crossOrigin = 'anonymous';
        headerImg.onload = () => {
          const imgHeight = 200;
          const imgWidth = Math.min(400, (headerImg.width * imgHeight) / headerImg.height);
          const x = (canvas.width - imgWidth) / 2;
          ctx.drawImage(headerImg, x, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
          drawContentAndDownload();
        };
        headerImg.onerror = () => {
          // If header image fails to load, continue without it
          drawContentAndDownload();
        };
        headerImg.src = template.imageUrl;
      } else {
        // No header image, just add content
        drawContentAndDownload();
      }
    } catch (error) {
      console.error('Error exporting template as PNG:', error);
    }
  }, []);

  const exportTemplatesToCSV = useCallback(() => {
    const csvContent = [
      'Name,Type,Parameters,Content,Header Image,Footer Image,Created At',
      ...templates.map(template =>
        `${template.name},${template.type},${template.parameters.join(';')},${template.content.replace(/,/g, ';')},${template.imageFileName || ''},${template.footerImageFileName || ''},${new Date(template.createdAt).toLocaleDateString()}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }, [templates]);

  const exportTemplatesToPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableContent = `
        <html>
          <head>
            <title>Templates Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <h1>Templates Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parameters</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                ${templates.map(template => `
                  <tr>
                    <td>${template.name}</td>
                    <td>${template.type}</td>
                    <td>${template.parameters.join(', ')}</td>
                    <td>${template.content.substring(0, 100)}...</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(tableContent);
      printWindow.document.close();
      printWindow.print();
    }
  }, [templates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplateAsPNG,
    exportTemplatesToCSV,
    exportTemplatesToPDF
  };
};
