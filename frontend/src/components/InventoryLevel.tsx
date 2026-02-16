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

interface InventoryLevelProps {
  data: RawInventoryData[];
}

export function InventoryLevel({ data }: InventoryLevelProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [ismedium, setIsMedium] = useState(false);
  const [isxl, setIsxl] = useState(false);

useEffect(() => {
  const check = () => {setIsMedium(window.innerWidth >= 750);
  setIsxl(window.innerWidth >= 1536);
  }
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);


  useEffect(() => {
    const check = () => setIsSmallScreen(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
        <div className={`${isSmallScreen ? "h-[450px]" : "h-[350px]"} , 2xl:h-[450px]`}>
  
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            className=''
    data={formattedData}
    margin={{ top: 10, right: 5, left: 5, bottom: isxl ? 40 : 30 }}
  layout={ismedium ? "horizontal" : "vertical"}

  >
    <CartesianGrid strokeDasharray="3 3" />

   {isxl ? (
  <>
    <XAxis
      dataKey="productName"
      angle={-45}
      textAnchor="end"
      interval={0}
      height={70}
      tick={{ fontSize: 12 }}
    />
    <YAxis
      domain={[0, Math.max(...formattedData.map(d => d.stockQuantity)) + 10]}
      tick={{ fontSize: 12 }}
    />
  </>
) : ismedium ? (
  <>
    <XAxis
      dataKey="productName"
      tick={false}
      axisLine={false}
      tickLine={false}
      height={10}
    />
    <YAxis
      domain={[0, Math.max(...formattedData.map(d => d.stockQuantity)) + 10]}
      width={25}
      style={{ fontSize: window.innerWidth >= 1536 ? "14px" : "12px" }}
    />
  </>
) : (
  <>
    <XAxis type="number" style={{ fontSize: "11px" }} />
    <YAxis
      type="category"
      dataKey="productName"
      width={120}
      style={{ fontSize: "12px" }}
    />
  </>
)}





   <Tooltip
  wrapperStyle={{
    fontSize: window.innerWidth >= 1536 ? "15px" : "13px"
  }}
  formatter={(value: number) => `${value} units`}
/>

    <Bar
      dataKey="stockQuantity"
      
      fill="#1a5654"
      radius={[4, 4, 0, 0]}
      barSize={isxl ? 60 : 40}

    />
  </BarChart>

</ResponsiveContainer>
</div>
    
        </CardContent>
      </Card>
    </div>
  );
}
