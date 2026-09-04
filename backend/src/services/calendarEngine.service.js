import { crops } from "../data/crops.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Given a crop key and the sowing/transplanting date, returns the current
 * growth stage, how far into it we are, and what's coming next.
 */
export function getCropStageInfo(cropKey, sowingDateStr) {
  const cropData = crops[cropKey];
  if (!cropData) {
    throw new Error(`Unknown crop: ${cropKey}`);
  }

  const sowingDate = new Date(sowingDateStr);
  const today = new Date();

  // Normalize both to midnight so we're comparing whole days
  sowingDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const daysSinceSowing = Math.floor((today - sowingDate) / MS_PER_DAY);

  if (daysSinceSowing < 0) {
    return {
      crop: cropData.label,
      status: "not_yet_sown",
      message: `${cropData.trackFrom === "transplanting" ? "Transplanting" : "Sowing"} date is in the future.`,
      daysUntilStart: Math.abs(daysSinceSowing),
    };
  }

  // Walk through the stages, accumulating days, to find which one we're in
  let cumulativeDays = 0;
  for (let i = 0; i < cropData.stages.length; i++) {
    const stage = cropData.stages[i];
    const stageStart = cumulativeDays;
    const stageEnd = cumulativeDays + stage.durationDays;

    if (daysSinceSowing >= stageStart && daysSinceSowing < stageEnd) {
      const dayWithinStage = daysSinceSowing - stageStart + 1;
      const daysRemainingInStage = stageEnd - daysSinceSowing;
      const nextStage = cropData.stages[i + 1] || null;

      return {
        crop: cropData.label,
        icon: cropData.icon,
        status: "in_progress",
        daysSinceSowing,
        currentStage: {
          name: stage.name,
          dayWithinStage,
          totalDaysInStage: stage.durationDays,
          daysRemainingInStage,
          care: stage.care,
          npk: stage.npk,
        },
        nextStage: nextStage
          ? { name: nextStage.name, startsInDays: daysRemainingInStage }
          : null,
      };
    }

    cumulativeDays = stageEnd;
  }

  // Past all defined stages -> crop should have been harvested
  return {
    crop: cropData.label,
    icon: cropData.icon,
    status: "past_maturity",
    daysSinceSowing,
    message: `This crop is ${daysSinceSowing - cumulativeDays} days past its expected maturity window. If not yet harvested, check crop condition closely.`,
  };
}

/**
 * Suggests whether now is a good time to sow/transplant this crop,
 * based on the crop's recommended sowing window and today's date.
 */
export function checkSowingWindow(cropKey) {
  const cropData = crops[cropKey];
  if (!cropData) throw new Error(`Unknown crop: ${cropKey}`);

  const today = new Date();
  const currentMMDD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const { start, end } = cropData.sowingWindow;
  const inWindow = isDateInRange(currentMMDD, start, end);

  return {
    crop: cropData.label,
    recommendedWindow: `${start} to ${end}`,
    isCurrentlyIdealWindow: inWindow,
  };
}

function isDateInRange(currentMMDD, start, end) {
  // Handles windows that don't cross the new year (e.g. 06-15 to 07-15)
  if (start <= end) {
    return currentMMDD >= start && currentMMDD <= end;
  }
  // Handles windows that DO cross the new year (e.g. 11-15 to 01-05)
  return currentMMDD >= start || currentMMDD <= end;
}