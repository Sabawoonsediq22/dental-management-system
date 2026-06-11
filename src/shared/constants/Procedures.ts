export const PROCEDURES: Procedure[] = [
  { id: "PROC-001", name: "Examination", price: 200, additional_note: "Initial examination" },
  { id: "PROC-002", name: "Simple Filling", price: 1500, additional_note: "Basic dental filling" },
  { id: "PROC-003", name: "RCT", price: 2000, additional_note: "Root canal treatment" },
  { id: "PROC-004", name: "Zirconium Crown", price: 100, additional_note: "Zirconium dental crown" },
  { id: "PROC-005", name: "PMF Crown", price: 2000, additional_note: "Porcelain fused metal crown" },
  { id: "PROC-006", name: "Metal Crown", price: 1500, additional_note: "Full metal crown" },
  { id: "PROC-007", name: "Veneer Direct", price: 2000, additional_note: "Direct veneer placement" },
  { id: "PROC-008", name: "Extraction (Simple)", price: 500, additional_note: "Simple tooth extraction" },
  { id: "PROC-009", name: "Extraction (Complex)", price: 1500, additional_note: "Complex tooth extraction" },
  { id: "PROC-010", name: "Extraction (Surgical)", price: 3000, additional_note: "Surgical extraction" },
  { id: "PROC-011", name: "Mucocele Removing", price: 5000, additional_note: "Mucocele removal procedure" },
  { id: "PROC-012", name: "Crown Lengthening", price: 1500, additional_note: "Crown lengthening surgery" },
  { id: "PROC-013", name: "RCT + Post Corel + Crown", price: 5000, additional_note: "Complete root canal with post and crown" },
  { id: "PROC-014", name: "Dentures Upper Lower", price: 30000, additional_note: "Full denture set" },
  { id: "PROC-015", name: "Orthodontics (Basic)", price: 300, additional_note: "Basic orthodontic treatment" },
  { id: "PROC-016", name: "Orthodontics (Standard)", price: 400, additional_note: "Standard orthodontic treatment" },
  { id: "PROC-017", name: "Orthodontics Visit", price: 1500, additional_note: "Orthodontic follow-up" },
  { id: "PROC-018", name: "Implant Surgery Only (Standard)", price: 400, additional_note: "Standard implant surgery" },
  { id: "PROC-019", name: "Implant Surgery Only (Premium)", price: 500, additional_note: "Premium implant surgery" },
  { id: "PROC-020", name: "Scaling & Polishing", price: 1500, additional_note: "Cleaning and polishing" },
  { id: "PROC-021", name: "Bleaching", price: 100, additional_note: "Teeth whitening" },
  { id: "PROC-022", name: "Old Crown Cementation Fee", price: 150, additional_note: "Cementation fee" },
];

export interface Procedure {
  id: string;
  name: string;
  additional_note?: string | null;
  price: number;
}