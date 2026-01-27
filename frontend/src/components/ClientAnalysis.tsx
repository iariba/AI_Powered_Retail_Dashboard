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
              className={`w-5 h-5 sm:w-6 sm:h-6 ${
                i < maleClients
                  ? 'text-blue-500'
                  : i < maleClients + femaleClients
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Text block - responsive and centered on small screens */}
        <div className="rounded-lg p-4 text-black dark:text-white w-full mx-auto md:mx-0 flex flex-col items-center">

          <div className="flex items-center justify-center gap-2 mb-2">
            <UserIcon className="h-5 w-5" />
            <span>On average,</span>
          </div>
          <p className="text-xl font-bold mb-1 ">{maleClients} out of 10</p>
          <p>clients are Male</p>
          <p className="text-xl font-bold mb-1 ">{femaleClients} out of 10</p>
          <p className='lg:ml-2'>clients are Female</p>
          {otherClients > 0 && (
            <p className="text-xl font-bold mb-1">
              {otherClients} out of 10 clients are Others
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
