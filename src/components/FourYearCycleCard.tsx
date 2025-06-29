// src/components/FourYearCycleCard.tsx
// Bitcoin 4-Year Cycle chart component showing historical cycles and projected top

import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/neon-glass-card';
import SignalCard from '@/components/SignalCard';
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
import { format } from 'date-fns';
import { projectedEvents, generateCycleSpans, getCycleMarkers } from '../data/btcCycleEvents';
import { useBTCHistory } from '../hooks/useBTCHistory';

// Constants for X-axis domain control
const EXTRA_DAYS_AFTER_PROJECTION = 30; // change to grow/shrink padding
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Custom label component for projected top
const ProjectedTopLabel = ({ viewBox }: any) => {
  const { x, y } = viewBox;
  return (
    <g>
      <text x={x} y={y - 30} fill="#ef4444" fontSize={12} fontWeight={600} fontStyle="italic" textAnchor="middle">
        Projected Top
      </text>
    </g>
  );
};

// Custom label for bottom dates (two lines)
const BottomDateLabel = ({ viewBox, date, label, isSmall }: any) => {
  const { x, y } = viewBox;
  const fontSize = isSmall ? 8 : 9;
  return (
    <g>
      <text x={x} y={y - 17} fill="#A1A1AA" fontSize={fontSize} fontWeight={500} textAnchor="middle">
        {date}
      </text>
      <text x={x} y={y - 5} fill="#A1A1AA" fontSize={fontSize} fontWeight={500} textAnchor="middle">
        {label}
      </text>
    </g>
  );
};

// Define the type for chart data points
interface ChartDataPoint {
  date: number;
  price: number;
  isVirtual?: boolean;
}

export function FourYearCycleCard() {
  // Use real data from API - fetching from 2013
  const { data: btcData, error, isLoading, isLimitedData, dataRange } = useBTCHistory('2013-11-01');

  // Generate cycle spans and markers
  const cycleSpans = useMemo(() => {
    const spans = generateCycleSpans();
    // Sanity check: verify duration labels
    const durLabelCount = spans.filter(s => s.durationLabel).length;
    console.log(`Duration labels generated: ${durLabelCount} (expected: 5 - 3 bull + 2 bear complete)`);
    return spans;
  }, []);
  const cycleMarkers = useMemo(() => getCycleMarkers(), []);

  // Check if we're on a small/medium screen
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
      setIsMediumScreen(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Prepare chart data with virtual points for tooltips
  const chartData = useMemo(() => {
    if (!btcData || !btcData.prices) return [];

    const minDate = new Date('2013-11-01').getTime();
    const maxDate = new Date('2030-01-01').getTime();

    // First, create the base chart data
    const baseData: ChartDataPoint[] = btcData.prices
      .map((item: any) => ({
        date: item.time > 1e12 ? item.time : item.time * 1000,
        price: Number(item.close) || 0,
      }))
      .filter((item: any) => item.price > 0 && item.date >= minDate && item.date < maxDate);

    // Create a map for fast lookup
    const dataMap = new Map(baseData.map(d => [d.date, d.price]));

    // Add virtual points for each historical marker only (exclude projected events)
    cycleMarkers
      .filter(marker => !marker.isProjectedTop) // Only add virtual points for historical events
      .forEach(marker => {
        const timestamp = marker.timestamp;
        
        // Skip if we already have data for this date
        if (dataMap.has(timestamp)) return;
        
        // Find the closest date in our data
        let closestPrice = 0;
        let minDiff = Infinity;
        
        baseData.forEach(d => {
          const diff = Math.abs(d.date - timestamp);
          if (diff < minDiff) {
            minDiff = diff;
            closestPrice = d.price;
          }
        });
        
        if (closestPrice > 0) {
          baseData.push({
            date: timestamp,
            price: closestPrice,
            isVirtual: true
          });
        }
      });

    // Sort by date
    return baseData.sort((a, b) => a.date - b.date);
  }, [btcData, cycleMarkers]);

  // Calculate min/max timestamps for domain
  const minTimestamp = useMemo(() => {
    if (chartData.length === 0) return new Date('2013-11-01').getTime();
    return Math.min(...chartData.map(d => d.date));
  }, [chartData]);

  const projectedTopTs = new Date('2025-10-18T12:00:00Z').getTime();
  const maxTimestamp = projectedTopTs + EXTRA_DAYS_AFTER_PROJECTION * MS_PER_DAY;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value) {
      const date = new Date(label);
      const dateStr = format(date, 'MMM dd, yyyy');
      
      // Check if this date matches any event
      const matchingMarker = cycleMarkers.find(m => {
        const markerDate = new Date(m.timestamp);
        return markerDate.toDateString() === date.toDateString();
      });
      
      const matchingProjected = projectedEvents.find(e => {
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      return (
        <div className="bg-neon-bg1/95 p-3 rounded-lg border border-white/10 shadow-lg">
          <p className="text-sm text-[#A1A1AA]">{dateStr}</p>
          <p className="text-sm font-medium text-[#F5F5F7]">
            ${payload[0].value.toLocaleString(undefined, { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            })}
          </p>
          {(matchingMarker || matchingProjected) && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-sm font-semibold text-[#F5F5F7]">
                {matchingMarker ? (matchingMarker.type === 'top' ? '▼' : '▲') : '▼'} {matchingMarker ? matchingMarker.label : matchingProjected?.label ?? '—'}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = () => (
    <div className="flex flex-wrap gap-4 text-xs">
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-0.5 bg-neon-cyan"></div>
        <span className="text-[#A1A1AA]">BTC Price</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-neon-green font-semibold">▲</span>
        <span className="text-[#A1A1AA]">Bottom</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-neon-red font-semibold">▼</span>
        <span className="text-[#A1A1AA]">Top</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-neon-red font-semibold opacity-60 italic">▼</span>
        <span className="text-[#A1A1AA] italic">Projected Top</span>
      </span>
    </div>
  );

  // Calculate price domain for log axis with hard ceiling at 150k
  const priceDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [10, 150000];
    const prices = chartData.map((d: any) => d.price).filter((p: number) => p > 0);
    if (prices.length === 0) return [10, 150000];
    const minPrice = Math.max(1, Math.min(...prices) * 0.8);
    const maxPrice = Math.max(...prices) * 1.5;
    
    // Always ensure 150k is included
    if (maxPrice < 150000) {
      return [minPrice, 150000];
    }
    return [minPrice, maxPrice * 1.2];
  }, [chartData]);
  
  const formatXAxisTick = (tickItem: number) => {
    return format(new Date(tickItem), 'yyyy');
  };

  const formatYAxisTick = (tickItem: number) => {
    if (!tickItem || tickItem === 0) return '';
    
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

  if (isLoading) {
    return (
      <Card>
        <SignalCard.Header 
          title="4-Year Cycle"
          subtitle="Loading..."
          align="center"
        />
      </Card>
    );
  }

  if (error || !btcData || chartData.length === 0) {
    return (
      <Card>
        <SignalCard.Header 
          title="4-Year Cycle"
          subtitle={
            <span className="text-neon-red">
              {error ? 'Error loading data' : 'No data available'}
            </span>
          }
          align="center"
        />
      </Card>
    );
  }

  return (
    <Card>
      <SignalCard.Header 
        title="4-Year Cycle"
        subtitle={getDataSourceDescription()}
        right={<CustomLegend />}
        align="center"
      />
      <CardContent>
        <div className="h-[320px] sm:h-[480px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 40, right: 30, left: 10, bottom: 60 }}
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
                stroke="#71717A" 
                strokeOpacity={0.2}
              />
              
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={[minTimestamp, maxTimestamp]}
                tickFormatter={formatXAxisTick}
                stroke="#71717A"
                padding={{ left: 0, right: 0 }}
                ticks={[
                  new Date('2014-01-01').getTime(),
                  new Date('2016-01-01').getTime(),
                  new Date('2018-01-01').getTime(),
                  new Date('2020-01-01').getTime(),
                  new Date('2022-01-01').getTime(),
                  new Date('2024-01-01').getTime(),
                  new Date('2026-01-01').getTime(),
                ]}
                allowDuplicatedCategory={false}
              />
              
              <YAxis
                scale="log"
                domain={priceDomain}
                allowDataOverflow
                tickFormatter={formatYAxisTick}
                stroke="#71717A"
                ticks={[1, 10, 100, 1000, 10000, 100000, 150000]}
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#71717A', strokeWidth: 1, strokeDasharray: '3 3' }} 
              />
              
              {/* Render cycle spans */}
              {cycleSpans.map((span, index) => {
                const cycleLabel = !span.isBear && span.label && span.durationLabel ? {
                  value: span.label,
                  position: 'insideTop' as const,
                  fill: '#10b981',
                  fontSize: 14,
                  fontWeight: 600,
                  style: { letterSpacing: '0.05em' }
                } : undefined;
                
                return (
                  <ReferenceArea
                    key={index}
                    x1={span.x1}
                    x2={span.x2}
                    fill={span.isBear ? '#ef4444' : '#10b981'}
                    fillOpacity={span.isProjected ? 0.03 : 0.05}
                    stroke={span.isBear ? '#ef4444' : '#10b981'}
                    strokeOpacity={span.isProjected ? 0.2 : 0.3}
                    strokeDasharray={span.isProjected ? '4 4' : '2 2'}
                    strokeWidth={1}
                    {...(cycleLabel && { label: cycleLabel })}
                  />
                );
              })}
              
              {/* Cycle-duration labels */}
              {!isSmallScreen && cycleSpans
                .filter(s => s.durationLabel)
                .map((s, i) => {
                  // Check if this is a bear cycle label
                  const isBearCycle = s.durationLabel && s.durationLabel.includes('bear cycle');
                  
                  // For bear cycles, replace " – bear cycle" with " bear"
                  const labelValue = isBearCycle 
                    ? s.durationLabel.replace(' – bear cycle', ' bear')
                    : s.durationLabel;
                  
                  return (
                    <ReferenceLine
                      key={`dur-${i}`}
                      x={s.midpoint}
                      stroke="transparent"
                      label={{
                        value: labelValue,
                        position: 'insideTop' as const,
                        dy: isBearCycle ? s.labelYOffset + 329 : s.labelYOffset, // Adjust position for bear cycles
                        fill: '#A1A1AA',
                        fontSize: isBearCycle ? 9.2 : (isMediumScreen ? 8 : 9), // Bigger font for bear cycles
                        style: { fontStyle: 'italic' }
                      }}
                    />
                  );
                })}
              
              {/* Top and bottom marker glyphs (in-chart) */}
              {cycleMarkers.map((marker) => (
                <ReferenceLine
                  key={`glyph-${marker.timestamp}`}
                  x={marker.timestamp}
                  stroke="transparent"
                  label={
                    <Label
                      value={marker.type === 'top' ? '▼' : '▲'}
                      position="top"
                      offset={-8}
                      fill={marker.type === 'top' ? '#ef4444' : '#10b981'}
                      fontSize={12}
                      fontWeight={600}
                    />
                  }
                />
              ))}
              
              {/* Top and bottom date labels (below x-axis) - only on larger screens */}
              {!isMediumScreen && cycleMarkers
                .filter(marker => !marker.isProjectedTop)
                .map((marker) => (
                  <ReferenceLine
                    key={`date-${marker.timestamp}`}
                    x={marker.timestamp}
                    stroke="transparent"
                    label={
                      <BottomDateLabel 
                        date={marker.formattedDate}
                        label={marker.label}
                        isSmall={isSmallScreen}
                      />
                    }
                  />
                ))}
              
              {/* Projected top marker with custom label */}
              {projectedEvents.map((event) => (
                <ReferenceLine
                  key={event.date}
                  x={new Date(`${event.date}T12:00:00Z`).getTime()}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  strokeDasharray="4 4"
                  label={<ProjectedTopLabel />}
                />
              ))}
              
              {/* Price line */}
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
              
              {/* Projected top date label - only on larger screens - MOVED AFTER PRICE LINE */}
              {!isMediumScreen && (
                <ReferenceLine
                  x={new Date('2025-10-18T12:00:00Z').getTime()}
                  stroke="transparent"
                  label={
                    <BottomDateLabel 
                      date="Oct-18-2025"
                      label="Top"
                      isSmall={isSmallScreen}
                    />
                  }
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default FourYearCycleCard;