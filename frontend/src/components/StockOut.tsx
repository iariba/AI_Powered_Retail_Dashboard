import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface StockOutProduct {
  product_name: string;
  stockout_percentage: string; // comes as string from backend
}

interface StockOutProps {
  data?: StockOutProduct[]; // now optional
}

export default function StockOut({ data = [] }: StockOutProps) {
  return (
    <Card className="h-[100%]">
      <CardHeader>
        <CardTitle>Stockout Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length > 0 ? (
            data.map((product) => (
              <div key={product.product_name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{product.product_name}</span>
                  <span>{parseFloat(product.stockout_percentage).toFixed(1)}%</span>
                </div>
                <Progress value={parseFloat(product.stockout_percentage)} className="h-2" />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No stockout data available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
