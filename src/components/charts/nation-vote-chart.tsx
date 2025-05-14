
"use client";

import type { AggregatedScore } from "@/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"

interface NationVoteChartProps {
  data: AggregatedScore[];
}

const chartConfig = {
  averageSong: {
    label: "Canzone",
    color: "hsl(var(--chart-1))",
  },
  averagePerformance: {
    label: "Performance",
    color: "hsl(var(--chart-2))",
  },
  averageOutfit: {
    label: "Outfit",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function NationVoteChart({ data }: NationVoteChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-center py-10">Nessun dato di voto ancora disponibile. Sii il primo a votare!</p>;
  }
  
  // Sort data by total score for better visualization
  const sortedData = [...data].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
      <ResponsiveContainer width="100%" height={300 + sortedData.length * 30}> {/* Dynamic height */}
        <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.5)" />
          <XAxis type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="hsl(var(--foreground)/0.7)"/>
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            tickLine={false} 
            axisLine={false} 
            stroke="hsl(var(--foreground)/0.7)"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Legend content={<ChartLegendContent />} />
          <Bar dataKey="averageSong" name="Canzone" fill="var(--color-averageSong)" radius={4} barSize={10} />
          <Bar dataKey="averagePerformance" name="Performance" fill="var(--color-averagePerformance)" radius={4} barSize={10} />
          <Bar dataKey="averageOutfit" name="Outfit" fill="var(--color-averageOutfit)" radius={4} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
