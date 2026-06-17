import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Analytics and insights for lead generation.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center flex flex-col items-center justify-center">
        <BarChart3 className="text-gray-300 w-16 h-16 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Reports coming soon</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          Advanced reporting will be available in future versions once sufficient data has been collected from lead verification and outreach campaigns.
        </p>
      </div>
    </div>
  );
}
