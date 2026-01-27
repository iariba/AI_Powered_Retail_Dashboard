import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';

interface LeadBreakdownData {
  lead: number;
  qualified: number;
  converted: number;
}

interface LeadBreakdownProps {
  leadBreakdown?: LeadBreakdownData;
}

const COLORS = ['#5cd95b', '#abff91', '#1a5654'];

export function LeadBreakdown({ leadBreakdown}: LeadBreakdownProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  console.log(isSmallScreen)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1025);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const conversionData = [
    { name: 'Leads', value: leadBreakdown?.lead ?? 0 },
    { name: 'Qualified', value: leadBreakdown?.qualified ?? 0 },
    { name: 'Converted', value: leadBreakdown?.converted ?? 0 }
  ];
  if (!leadBreakdown || (leadBreakdown.lead === 0 && leadBreakdown.qualified === 0 && leadBreakdown.converted === 0)) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">No lead data available</p>
      </Card>
    );
  }
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Lead Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[305px] xs:h-[240px] xs:justify-between">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className='mt-0'>
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

          <div className="flex justify-center gap-4 text-sm mb-">
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
  );
}
