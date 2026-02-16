import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LeadTimeData {
  product_name: string;
  avg_conversion_time_days: number;
}

interface LeadTimeProps {
  data?: LeadTimeData[];
}

export default function LeadTime({ data = [] }: LeadTimeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Time Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 2xl:space-y-6">
          {data.map((product) => {
            const avgDays = product.avg_conversion_time_days || 0;
            return (
              <div key={product.product_name} className="space-y-1">
                <div className="flex justify-between text-sm 2xl:text-base">
                  <span>{product.product_name}</span>
                  <span>{avgDays.toFixed(2)} Days</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(avgDays, 100) / 10}%`,
                      backgroundColor: '#5cd95b'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
