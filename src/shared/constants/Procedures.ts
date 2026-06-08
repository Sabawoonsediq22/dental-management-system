export const PROCEDURES: Procedure[] = [
  {
    id: "PROC-001",
    name: "Examination",
    description: null,
    default_price: 200,
    category: "General",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-002",
    name: "Simple Filling",
    description: null,
    default_price: 1500,
    category: "Restorative",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-003",
    name: "RCT",
    description: null,
    default_price: 2000,
    category: "Endodontic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-004",
    name: "Zirconium Crown",
    description: null,
    default_price: 100,
    category: "Prosthetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-005",
    name: "PMF Crown",
    description: null,
    default_price: 2000,
    category: "Prosthetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-006",
    name: "Metal Crown",
    description: null,
    default_price: 1500,
    category: "Prosthetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-007",
    name: "Veneer Direct",
    description: null,
    default_price: 2000,
    category: "Cosmetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-008",
    name: "Extraction (Simple)",
    description: null,
    default_price: 500,
    category: "Surgical",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-009",
    name: "Extraction (Complex)",
    description: null,
    default_price: 1500,
    category: "Surgical",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-010",
    name: "Extraction (Surgical)",
    description: null,
    default_price: 3000,
    category: "Surgical",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-011",
    name: "Mucocele Removing",
    description: null,
    default_price: 5000,
    category: "Surgical",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-012",
    name: "Crown Lengthening",
    description: null,
    default_price: 1500,
    category: "Surgical",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-013",
    name: "RCT + Post Corel + Crown",
    description: null,
    default_price: 5000,
    category: "Restorative",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-014",
    name: "Dentures Upper Lower",
    description: null,
    default_price: 30000,
    category: "Prosthetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-015",
    name: "Orthodontics (Basic)",
    description: null,
    default_price: 300,
    category: "Orthodontic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-016",
    name: "Orthodontics (Standard)",
    description: null,
    default_price: 400,
    category: "Orthodontic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-017",
    name: "Orthodontics Visit",
    description: null,
    default_price: 1500,
    category: "Orthodontic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-018",
    name: "Implant Surgery Only (Standard)",
    description: null,
    default_price: 400,
    category: "Implant",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-019",
    name: "Implant Surgery Only (Premium)",
    description: null,
    default_price: 500,
    category: "Implant",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-020",
    name: "Scaling & Polishing",
    description: null,
    default_price: 1500,
    category: "Preventive",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-021",
    name: "Bleaching",
    description: null,
    default_price: 100,
    category: "Cosmetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "PROC-022",
    name: "Old Crown Cementation Fee",
    description: null,
    default_price: 150,
    category: "Prosthetic",
    is_active: true,
    created_at: "",
    updated_at: ""
  },
];

export interface Procedure {
  id: string;
  name: string;
  description: string | null;
  default_price: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}