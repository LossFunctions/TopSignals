# Cycle Event Update ‑ Summary  
*(Covers work completed on 2025-06-05)*  

## 1. Cycle-Event Date Changes  

| Event | Old Date | New Date |
|-------|----------|----------|
| 2015 Bottom | 2015-01-13 | **2015-01-14** |
| 2017 Top    | 2017-12-16 | **2017-12-17** |
| 2018 Bottom | 2018-12-14 | **2018-12-15** |
| 2021 Top    | 2021-11-09 | **2021-11-10** |
| 2022 Bottom | 2022-11-20 / 2022-11-09* | **2022-11-21** |

\* 2022 bottom existed as two variants; both replaced.

---

## 2. Files Updated & Key Edits  

| File | Key Sections Touched | Purpose |
|------|----------------------|---------|
| `src/data/btcCycleEvents.ts` | `cycleEvents`, `historicalCycles`, `currentCycle` arrays | Swapped hard-coded dates to new values. Cycle-span generator now reflects changes. |
| `src/components/MonthlyRsiCard.tsx` | `cycleBottoms` list inside historical-peaks table | Synced 2022 bottom for table calc. |
| `api/btcIndicators.js` | `cycleStart` constant (RSI cycle high logic) | Start of current cycle moved from `2022-11-01` → `2022-11-21`. |
| *(no change needed)* `src/hooks/useBTCHistory.ts`, `src/components/FourYearCycleCard.tsx` already consumed dates from source file; recalculated automatically at runtime. |

---

## 3. Re-calculated Cycle Durations  

| Phase | Dates | New Length (days) |
|-------|-------|-------------------|
| 2015 bottom → 2017 top (bull) | 2015-01-14 → 2017-12-17 | **1 068** |
| 2017 top → 2018 bottom (bear) | 2017-12-17 → 2018-12-15 | **363** |
| 2018 bottom → 2021 top (bull) | 2018-12-15 → 2021-11-10 | **1 061** |
| 2021 top → 2022 bottom (bear) | 2021-11-10 → 2022-11-21 | **376** |
| Current bull (so far) | 2022-11-21 → 2025-06-05 | **927** |

All cycle-span labels in **FourYearCycleCard** now render these updated counts.

---

## 4. Dependent-Metric Verification  

| Metric / Feature | Dependency | Status |
|------------------|------------|--------|
| Cycle-span rendering (`generateCycleSpans`) | `btcCycleEvents` data | ✅ Durations & mid-points refreshed automatically. |
| RSI cycle-high detection (`api/btcIndicators.js`) | `cycleStart` constant | ✅ Updated to `2022-11-21`; peak detection aligns with new bottom. |
| Monthly-RSI historical-peak table | Manual `cycleBottoms` list | ✅ 2022 bottom changed to `2022-11-21`; day-to-bottom calc correct. |
| Projected Top (Oct-18-2025) | Duration logic independent (kept) | ➡️ Unaffected (projection remains valid). |

---

## 5. Impact on RSI Calculations  

Changing `cycleStart` to **2022-11-21**:

* Current-cycle RSI array is now 20 days shorter, slightly altering peak index.
* Cycle-high value/date recalc confirmed via manual test – still **unchanged** (peak month remains Oct-2023), but `cycleHighIsCurrentMonth` flag behaviour unaffected.
* No adverse effect on RSI status thresholds or danger warnings.

---

## 6. Validation Checklist  

- 🔍 `grep` search confirmed **no legacy dates remain**:  
  `2015-01-13`, `2017-12-16`, `2018-12-14`, `2021-11-09`, `2022-11-20`, `2022-11-09` → **0 hits**.

- ✅ All unit-less calculations derive from updated constants; no further code edits required.

---

### Finished
