import React from "react";

interface StatsCardProps {
  icon: string;
  title: string;
  value: string | number;
  change: {
    value: string | number;
    isPositive: boolean;
  };
  color?: "primary" | "green" | "blue" | "yellow";
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  change,
  color = "primary",
}) => {
  const getColorClasses = () => {
    switch (color) {
      case "green":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-600 dark:text-green-400",
        };
      case "blue":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600 dark:text-blue-400",
        };
      case "yellow":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          text: "text-yellow-600 dark:text-yellow-400",
        };
      default:
        return {
          bg: "bg-primary/10 dark:bg-primary/20",
          text: "text-primary dark:text-primary-foreground",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="bg-card text-card-foreground overflow-hidden shadow rounded-lg border">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses.bg} rounded-md p-3`}>
            <i className={`${icon} ${colorClasses.text} text-lg`}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-foreground">{value}</div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  change.isPositive 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <i className={`fas fa-arrow-${change.isPositive ? 'up' : 'down'} mr-1`}></i>
                  <span>{change.value}</span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
