import dataset from "../../../data/interactions.json";
import type { Dataset } from "./types";

export * from "./types";
export * from "./normalize";
export * from "./matcher";
export * from "./snapshot";

/** The bundled starter dataset (see data/interactions.json). */
export const defaultDataset = dataset as unknown as Dataset;
