import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { User, UserIcon } from 'lucide-react';

interface GenderDistribution {
  male: number;
  female: number;
  others: number;
}

interface ClientAnalysisProps {
  genderDistribution: GenderDistribution;
}

export function ClientAnalysis({ genderDistribution }: ClientAnalysisProps) {
  // Calculate out of 10 based on the percentage values from backend
  const maleClients = Math.round((genderDistribution.male / 100) * 10);
  const femaleClients = Math.round((genderDistribution.female / 100) * 10);
  const otherClients = 10 - maleClients - femaleClients;

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle>Client Analysis</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row md:items-center gap-6 flex-wrap md:flex-nowrap xl:flex-row-reverse">
        
        {/* Icon row - wraps on small screens */}
        <div className="flex flex-wrap items-center justify-center gap-1 w-full">
          {[...Array(10)].map((_, i) => (
            <User
              key={i}
              className={`w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 ${
                i < maleClients
                  ? 'text-blue-500'
                  : i < maleClients + femaleClients
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}
            />
          ))}
        </div>

        <div className="rounded-lg p-4 2xl:p-6 text-black dark:text-white w-full mx-auto md:mx-0 flex flex-col items-center justify-center 2xl:h-[260px]">


          <div className="flex items-center justify-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 2xl:w-7 2xl:h-7" />
            <span className="2xl:text-lg">On average,</span>

          </div>
          <p className="text-xl font-bold mb-1 2xl:text-2xl">{maleClients} out of 10</p>
         <p className="2xl:text-lg">clients are Male</p>

          <p className="text-xl font-bold mb-1 2xl:text-2xl">{femaleClients} out of 10</p>
          <p className="2xl:text-lg">clients are Female</p>
          {otherClients > 0 && (
            <p className="text-xl font-bold mb-1 2xl:text-2xl">
              {otherClients} out of 10 clients are Others
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
