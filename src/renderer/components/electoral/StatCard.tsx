interface StatCardProps {
  label: string;
  value: number | string;
  colorScheme: 'blue' | 'green' | 'gray' | 'yellow';
}

/**
 * Reusable statistics card component for vote summary displays
 */
export function StatCard({ label, value, colorScheme }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-gray-200',
    green: 'bg-green-50 text-green-700 border-gray-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-gray-200'
  };

  const valueColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    gray: 'text-gray-900',
    yellow: 'text-yellow-900'
  };

  return (
    <div className={`${colorClasses[colorScheme]} p-3 rounded-lg text-center border`}>
      <span className="text-xs font-medium">{label}</span>
      <p className={`text-lg font-semibold ${valueColorClasses[colorScheme]}`}>{value}</p>
    </div>
  );
}
