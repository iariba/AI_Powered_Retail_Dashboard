import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { updateInventory } from "../api/updateStock";

interface InventoryData {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
}
interface InventoryOverviewProps {
  data?: InventoryData;
}

export function InventoryOverview({ data }: InventoryOverviewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [stockLevel, setStockLevel] = useState('');

  const totalProducts = data?.totalProducts ?? 0;
  const lowStock = data?.lowStock ?? 0;
  const outOfStock = data?.outOfStock ?? 0;

  const handleUpdateInventory = async () => {
    if (!productName || !stockLevel) return;
  
    try {
      await updateInventory(productName, Number(stockLevel));
      setIsDialogOpen(false);
      setIsSuccessDialogOpen(true);
      setStockLevel('');
      setProductName('');
    } catch (error) {
      setIsDialogOpen(false);
      setIsErrorDialogOpen(true);
    }
  };
  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ">
        <CardTitle>Inventory Overview</CardTitle>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Update Inventory
        </Button>
      </CardHeader>

      <CardContent className="px-2 pb-3">
  <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-3">
    <div className="flex flex-col justify-between h-full p-2">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Stock Items</p>
      <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{totalProducts}</p>
    </div>
    <div className="flex flex-col justify-between h-full p-2">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Low Stock Items</p>
      <p className="text-xl sm:text-2xl font-bold text-yellow-500 mt-1">{lowStock}</p>
    </div>
    <div className="flex flex-col justify-between h-full p-2">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Out of Stock</p>
      <p className="text-xl sm:text-2xl font-bold text-red-500 mt-1">{outOfStock}</p>
    </div>
  </div>
</CardContent>

      {/* Inventory Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="mb-2"
          />

          <Input
            placeholder="New Stock Level"
            type="number"
            value={stockLevel}
            onChange={(e) => setStockLevel(e.target.value)}
          />

          <Button onClick={handleUpdateInventory} className="w-full mt-2">
            Update
          </Button>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventory Updated</DialogTitle>
          </DialogHeader>
          <p className="text-center text-green-600">
            The inventory has been successfully updated!
          </p>
          <Button className="w-full" onClick={() => setIsSuccessDialogOpen(false)}>
            OK
          </Button>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Failed</DialogTitle>
          </DialogHeader>
          <p className="text-center text-red-600">
            There was an error updating the inventory. Please try again.
          </p>
          <Button className="w-full" onClick={() => setIsErrorDialogOpen(false)}>
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
