// src/data/btcCycleEvents.ts

// Empty arrays - we're removing all historical markers per spec
export const cycleEvents: any[] = [];
export const halvingEvents: any[] = [];

// Only keeping projected top
export const projectedEvents = [
  { date: '2025-11-28', type: 'top', label: 'Projected Top' },
];

// Historical cycle data for computing spans
const historicalCycles = [
  { 
    startDate: '2011-12-01', // Approximate cycle start
    topDate: '2013-12-04',
    bottomDate: '2015-01-14',
    label: '2013 CYCLE'
  },
  { 
    startDate: '2015-01-14',
    topDate: '2017-12-17',
    bottomDate: '2018-12-15',
    label: '2017 CYCLE'
  },
  { 
    startDate: '2018-12-15',
    topDate: '2021-11-10',
    bottomDate: '2022-11-21',
    label: '2021 CYCLE'
  },
];

// Projected cycle
const projectedCycle = {
  startDate: '2022-11-21',
  topDate: '2025-11-28',
  bottomDate: '2026-10-29',
  label: '2025 CYCLE',
  isProjected: true
};

// Helper to calculate days between dates
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate cycle spans for rendering
export function generateCycleSpans() {
  const spans: any[] = [];
  
  // Historical cycles
  historicalCycles.forEach((cycle, index) => {
    // Bull phase: start → top
    spans.push({
      x1: new Date(cycle.startDate).getTime(),
      x2: new Date(cycle.topDate).getTime(),
      label: cycle.label,
      phase: 'bull',
      duration: daysBetween(cycle.startDate, cycle.topDate),
      isProjected: false
    });
    
    // Bear phase: top → bottom
    spans.push({
      x1: new Date(cycle.topDate).getTime(),
      x2: new Date(cycle.bottomDate).getTime(),
      label: null, // No label for bear phase
      phase: 'bear',
      duration: daysBetween(cycle.topDate, cycle.bottomDate),
      isProjected: false
    });
  });
  
  // Projected cycle
  spans.push({
    x1: new Date(projectedCycle.startDate).getTime(),
    x2: new Date(projectedCycle.topDate).getTime(),
    label: projectedCycle.label,
    phase: 'bull',
    duration: daysBetween(projectedCycle.startDate, projectedCycle.topDate),
    isProjected: true
  });
  
  // Projected bear phase
  spans.push({
    x1: new Date(projectedCycle.topDate).getTime(),
    x2: new Date(projectedCycle.bottomDate).getTime(),
    label: null,
    phase: 'bear',
    duration: daysBetween(projectedCycle.topDate, projectedCycle.bottomDate),
    isProjected: true
  });
  
  return spans;
}

// Legacy function - keeping for compatibility but returns empty array
export function calculateCycleMeta(events: typeof cycleEvents, halvings: typeof halvingEvents) {
  return [];
}