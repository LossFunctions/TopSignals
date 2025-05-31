// src/data/btcCycleEvents.ts

export const cycleEvents = [
  { date: '2013-12-04', type: 'top',    label: 'Cycle Top' },
  { date: '2015-01-14', type: 'bottom', label: 'Cycle Bottom' },
  { date: '2017-12-17', type: 'top',    label: 'Cycle Top' },
  { date: '2018-12-15', type: 'bottom', label: 'Cycle Bottom' },
  { date: '2021-11-10', type: 'top',    label: 'Cycle Top' },
  { date: '2022-11-21', type: 'bottom', label: 'Cycle Bottom' },
];

export const halvingEvents = [
  { date: '2012-11-28', label: '1st Halving' },
  { date: '2016-07-09', label: '2nd Halving' },
  { date: '2020-05-11', label: '3rd Halving' },
  { date: '2024-04-20', label: '4th Halving' },
];

export const projectedEvents = [
  { date: '2025-11-28', type: 'top',    label: 'Projected Top' },
  { date: '2026-10-29', type: 'bottom', label: 'Projected Bottom' },
];

// Helper function to calculate cycle metadata
export function calculateCycleMeta(events: typeof cycleEvents, halvings: typeof halvingEvents) {
  const enrichedEvents = events.map((event, index) => {
    const eventDate = new Date(event.date);
    const enriched: any = { ...event, meta: {} };

    // Calculate days from previous event of same type
    const previousSameType = events
      .slice(0, index)
      .reverse()
      .find(e => e.type === event.type);
    
    if (previousSameType) {
      const prevDate = new Date(previousSameType.date);
      const daysDiff = Math.floor((eventDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      enriched.meta.daysFromPrevious = daysDiff;
    }

    // For tops: calculate days from previous halving
    if (event.type === 'top') {
      const previousHalving = halvings
        .filter(h => new Date(h.date) < eventDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (previousHalving) {
        const halvingDate = new Date(previousHalving.date);
        const daysFromHalving = Math.floor((eventDate.getTime() - halvingDate.getTime()) / (1000 * 60 * 60 * 24));
        enriched.meta.daysFromHalving = daysFromHalving;
        enriched.meta.halvingLabel = previousHalving.label;
      }
    }

    // For bottoms: calculate days from previous top
    if (event.type === 'bottom') {
      const previousTop = events
        .slice(0, index)
        .reverse()
        .find(e => e.type === 'top');
      
      if (previousTop) {
        const topDate = new Date(previousTop.date);
        const daysFromTop = Math.floor((eventDate.getTime() - topDate.getTime()) / (1000 * 60 * 60 * 24));
        enriched.meta.daysFromTop = daysFromTop;
      }
    }

    return enriched;
  });

  return enrichedEvents;
}