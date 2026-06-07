export interface ToothData {
  id: string;
  number: number;

  mb?: number;
  b?: number;
  db?: number;

  ml?: number;
  l?: number;
  dl?: number;

  missing?: boolean;
  selected?: boolean;
  implant?: boolean;
  crown?: boolean;
  rootCanal?: boolean;
}