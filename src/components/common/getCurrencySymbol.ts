export const getCurrencySymbol = (procedureName: string): string => {
    const dollarProcedures = [
      "Zirconium Crown",
      "Orthodontics (Basic)",
      "Orthodontics (Standard)",
      "Implant Surgery Only (Standard)",
      "Implant Surgery Only (Premium)",
      "Bleaching",
    ];
    return dollarProcedures.includes(procedureName) ? "$" : "AFN";
  };