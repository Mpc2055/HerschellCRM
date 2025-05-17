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
          bg: "bg-green-100",
          text: "text-green-600",
        };
      case "blue":
        return {
          bg: "bg-blue-100",
          text: "text-blue-500",
        };
      case "yellow":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
        };
      default:
        return {
          bg: "bg-primary/10",
          text: "text-primary",
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses.bg} rounded-md p-3`}>
            <i className={`${icon} ${colorClasses.text}`}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold">{value}</div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <i className={`fas fa-arrow-${change.isPositive ? 'up' : 'down'}`}></i>
                  <span className="ml-1">{change.value}</span>
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
