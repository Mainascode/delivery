export function getCurrentPricing(weatherMode = "NORMAL") {
  const hour = Number(
    new Intl.DateTimeFormat("en-KE", {
      timeZone: "Africa/Nairobi",
      hour: "numeric",
      hour12: false
    }).format(new Date())
  );

  const mode = weatherMode === "RAIN" ? "RAIN" : "NORMAL";

  if (hour >= 6 && hour < 9) {
    return {
      fee: mode === "RAIN" ? 120 : 100,
      mode,
      rule: "6am–9am",
      available: true
    };
  }

  if (hour >= 9 && hour < 17) {
    return {
      fee: mode === "RAIN" ? 70 : 50,
      mode,
      rule: "9am–5pm",
      available: true
    };
  }

  if (hour >= 17 && hour < 22) {
    return {
      fee: mode === "RAIN" ? 120 : 100,
      mode,
      rule: "5pm–10pm",
      available: true
    };
  }

  return {
    fee: 0,
    mode,
    rule: "Outside operating hours",
    available: false
  };
}