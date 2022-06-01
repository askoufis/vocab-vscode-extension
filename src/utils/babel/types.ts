import * as t from "@babel/types";

export interface ElementName {
  name: string;
  suffix: string;
}
export type ElementNameOccurrences = Record<string, number | undefined>;

export interface TransformState {
  key: string;
  message: string;
  elementNameOccurrences: ElementNameOccurrences;
  translationHookProperties: t.ObjectProperty[];
  elementNameStack: ElementName[];
}

type TransformStateOutput = Pick<TransformState, "key" | "message">;

export interface TransformResult extends TransformStateOutput {
  code: string;
}

export type OnTreeExit = (transformStateOutput: TransformStateOutput) => void;

interface PluginOptions {
  onTreeExit: OnTreeExit;
}

export interface PluginState extends TransformState {
  opts: PluginOptions;
}
