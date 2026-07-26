export const HX_CHART_COLORS = {
  carbon: "#050b0f",
  graphite: "#0a1419",
  graphiteSoft: "rgba(10, 20, 25, 0.82)",
  warmWhite: "#e9e8e1",
  muted: "#849495",
  grid: "rgba(177, 196, 196, 0.10)",
  axis: "rgba(177, 196, 196, 0.28)",
  gold: "#c9aa63",
  goldSoft: "rgba(201, 170, 99, 0.18)",
  cyan: "#68c9cf",
  cyanSoft: "rgba(104, 201, 207, 0.16)",
  green: "#82bd8b",
  red: "#c66e68",
  amber: "#c89c5a",
  missing: "#5f6d6e"
} as const;

export const HX_ECHARTS_THEME = {
  color: [
    HX_CHART_COLORS.gold,
    HX_CHART_COLORS.cyan,
    HX_CHART_COLORS.green,
    HX_CHART_COLORS.amber,
    HX_CHART_COLORS.red
  ],
  backgroundColor: "transparent",
  textStyle: {
    color: HX_CHART_COLORS.warmWhite,
    fontFamily: "Arial, Helvetica, sans-serif"
  },
  title: {
    textStyle: {
      color: HX_CHART_COLORS.warmWhite,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontWeight: 500
    },
    subtextStyle: {
      color: HX_CHART_COLORS.muted,
      fontFamily: "Arial, Helvetica, sans-serif"
    }
  },
  legend: {
    textStyle: {
      color: HX_CHART_COLORS.muted,
      fontFamily: "Arial, Helvetica, sans-serif"
    }
  },
  tooltip: {
    backgroundColor: "rgba(3, 8, 11, 0.97)",
    borderColor: "rgba(201, 170, 99, 0.42)",
    borderWidth: 1,
    textStyle: {
      color: HX_CHART_COLORS.warmWhite,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 12
    },
    extraCssText: "box-shadow:0 18px 50px rgba(0,0,0,.42);backdrop-filter:blur(12px);"
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: HX_CHART_COLORS.axis } },
    axisTick: { show: false },
    axisLabel: {
      color: HX_CHART_COLORS.muted,
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 10
    },
    splitLine: { show: false }
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: HX_CHART_COLORS.muted,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 10
    },
    splitLine: { lineStyle: { color: HX_CHART_COLORS.grid } }
  },
  timeAxis: {
    axisLine: { lineStyle: { color: HX_CHART_COLORS.axis } },
    axisTick: { show: false },
    axisLabel: {
      color: HX_CHART_COLORS.muted,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 10
    },
    splitLine: { lineStyle: { color: HX_CHART_COLORS.grid } }
  },
  dataZoom: {
    borderColor: HX_CHART_COLORS.axis,
    backgroundColor: "rgba(255,255,255,.025)",
    fillerColor: HX_CHART_COLORS.goldSoft,
    dataBackground: {
      lineStyle: { color: HX_CHART_COLORS.missing },
      areaStyle: { color: "rgba(95,109,110,.12)" }
    },
    selectedDataBackground: {
      lineStyle: { color: HX_CHART_COLORS.gold },
      areaStyle: { color: HX_CHART_COLORS.goldSoft }
    },
    handleStyle: {
      color: HX_CHART_COLORS.gold,
      borderColor: HX_CHART_COLORS.gold
    },
    moveHandleStyle: { color: HX_CHART_COLORS.muted },
    textStyle: { color: HX_CHART_COLORS.muted }
  }
} as const;
