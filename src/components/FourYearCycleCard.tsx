// src/components/FourYearCycleCard.tsx
// Bitcoin 4-Year Cycle chart component showing historical cycles and projected top

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { projectedEvents, generateCycleSpans } from '../data/btcCycleEvents';
import { useBTCHistory } from '../hooks/useBTCHistory';

export function FourYearCycleCard() {
  // Use real data from API with minDate filter
  const { data: btcData, error, isLoading, isLimitedData, dataRange } = useBTCHistory('2013-12-30');

  // Generate cycle spans
  const cycleSpans = useMemo(() => generateCycleSpans(), []);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!btcData || !btcData.prices) return [];

    const minDate = new Date('2013-12-30').getTime();

    return btcData.prices
      .map((item: any) => ({
        date: item.time > 1e12 ? item.time : item.time * 1000,
        price: Number(item.close) || 0,
      }))
      .filter((item: any) => {
        const maxDate = new Date('2030-01-01').getTime();
        return item.price > 0 && item.date >= minDate && item.date < maxDate;
      });
  }, [btcData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value) {
      const date = new Date(label);
      const dateStr = format(date, 'MMM dd, yyyy');
      
      // Check if this date matches projected event
      const matchingEvent = projectedEvents.find(e => {
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      return (
        <div className="bg-zinc-900/95 p-3 rounded-lg border border-zinc-700 shadow-lg">
          <p className="text-sm text-zinc-400">{dateStr}</p>
          <p className="text-sm font-medium text-white">
            ${payload[0].value.toLocaleString(undefined, { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            })}
          </p>
          {matchingEvent && (
            <div className="mt-2 pt-2 border-t border-zinc-700">
              <p className="text-sm font-semibold text-white italic">{matchingEvent.label}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate price domain for log axis
  const priceDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [10, 100000];
    const prices = chartData.map((d: any) => d.price).filter((p: number) => p > 0);
    if (prices.length === 0) return [10, 100000];
    const minPrice = Math.max(1, Math.min(...prices) * 0.8);
    const maxPrice = Math.max(...prices) * 1.5;
    return [minPrice, maxPrice];
  }, [chartData]);
  
  const formatXAxisTick = (tickItem: number) => {
    return format(new Date(tickItem), 'yyyy');
  };

  const formatYAxisTick = (tickItem: number) => {
    if (!tickItem || tickItem === 0) return '';
    
    // Log scale ticks: 1, 10, 100, 1k, 10k, 100k
    if (tickItem >= 10000) {
      return `${(tickItem / 1000).toFixed(0)}k`;
    } else if (tickItem >= 1000) {
      return `${(tickItem / 1000).toFixed(tickItem === 1000 ? 0 : 1)}k`;
    }
    return `${tickItem.toFixed(0)}`;
  };

  // Enhanced description with data source info
  const getDataSourceDescription = () => {
    if (isLoading) return "Loading historical data...";
    
    if (error) return "Error loading data";
    
    if (!btcData || !dataRange) return "No data available";
    
    const startYear = dataRange.start.getFullYear();
    const endYear = dataRange.end.getFullYear();
    
    // Parse source string
    let sourceDisplay = '';
    if (btcData.source.includes('+')) {
      const sources = btcData.source.split('+');
      if (sources.includes('binance') && sources.includes('cryptocompare_historical')) {
        sourceDisplay = 'Binance + CryptoCompare';
      } else {
        sourceDisplay = sources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ');
      }
    } else {
      sourceDisplay = btcData.source === 'coingecko_fallback' ? 'CoinGecko (fallback)' : 
                     btcData.source.charAt(0).toUpperCase() + btcData.source.slice(1);
    }
    
    if (isLimitedData) {
      return `Limited data (${startYear}-${endYear}) via ${sourceDisplay} • Last updated: ${format(new Date(), 'MMM d, h:mm a')}`;
    }
    
    return `Full cycle data (${startYear}-${endYear}) via ${sourceDisplay} • Last updated: ${format(new Date(), 'MMM d, h:mm a')}`;
  };

  // Custom legend component
  const CustomLegend = () => (
    <div className="flex gap-4 text-xs">
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-0.5 bg-blue-500"></div>
        <span className="text-zinc-400">BTC Price</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-red-500 font-semibold">▼</span>
        <span className="text-zinc-400">Projected Top</span>
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">4-Year Cycle</CardTitle>
          <CardDescription className="text-zinc-400">Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error || !btcData || chartData.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">4-Year Cycle</CardTitle>
          <CardDescription className="text-red-400">
            {error ? 'Error loading data' : 'No data available'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl font-semibold text-white">
            4-Year Cycle
          </CardTitle>
          <CustomLegend />
        </div>
        <CardDescription className="text-zinc-400">
          {getDataSourceDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] sm:h-[480px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 40, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <pattern id="bullPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="transparent" />
                </pattern>
                <pattern id="bearPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="transparent" />
                </pattern>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="2 4" 
                stroke="#3f3f46" 
                strokeOpacity={0.3}
              />
              
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={[new Date('2013-12-30').getTime(), new Date('2027-12-31').getTime()]}
                tickFormatter={formatXAxisTick}
                stroke="#71717a"
                ticks={[
                  new Date('2014-01-01').getTime(),
                  new Date('2016-01-01').getTime(),
                  new Date('2018-01-01').getTime(),
                  new Date('2020-01-01').getTime(),
                  new Date('2022-01-01').getTime(),
                  new Date('2024-01-01').getTime(),
                  new Date('2026-01-01').getTime(),
                ]}
              />
              
              <YAxis
                scale="log"
                domain={priceDomain}
                allowDataOverflow
                tickFormatter={formatYAxisTick}
                stroke="#71717a"
                ticks={[1, 10, 100, 1000, 10000, 100000]}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '3 3' }} 
              />
              
              {/* Render cycle spans */}
              {cycleSpans.map((span, index) => (
                <ReferenceArea
                  key={index}
                  x1={span.x1}
                  x2={span.x2}
                  fill={span.phase === 'bull' ? '#10b981' : '#ef4444'}
                  fillOpacity={span.isProjected ? 0.03 : 0.05}
                  stroke={span.phase === 'bull' ? '#10b981' : '#ef4444'}
                  strokeOpacity={span.isProjected ? 0.2 : 0.3}
                  strokeDasharray={span.isProjected ? '4 4' : '2 2'}
                  strokeWidth={1}
                  label={span.label ? {
                    value: span.label,
                    position: 'insideTop',
                    fill: '#22c55e',
                    fontSize: 14,
                    fontWeight: 600,
                    style: { letterSpacing: '0.05em' }
                  } : null}
                />
              ))}
              
              {/* Duration labels for cycles */}
              {cycleSpans
                .filter(span => span.phase === 'bull' && !span.isProjected)
                .map((span, index) => {
                  const midPoint = (span.x1 + span.x2) / 2;
                  return (
                    <ReferenceLine
                      key={`duration-${index}`}
                      x={midPoint}
                      stroke="transparent"
                      label={{
                        value: `${span.duration}d`,
                        position: 'top',
                        offset: -25,
                        fill: '#71717a',
                        fontSize: 10,
                      }}
                    />
                  );
                })}
              
              {/* Projected top marker */}
              {projectedEvents.map((event) => (
                <ReferenceLine
                  key={event.date}
                  x={new Date(event.date).getTime()}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  strokeDasharray="4 4"
                  label={
                    <Label
                      value={`▼ ${event.label}`}
                      position="top"
                      fill="#ef4444"
                      fontSize={12}
                      fontWeight={600}
                      style={{ fontStyle: 'italic' }}
                    />
                  }
                />
              ))}
              
              {/* Price line - render last */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#60a5fa"
                strokeWidth={2}
                strokeOpacity={0.9}
                dot={false}
                activeDot={{ r: 6, fill: '#60a5fa' }}
                isAnimationActive={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default FourYearCycleCard;