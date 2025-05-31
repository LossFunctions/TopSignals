// src/components/FourYearCycleCard.tsx
// Bitcoin 4-Year Cycle chart component showing historical tops/bottoms and halvings

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
  Label,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cycleEvents, halvingEvents, projectedEvents, calculateCycleMeta } from '../data/btcCycleEvents';
import { useBTCHistory } from '../hooks/useBTCHistory';

export function FourYearCycleCard() {
  // Use real data from API
  const { data: btcData, error, isLoading, isLimitedData, dataRange } = useBTCHistory();

  // Enrich events with metadata
  const enrichedCycleEvents = useMemo(() => 
    calculateCycleMeta(cycleEvents, halvingEvents), []);
  
  const enrichedProjectedEvents = useMemo(() => 
    calculateCycleMeta(projectedEvents, halvingEvents), []);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!btcData || !btcData.prices) return [];

    return btcData.prices
      .map((item: any) => ({
        // Auto-detect: if timestamp > 1e12, it's already milliseconds
        date: item.time > 1e12 ? item.time : item.time * 1000,
        price: Number(item.close) || 0,
      }))
      .filter((item: any) => {
        // Only include data points with valid price and date
        const minDate = new Date('2010-01-01').getTime();
        const maxDate = new Date('2030-01-01').getTime();
        return item.price > 0 && item.date > minDate && item.date < maxDate;
      });
  }, [btcData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value) {
      const date = new Date(label);
      const dateStr = format(date, 'MMM dd, yyyy');
      
      // Check if this date matches any event
      const allEvents = [...enrichedCycleEvents, ...halvingEvents, ...enrichedProjectedEvents];
      const matchingEvent = allEvents.find(e => {
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      return (
        <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700 shadow-lg">
          <p className="text-sm text-zinc-300">{dateStr}</p>
          <p className="text-sm font-medium text-white">
            ${payload[0].value.toLocaleString(undefined, { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            })}
          </p>
          {matchingEvent && (
            <div className="mt-2 pt-2 border-t border-zinc-700">
              <p className="text-sm font-semibold text-white">{matchingEvent.label}</p>
              {'meta' in matchingEvent && matchingEvent.meta && (
                <div className="text-xs text-zinc-400 mt-1">
                  {matchingEvent.meta.daysFromPrevious && (
                    <p>{matchingEvent.meta.daysFromPrevious} days since previous {matchingEvent.type}</p>
                  )}
                  {matchingEvent.meta.daysFromHalving && (
                    <p>{matchingEvent.meta.daysFromHalving} days after {matchingEvent.meta.halvingLabel}</p>
                  )}
                  {matchingEvent.meta.daysFromTop && (
                    <p>{matchingEvent.meta.daysFromTop} days drawdown</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Get icon for event type
  const getEventIcon = (event: any) => {
    return event.type === 'top' ? '▼' : event.type === 'bottom' ? '▲' : '◆';
  };

  // Get row for stacked labels
  const getEventRow = (event: any) => {
    if (event.type === 'top') return 0;
    if (event.type === 'bottom') return 1;
    return 2; // halving
  };

  // Stacked label component
  const StackedLabel = ({ viewBox, value, row, color, opacity = 1 }: any) => (
    <text
      x={viewBox.x + viewBox.width / 2}
      y={viewBox.y - 8 - (row * 14)} // row 0 = -8, row 1 = -22, row 2 = -36
      textAnchor="middle"
      fill={color}
      fontSize={12}
      fontWeight={600}
      opacity={opacity}
    >
      {value}
    </text>
  );

  // Get event color
  const getEventColor = (event: any) => {
    return event.type === 'top' ? '#ef4444' : event.type === 'bottom' ? '#10b981' : '#6b7280';
  };

  // Calculate price domain for log axis
  const priceDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [10, 100000];
    const prices = chartData.map((d: any) => d.price).filter((p: number) => p > 0);
    if (prices.length === 0) return [10, 100000];
    const minPrice = Math.max(1, Math.min(...prices) * 0.8);
    const maxPrice = Math.max(...prices) * 1.2;
    return [minPrice, maxPrice];
  }, [chartData]);
  
  const formatXAxisTick = (tickItem: number) => {
    return format(new Date(tickItem), 'yyyy');
  };

  const formatYAxisTick = (tickItem: number) => {
    if (!tickItem || tickItem === 0) return '';
    if (tickItem >= 1000) {
      return `${(tickItem / 1000).toFixed(0)}k`;
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
      // Multiple sources
      const sources = btcData.source.split('+');
      if (sources.includes('binance') && sources.includes('cryptocompare_historical')) {
        sourceDisplay = 'Binance + CryptoCompare';
      } else if (sources.includes('binance') && sources.includes('coingecko_historical')) {
        sourceDisplay = 'Binance + CoinGecko';
      } else if (sources.includes('binance') && sources.includes('kraken_historical')) {
        sourceDisplay = 'Binance + Kraken';
      } else {
        sourceDisplay = sources.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ');
      }
    } else {
      // Single source
      sourceDisplay = btcData.source === 'coingecko_fallback' ? 'CoinGecko (fallback)' : 
                     btcData.source.charAt(0).toUpperCase() + btcData.source.slice(1);
    }
    
    if (isLimitedData) {
      return `Limited data (${startYear}-${endYear}) via ${sourceDisplay} • Last updated: ${format(new Date(), 'MMM d, h:mm a')}`;
    }
    
    return `Full cycle data (${startYear}-${endYear}) via ${sourceDisplay} • Last updated: ${format(new Date(), 'MMM d, h:mm a')}`;
  };

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

  if (error || !btcData) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">4-Year Cycle</CardTitle>
          <CardDescription className="text-red-400">Error loading data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">4-Year Cycle</CardTitle>
          <CardDescription className="text-zinc-400">No data available</CardDescription>
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
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="text-red-500">▼</span> Top
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">▲</span> Bottom
            </span>
            <span className="flex items-center gap-1">
              <span className="text-gray-500">◆</span> Halving
            </span>
          </div>
        </div>
        <CardDescription className="text-zinc-400">
          {getDataSourceDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 60, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={[new Date('2012-01-01').getTime(), new Date('2027-12-31').getTime()]}
                tickFormatter={formatXAxisTick}
                stroke="#71717a"
                ticks={[
                  new Date('2012-01-01').getTime(),
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
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#71717a', strokeWidth: 1, strokeDasharray: '3 3' }} />
              
              {/* Halving events - render first */}
              {halvingEvents.map((event) => (
                <ReferenceLine
                  key={event.date}
                  x={new Date(event.date).getTime()}
                  stroke="#6b7280"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={
                    <StackedLabel
                      row={getEventRow(event)}
                      value={getEventIcon(event) + ' ' + event.label}
                      color="#6b7280"
                    />
                  }
                />
              ))}
              
              {/* Cycle events */}
              {enrichedCycleEvents.map((event) => (
                <ReferenceLine
                  key={event.date}
                  x={new Date(event.date).getTime()}
                  stroke={getEventColor(event)}
                  strokeWidth={2}
                  label={
                    <StackedLabel
                      row={getEventRow(event)}
                      value={getEventIcon(event) + ' ' + event.label}
                      color={getEventColor(event)}
                    />
                  }
                />
              ))}
              
              {/* Projected events */}
              {enrichedProjectedEvents.map((event) => (
                <ReferenceLine
                  key={event.date}
                  x={new Date(event.date).getTime()}
                  stroke={getEventColor(event)}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  label={
                    <StackedLabel
                      row={getEventRow(event)}
                      value={getEventIcon(event) + ' ' + event.label}
                      color={getEventColor(event)}
                      opacity={0.6}
                    />
                  }
                />
              ))}
              
              {/* Price line - render last so it's on top */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeOpacity={1}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
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