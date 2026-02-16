import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const COLORS = ['#1a5654', '#abff91', '#5cd95b'];

export default function InventoryCostDistribution({
  data
}: {
  data: {
    holdingCosts: number;
    orderingCosts: number;
    shortageCosts: number;
  };
}) {
  return (
    <div>
      <Card className="sm:col-span-2 h-full">
        <CardHeader>
          <CardTitle>Inventory Costs Distribution</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col '>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Holding Costs', value: data.holdingCosts },
                    { name: 'Ordering Costs', value: data.orderingCosts },
                    { name: 'Shortage Costs', value: data.shortageCosts }
                  ]}
                  cx="50%"
                  cy="50%"
               innerRadius={window.innerWidth >= 1536 ? 80 : window.innerWidth >= 640 ? 70 : 50}
outerRadius={window.innerWidth >= 1536 ? 120 : window.innerWidth >= 640 ? 100 : 70}

                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
               <Tooltip
  wrapperStyle={{
    fontSize: window.innerWidth >= 1536 ? "15px" : "13px"
  }}
/>

              </PieChart>
            </ResponsiveContainer>
            </div>
           <div className=" gap-2 p-2 flex flex-wrap justify-center  sm:gap-4 text-sm 2xl:text-base mt-4">

              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                <span>Holding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                <span>Ordering</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[2] }} />
                <span>Shortage</span>
              </div>
            </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
