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

  // ✅ Correct mapping
  const platformEngagementData = socialEngagement.map((platform) => ({
    platform: platform.platform,
    engagement: platform.total_score || 0,
  }));

  return (
    <Card className="w-full max-w-full">
      <CardHeader>
        <CardTitle>Social Media Engagement</CardTitle>
      </CardHeader>
      <CardContent>
        {platformEngagementData.length === 0 ? (
          <p className="text-center text-muted-foreground">No engagement data available</p>
        ) : (
          <div className="h-[300px] mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformEngagementData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" tick={isSmallScreen ? false : undefined} />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="engagement"
                  fill="#1a5654"
                  label={
                    isSmallScreen
                      ? ({ x, y, width, height, index }) => {
                          const platform = platformEngagementData[index]?.platform;
                          return (
                            <text
                              x={x + width / 2}
                              y={y + height / 2}
                              transform={`rotate(-90, ${x + width / 2}, ${y + height / 2})`}
                              fill="white"
                              fontSize={12}
                              textAnchor="middle"
                              alignmentBaseline="middle"
                            >
                              {platform}
                            </text>
                          );
                        }
                      : false
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
