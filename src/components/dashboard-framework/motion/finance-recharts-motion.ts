import { FINANCE_SECTION_CHART_S } from "./finance-intro-schedule";

export function financeRechartsMotion(
  playIntro: boolean,
  motionEnabled: boolean,
  revealValues: boolean,
) {
  const active = motionEnabled && revealValues && playIntro;
  return {
    isAnimationActive: active,
    animationDuration: active ? FINANCE_SECTION_CHART_S * 1000 : 0,
  };
}
