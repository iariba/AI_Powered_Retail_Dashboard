import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


export default function acquisitionCost(){
    return(
        <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: 'Jan', cost: 30 },
                  { month: 'Feb', cost: 28 },
                  { month: 'Mar', cost: 25 },
                  { month: 'Apr', cost: 22 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#5cd95b" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
}