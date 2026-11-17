export type DetectedCard={rank:string;suit:string;wild:boolean;confidence:'high'|'low'};
export type DetectedGroup={kind:'sequence'|'lavadeira';cards:DetectedCard[]};
export type Detection={groups:DetectedGroup[];warnings:string[]};
export const validRanks:string[];
export const validSuits:string[];
export const detectionSchema:object;
export function validateDetection(value:unknown):Detection;
