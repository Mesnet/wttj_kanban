export type Job = {
  id: string
  name: string
}

export type Column = {
  id: string
  name: string
}

export type Candidate = {
  id: number
  email: string
  column_id: string
  position: number
}

export interface ColumnState {
  [key: string]: {
    items: Candidate[];
    hasMore: boolean;
    page: number;
    name: string;
  };
}
