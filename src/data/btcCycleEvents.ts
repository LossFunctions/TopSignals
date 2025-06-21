// ===== 4. src/data/btcCycleEvents.ts =====

// Historical cycle markers - tops and bottoms
export const cycleEvents = [
  { date: '2013-12-04', type: 'top', label: 'Top' },
  { date: '2015-01-14', type: 'bottom', label: 'Bottom' },
  { date: '2017-12-17', type: 'top', label: 'Top' },
  { date: '2018-12-15', type: 'bottom', label: 'Bottom' },
  { date: '2021-11-10', type: 'top', label: 'Top' },
  { date: '2022-11-21', type: 'bottom', label: 'Bottom' },
];

// Halving events (keeping empty per spec)
export const halvingEvents: any[] = [];

// Projected events
export const projectedEvents = [
  { date: '2025-10-18', type: 'top', label: 'Projected Top' },
];

// Historical cycle data with precise dates
const historicalCycles = [
  { 
    bottomDate: '2011-12-01', // Approximate previous bottom
    topDate: '2013-12-04',
    nextBottomDate: '2015-01-14',
    label: '2013 CYCLE'
  },
  { 
    bottomDate: '2015-01-14',
    topDate: '2017-12-17',
    nextBottomDate: '2018-12-15',
    label: '2017 CYCLE'
  },
  { 
    bottomDate: '2018-12-15',
    topDate: '2021-11-10',
    nextBottomDate: '2022-11-21',
    label: '2021 CYCLE'
  },
];

// Current/Projected cycle
const currentCycle = {
  bottomDate: '2022-11-21',
  topDate: '2025-10-18',
  nextBottomDate: '2026-09-18',
  label: '2025 CYCLE',
  isProjected: true,
  isCurrent: true
};

// Helper to convert date string to midday UTC timestamp
const toMiddayUTC = (d: string) => new Date(`${d}T12:00:00Z`).getTime();

// Helper to calculate days between dates
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate cycle spans for rendering
export function generateCycleSpans() {
  const spans: any[] = [];

  // Process historical cycles
  historicalCycles.forEach((cycle) => {
    // Bull phase: bottom → top
    const bullDuration = daysBetween(cycle.bottomDate, cycle.topDate);
    const bullMidpoint = (toMiddayUTC(cycle.bottomDate) + toMiddayUTC(cycle.topDate)) / 2;
    const bullPlural = bullDuration === 1 ? '' : 's';
    spans.push({
      x1: toMiddayUTC(cycle.bottomDate),
      x2: toMiddayUTC(cycle.topDate),
      label: cycle.label,
      phase: 'bull',
      isBear: false,
      duration: bullDuration,
      durationLabel: `${bullDuration.toLocaleString()} day${bullPlural} – bull cycle`,
      midpoint: bullMidpoint,
      labelYOffset: 14,
      isProjected: false,
      isCurrentBull: false,
      isBearCycleCompleted: false
    });

    // Bear phase: top → next bottom
    const bearDuration = daysBetween(cycle.topDate, cycle.nextBottomDate);
    const bearMidpoint = (toMiddayUTC(cycle.topDate) + toMiddayUTC(cycle.nextBottomDate)) / 2;
    const bearPlural = bearDuration === 1 ? '' : 's';
    spans.push({
      x1: toMiddayUTC(cycle.topDate),
      x2: toMiddayUTC(cycle.nextBottomDate),
      label: null,
      phase: 'bear',
      isBear: true,
      duration: bearDuration,
      durationLabel: `${bearDuration.toLocaleString()} day${bearPlural} – bear cycle`,
      midpoint: bearMidpoint,
      labelYOffset: 4,
      isProjected: false,
      isBearCycleCompleted: true
    });
  });

  // Current cycle - bull phase (still running)
  const currentDuration = daysBetween(currentCycle.bottomDate, new Date().toISOString());
  const currentBullMidpoint = (toMiddayUTC(currentCycle.bottomDate) + toMiddayUTC(currentCycle.topDate)) / 2;
  spans.push({
    x1: toMiddayUTC(currentCycle.bottomDate),
    x2: toMiddayUTC(currentCycle.topDate),
    label: currentCycle.label,
    phase: 'bull',
    isBear: false,
    duration: daysBetween(currentCycle.bottomDate, currentCycle.topDate),
    currentDuration: currentDuration,
    durationLabel: `${currentDuration} days so far`,
    midpoint: currentBullMidpoint,
    labelYOffset: 14,
    isProjected: true,
    isCurrentBull: true,
    isBearCycleCompleted: false
  });

  // Projected bear phase - no duration label
  const projectedBearMidpoint = (toMiddayUTC(currentCycle.topDate) + toMiddayUTC(currentCycle.nextBottomDate)) / 2;
  spans.push({
    x1: toMiddayUTC(currentCycle.topDate),
    x2: toMiddayUTC(currentCycle.nextBottomDate),
    label: null,
    phase: 'bear',
    isBear: true,
    duration: daysBetween(currentCycle.topDate, currentCycle.nextBottomDate),
    durationLabel: null, // Don't show duration for projected bear
    midpoint: projectedBearMidpoint,
    labelYOffset: 4,
    isProjected: true,
    isBearCycleCompleted: false
  });

  return spans;
}

// Get all top/bottom markers for rendering
export function getCycleMarkers() {
  const markers = cycleEvents.map(event => ({
    ...event,
    timestamp: toMiddayUTC(event.date),
    formattedDate: formatMarkerDate(event.date),
    label: event.type === 'top' ? 'Top' : 'Bottom',
    isProjectedTop: false
  }));
  
  // Add projected top marker
  projectedEvents.forEach(event => {
    if (event.type === 'top') {
      markers.push({
        date: event.date,
        type: 'top',
        timestamp: toMiddayUTC(event.date),
        formattedDate: formatMarkerDate(event.date),
        label: 'Top',
        isProjectedTop: true
      });
    }
  });
  
  return markers;
}

// Format date for marker labels
function formatMarkerDate(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [yyyy, mm, dd] = dateStr.split('-');     // ← no timezone math
  return `${months[+mm - 1]}-${dd}-${yyyy}`;
}

// Legacy function - keeping for compatibility but marking parameters as intentionally unused
export function calculateCycleMeta(_events?: typeof cycleEvents, _halvings?: typeof halvingEvents) {
  // Function intentionally returns empty array - kept for backward compatibility
  return [];
}
