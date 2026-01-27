import { Navbar } from "../layout/Navbar";
import { Sidebar } from "../layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText, BarChart } from "lucide-react";

const mockSalesData = [
  { date: "Jan", actual: 400, predicted: 380 },
  { date: "Feb", actual: 450, predicted: 460 },
  { date: "Mar", actual: 500, predicted: 520 },
  { date: "Apr", actual: 550, predicted: 540 },
];

const mockBasketData = [
  { productA: "Milk", productB: "Bread", confidence: "85%" },
  { productA: "Eggs", productB: "Butter", confidence: "78%" },
  { productA: "Cereal", productB: "Milk", confidence: "90%" },
];

export default function Reports() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 lg:ml-72">
        <Navbar />
        
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" /> Forecast Reports
        </h1>
        
        {/* Market Basket Analysis Report */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" /> Market Basket Analysis
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product A</TableHead>
                  <TableHead>Product B</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBasketData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productA}</TableCell>
                    <TableCell>{item.productB}</TableCell>
                    <TableCell>{item.confidence}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button className="mt-4 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Report
            </Button>
          </CardContent>
        </Card>
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" /> Model Performance Metrics
            </h2>
            <p><strong>RMSE:</strong> 0.54</p>
            <p><strong>MAE:</strong> 0.42</p>
            <p><strong>Max Confidence:</strong> 92%</p>
            <Button className="mt-4 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Report
            </Button>
          </CardContent>
        </Card>
        {/* Sales Forecast Report */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" /> Sales Forecasting
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockSalesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Sales" />
                <Line type="monotone" dataKey="predicted" stroke="#82ca9d" name="Predicted Sales" />
              </LineChart>
            </ResponsiveContainer>
            <Button className="mt-4 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Report
            </Button>
          </CardContent>
        </Card>

        {/* Model Performance Metrics */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" /> Model Performance Metrics
            </h2>
            <p><strong>RMSE:</strong> 0.54</p>
            <p><strong>MAE:</strong> 0.42</p>
            <p><strong>Max Confidence:</strong> 92%</p>
            <Button className="mt-4 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
