import { Eye, ShoppingCart, CreditCard, DollarSign } from "lucide-react";

interface FunnelData {
  productViews: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
  viewToCartRate: number;
  cartToCheckoutRate: number;
  checkoutToPurchaseRate: number;
  overallConversionRate: number;
}

interface ConversionFunnelVisualProps {
  funnel: FunnelData;
}

export const ConversionFunnelVisual = ({ funnel }: ConversionFunnelVisualProps) => {
  const steps = [
    {
      label: "Visualizações",
      value: funnel.productViews,
      rate: 100,
      color: "#3B82F6",
      icon: Eye,
    },
    {
      label: "Carrinho",
      value: funnel.addToCarts,
      rate: funnel.viewToCartRate,
      color: "#10B981",
      icon: ShoppingCart,
    },
    {
      label: "Checkout",
      value: funnel.checkouts,
      rate: funnel.cartToCheckoutRate,
      color: "#F59E0B",
      icon: CreditCard,
    },
    {
      label: "Compra",
      value: funnel.purchases,
      rate: funnel.checkoutToPurchaseRate,
      color: "#8B5CF6",
      icon: DollarSign,
    },
  ];

  return (
    <div className="relative w-full py-8">
      <svg
        viewBox="0 0 400 500"
        className="w-full h-auto"
        style={{ maxWidth: "500px", margin: "0 auto", display: "block" }}
      >
        <defs>
          {/* Gradients for each step */}
          <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="gradient-green" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="gradient-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Funnel Steps */}
        {steps.map((step, index) => {
          const yPosition = index * 120 + 10;
          const widthPercentage = (step.rate / 100) * 0.8 + 0.2; // Min 20% width for visibility
          const topWidth = 360 * widthPercentage;
          const bottomWidth = index < steps.length - 1 
            ? 360 * ((steps[index + 1].rate / 100) * 0.8 + 0.2)
            : topWidth * 0.9;
          
          const leftTop = (400 - topWidth) / 2;
          const rightTop = leftTop + topWidth;
          const leftBottom = (400 - bottomWidth) / 2;
          const rightBottom = leftBottom + bottomWidth;

          return (
            <g key={index} className="animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
              {/* Funnel shape */}
              <path
                d={`
                  M ${leftTop} ${yPosition}
                  L ${rightTop} ${yPosition}
                  L ${rightBottom} ${yPosition + 100}
                  L ${leftBottom} ${yPosition + 100}
                  Z
                `}
                fill={`url(#gradient-${
                  index === 0 ? "blue" : index === 1 ? "green" : index === 2 ? "yellow" : "purple"
                })`}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="transition-all duration-300 hover:opacity-90"
              />

              {/* Step label */}
              <text
                x="200"
                y={yPosition + 35}
                textAnchor="middle"
                className="fill-white font-semibold text-[14px]"
              >
                {step.label}
              </text>

              {/* Value */}
              <text
                x="200"
                y={yPosition + 55}
                textAnchor="middle"
                className="fill-white font-bold text-[18px]"
              >
                {step.value.toLocaleString()}
              </text>

              {/* Percentage */}
              <text
                x="200"
                y={yPosition + 75}
                textAnchor="middle"
                className="fill-white/80 text-[12px]"
              >
                {step.rate.toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend with icons below funnel */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${step.color}20` }}
              >
                <Icon className="h-4 w-4" style={{ color: step.color }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{step.label}</div>
                <div className="text-sm font-bold">{step.value.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall conversion rate badge */}
      <div className="mt-6 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Taxa de Conversão Global: {funnel.overallConversionRate.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};
