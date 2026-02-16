import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";

interface SocialEngagementData {
  platform: string;
  total_score: number;      
  scaled_score: string;     
}

export function SocialMediaEngagement({
  socialEngagement = [],
}: { socialEngagement?: SocialEngagementData[] }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1025);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Correct mapping
  const platformEngagementData = socialEngagement.map((platform) => ({
    platform: platform.platform,
    engagement: platform.total_score || 0,
  }));

  return (
    <Card className="w-full max-w-full">
      <CardHeader>
        <CardTitle>Social Media Engagement</CardTitle>
      </CardHeader>
      <CardContent >
        {platformEngagementData.length === 0 ? (
          <p className="text-center text-muted-foreground">No engagement data available</p>
        ) : (
          <div className="h-[300px] mb-5 2xl:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
             <BarChart
  data={platformEngagementData}
  layout={isSmallScreen ? "vertical" : "horizontal"}
  margin={{ top: 20, right: 10, left: isSmallScreen ? 10 : 0, bottom: 5 }}
>

                <CartesianGrid strokeDasharray="3 3" />
{isSmallScreen ? (
  <>
    <XAxis
      type="number"
      tickFormatter={(v) =>
        v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
      }
    />
    <YAxis
      type="category"
      dataKey="platform"
      width={90}
    />
  </>
) : (
  <>
    <XAxis
      dataKey="platform"
      tick={{
        fill: window.innerWidth >= 1536 ? "#555" : "#888",
        fontSize: window.innerWidth >= 1536 ? 15 : 13,
      }}
    />
    <YAxis
      tickFormatter={(v) =>
        v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
      }
    />
  </>
)}


                <Tooltip
  formatter={(v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v
  }
/>

                <Bar
                  dataKey="engagement"
                  fill="#1a5654"
                  barSize={isSmallScreen ? 30 : window.innerWidth < 1280 ? 40 : 70}
                  
                  
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
