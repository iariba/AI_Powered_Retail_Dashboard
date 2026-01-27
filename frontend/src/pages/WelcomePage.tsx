import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Network, Boxes } from "lucide-react"; // Updated icons

const WelcomePage = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#001F3F] text-white px-4 sm:px-6">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/bgg.webp')" }}
      ></div>
      <div className="absolute inset-0 bg-[#001F3F] opacity-80"></div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative text-center max-w-3xl w-full"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Welcome to AI-Driven Retail Dashboard</h1>
        <p className="text-base sm:text-lg font-medium opacity-80 mb-6 sm:mb-8">
        AI-powered demand segmentation, customer insights, and product combination optimization for smarter retail decisions
        </p>

        {/* Feature Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 bg-white bg-opacity-10 rounded-lg p-4 sm:p-6">
          <FeatureCard icon={Boxes} title="Manage Inventory" />
          <FeatureCard icon={Network} title="Demand Analysis" />
          <FeatureCard icon={BarChart} title="Market Basket Insights" />
        </div>

        {/* Get Started Button */}
        <Link
          to="/login"
          className="inline-block bg-white text-[#001F3F] px-5 py-3 rounded-full text-base sm:text-lg font-semibold shadow-lg mt-6 sm:mt-8 hover:bg-gray-400 transition duration-300"
        >
          Get Started
        </Link>
      </motion.div>
    </div>
  );
};

// Feature Card Component (Mobile-Responsive)
const FeatureCard = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex flex-col items-center space-y-1 sm:space-y-2 p-3 sm:p-4 rounded-lg bg-white bg-opacity-20"
  >
    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
    <p className="text-sm sm:text-lg font-semibold">{title}</p>
  </motion.div>
);

export default WelcomePage;
