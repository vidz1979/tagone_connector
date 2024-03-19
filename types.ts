export interface TagoneMessage {
  ID?: string;
  Tipo?: string;
  Icon?: string;
  Title?: string;
  Message?: string;
}

export interface KeysValues {
  Keys: string[];
  Values: string[];
}

export type LoggedClaims = Record<string, string>;

export type OdataExpand = Record<string, OdataQuery> | string;
export type OdataSelect = string[] | string;
export type OdataFilter = string[] | string;
export type OdataOrderBy = string[] | string;

export type OdataQuery = {
  $expand?: OdataExpand;
  $select?: OdataSelect;
  $filter?: OdataFilter;
  $orderby?: OdataOrderBy;
  $top?: number;
  $skip?: number;
  $count?: boolean;
};
