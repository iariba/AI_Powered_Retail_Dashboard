import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList
} from 'recharts';
import { useState, useEffect } from 'react';
interface SocialEngagementData {
  platform: string;
  total_engagement_score: string;
  scaled_engagement_score: string;
}

interface LeadBreakdownData {
  lead: number;
  qualified: number;
  converted: number;
}

interface CustomerInsightsProps {
  socialEngagement?: SocialEngagementData[];
  leadBreakdown?: LeadBreakdownData[];
}

const COLORS = ['#5cd95b', '#abff91', '#1a5654'];

export function CustomerInsights({ socialEngagement = [], leadBreakdown = [] }: CustomerInsightsProps) {
  const conversionData = [
    { name: 'Leads', value: leadBreakdown[0]?.lead ?? 0 },
    { name: 'Qualified', value: leadBreakdown[0]?.qualified ?? 0 },
    { name: 'Converted', value: leadBreakdown[0]?.converted ?? 0 }
  ];

  const platformEngagementData = socialEngagement.map((platform) => ({
    platform: platform.platform,
    engagement: parseInt(platform.total_engagement_score || '0')
  }));
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1025); // Tailwind's sm breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2 items-stretch">

      {/* Lead Conversion Funnel */}
      <Card className="w-full max-w-full">


        <CardHeader>
          <CardTitle>Lead Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="w-full h-[300px]">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-sm mt-2">
              {conversionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 xs:mb-9">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Engagement */}
      <Card className="h-full w-full">

      <CardHeader>
        <CardTitle>Social Media Engagement</CardTitle>
      </CardHeader>
      <CardContent>
      <div className="h-[300px] mb-5">

          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={platformEngagementData}
              margin={{ top: 20, right: 30, left: isSmallScreen ? 0 : 0, bottom: 5 }}
              
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" tick={isSmallScreen ? false : undefined} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="engagement" fill="#1a5654">
                {isSmallScreen && (
                  <LabelList dataKey="platform" position="insideTop" fill="white" fontSize={10} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
