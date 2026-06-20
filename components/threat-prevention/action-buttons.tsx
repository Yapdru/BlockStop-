"use client";

import { motion } from "framer-motion";

interface ActionButton {
  label: string;
  icon: string;
  onClick: () => void;
  color?: "primary" | "red" | "green" | "orange";
  disabled?: boolean;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  layout?: "horizontal" | "vertical";
}

export default function ActionButtons({
  actions,
  layout = "horizontal",
}: ActionButtonsProps) {
  const getColorClasses = (color: string = "primary") => {
    const colors: Record<string, string> = {
      primary: "bg-primary-600 hover:bg-primary-700 text-white",
      red: "bg-red-600 hover:bg-red-700 text-white",
      green: "bg-green-600 hover:bg-green-700 text-white",
      orange: "bg-orange-600 hover:bg-orange-700 text-white",
    };
    return colors[color] || colors.primary;
  };

  const containerClass =
    layout === "horizontal"
      ? "flex flex-wrap gap-3"
      : "flex flex-col gap-3";

  const buttonClass =
    layout === "horizontal"
      ? "flex-1 min-w-[150px]"
      : "w-full";

  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {actions.map((action, index) => (
        <motion.button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`${buttonClass} px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${getColorClasses(
            action.color
          )} disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={!action.disabled ? { scale: 1.05 } : {}}
          whileTap={!action.disabled ? { scale: 0.95 } : {}}
        >
          <span className="text-lg">{action.icon}</span>
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
