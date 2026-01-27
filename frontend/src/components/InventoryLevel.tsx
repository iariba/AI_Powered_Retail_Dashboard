import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useState, useEffect } from 'react';
interface RawInventoryData {
  product_name: string;
  stock_quantity: number;
}

interface InventoryData {
  productName: string;
  stockQuantity: number;
}
//const mock = [
  //{ product_name: "Mock Product A", stock_quantity: 5 },
  //{ product_name: "Mock Product B", stock_quantity: 3 },
//];
interface InventoryLevelProps {
  data: RawInventoryData[];
}

export function InventoryLevel({ data }: InventoryLevelProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const check = () => setIsSmallScreen(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
 // data=mock
  if (!data || data.length === 0) {
    return <div>No inventory data available</div>;
  }
  
  const formattedData: InventoryData[] = data.map(item => ({
    productName: item.product_name,
    stockQuantity: item.stock_quantity
  }));

  return (
    <div className='hidden md:block'>
      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle>Top Inventory Levels</CardTitle>
        </CardHeader>
        <CardContent>
        <div className={`${isSmallScreen ? "h-[450px]" : "h-[350px]"} px-2`}>

        <ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={formattedData}
    margin={{ top: 10, right: 30, left: 20, bottom: isSmallScreen ? 30 : 80 }}
    layout={isSmallScreen ? "vertical" : "horizontal"}
  >
    <CartesianGrid strokeDasharray="3 3" />

    {isSmallScreen ? (
  <>
    {/* Remove product names on small screens */}
    <YAxis 
  style={{ fontSize: "12px" }} 
  domain={[0, Math.max(...formattedData.map(d => d.stockQuantity)) + 10]} // ✅ Dynamically set max
/>

    <XAxis
      type="number"
      style={{ fontSize: "11px" }}
    />
  </>
) : (
  <>
    <XAxis
      dataKey="productName"
      angle={-45}
      textAnchor="end"
      interval={0}
      height={60}
      style={{ fontSize: "12px" }}
    />
     <YAxis
      style={{ fontSize: "12px" }}
      domain={[0, Math.max(...formattedData.map(d => d.stockQuantity)) + 10]} // ✅ Numeric axis
    />
  </>
)}


    <Tooltip
      wrapperStyle={{ fontSize: "13px" }}
      formatter={(value: number) => `${value} units`}
    />
    <Bar
      dataKey="stockQuantity"
      fill="#1a5654"
      radius={[4, 4, 0, 0]}
      barSize={isSmallScreen ? 20 : 40}
    />
  </BarChart>
</ResponsiveContainer>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
