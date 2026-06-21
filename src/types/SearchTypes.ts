export interface SearchResult {
  id: string;
  type: "patient" | "invoice" | "receipt" | "visit" | "treatment" | "payment";
  title: string;
  subtitle: string;
  route?: string;
}

export interface SearchCategory {
  label: string;
  labelFa?: string;
  results: SearchResult[];
}
