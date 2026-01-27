import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

interface DownloadCardProps {
  forecastType: string;
  reportUrl: string;
  fallbackText?: string;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({ forecastType, reportUrl, fallbackText }) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {forecastType} Report
          </h2>

          {reportUrl && (
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>

        <div className="w-full h-[600px] border rounded flex items-center justify-center">
          {reportUrl ? (
            <iframe
              src={reportUrl}
              title={`${forecastType} PDF`}
              className="w-full h-full"
              loading="lazy"
            />
          ) : (
            <p className="text-muted-foreground">{fallbackText || "No report available."}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
