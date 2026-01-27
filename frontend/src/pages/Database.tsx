import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Navbar } from "../layout/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { getConnectedInventory, connectInventory, disconnectInventory } from "@/api/inventory";

const InventoryForm = () => {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectedInventory, setConnectedInventory] = useState<any>(null);

  // Fetch connected inventory
  useEffect(() => {
    const fetchConnectedInventory = async () => {
      try {
        const data = await getConnectedInventory();
        setConnectedInventory(data);
      } catch (error) {
        console.error("Error fetching connected inventory", error);
      }
    };
    fetchConnectedInventory();
  }, []);

  // Connect inventory
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await connectInventory(data.inventoryLink);
      setConnectedInventory(response);
      toast.success("Inventory connected successfully!");
      setIsDialogOpen(true);
    } catch (error: any) {
      toast.error(`Connection failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect inventory
  const disconnectInventoryHandler = async () => {
    try {
      await disconnectInventory();
      setConnectedInventory(null);
      reset();
      toast.success("Inventory disconnected successfully!");
    } catch (error: any) {
      toast.error(`Error disconnecting inventory: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-4 sm:p-6 md:p-8 lg:ml-52 xl:ml-72 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 dark:text-white text-center sm:text-left">
          Inventory Connection
        </h1>

        {/* Connected Inventory Section */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-700 dark:text-gray-100">
            Connected Inventory
          </h2>
          <div className="w-full">
            <div className="w-full p-4 border-2 border-dashed rounded-lg bg-background dark:border-gray-600 shadow-sm">
              {connectedInventory ? (
                <div className="flex flex-col  sm:items-center sm:justify-between gap-4">
                  <p className="w-full sm:flex-1 p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-100 break-words text-sm sm:text-base">
                    {connectedInventory.sheetUrl}
                  </p>
                  <Button
                    onClick={disconnectInventoryHandler}
                    variant="ghost"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <FaTrash className="w-4 h-4" /> Disconnect
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm sm:text-base text-center sm:text-left">
                  No inventory connected.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Connection Form */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-700 dark:text-gray-100">
            Connect to Inventory
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full dark:bg-background dark:border dark:border-gray-700"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium dark:text-gray-100 text-sm sm:text-base">
                  Inventory Google Sheet Link
                </label>
                <input
                  {...register("inventoryLink", { required: true })}
                  type="url"
                  disabled={!!connectedInventory}
                  className="block w-full p-2 sm:p-3 bg-background border dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-100 text-sm sm:text-base"
                  placeholder="Paste your Google Sheet link here"
                />
              </div>

              {/* Instructions Paragraph */}
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2 text-center sm:text-left">
                Please upload your Google Sheet link here. The Google Sheet must contain tabs named:{" "}
                <span className="font-semibold">Sales</span>, <span className="font-semibold">Products</span>,{" "}
                <span className="font-semibold">Social Media Metrics</span>,{" "}
                <span className="font-semibold">Suppliers</span>, and <span className="font-semibold">Lead</span>.
              </p>

              <div className="flex justify-center mt-6">
                <Button
                  type="submit"
                  disabled={loading || !!connectedInventory}
                  className="w-full sm:w-auto max-w-xs text-sm sm:text-base"
                >
                  {loading ? "Connecting..." : "Connect Inventory"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Dialog for Connection Confirmation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader className="flex flex-col items-center justify-center">
            <DialogTitle className="text-center">Inventory Connected</DialogTitle>
            <p className="text-center text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              You have successfully connected your inventory.
            </p>
            <Button className="w-full mt-4 text-sm sm:text-base" onClick={() => setIsDialogOpen(false)}>
              OK
            </Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryForm;
