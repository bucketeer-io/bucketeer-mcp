// Bucketeer API types
export enum VariationType {
	STRING = "STRING",
	BOOLEAN = "BOOLEAN",
	NUMBER = "NUMBER",
	JSON = "JSON",
}

// Common types
export interface StringListValue {
	values: string[];
}

export interface Variation {
	id: string;
	value: string;
	name: string;
	description: string;
}

export interface Target {
	variation: string;
	users: string[];
}

export interface Clause {
	id: string;
	attribute: string;
	operator: string;
	values: string[];
}

export interface Rule {
	id: string;
	strategy: Strategy;
	clauses: Clause[];
}

export interface Prerequisite {
	featureId: string;
	variationId: string;
}

export interface Strategy {
	type: "FIXED" | "ROLLOUT";
	fixedStrategy?: {
		variation: string;
	};
	rolloutStrategy?: {
		variations: Array<{
			variation: string;
			weight: number;
		}>;
	};
}

export interface Feature {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	archived: boolean;
	deleted: boolean;
	variations: Variation[];
	targets?: Target[];
	rules?: Rule[];
	defaultStrategy: Strategy;
	offVariation: string;
	tags: string[];
	maintainer?: string;
	version: number;
	createdAt: number;
	updatedAt: number;
	variationType?: string;
	prerequisites?: any[];
	lastUsedInfo?: any;
	samplingSeed?: string;
	autoOpsRulesSummary?: any;
}

// Request types
export interface ListFeaturesRequest {
	environmentId: string;
	pageSize?: number;
	cursor?: string;
	tags?: string[];
	orderBy?: string;
	orderDirection?: "ASC" | "DESC";
	searchKeyword?: string;
	maintainer?: string;
	hasExperiment?: boolean;
	archived?: boolean;
}

export interface CreateFeatureRequest {
	id: string;
	name: string;
	description: string;
	variations: Array<{
		value: string;
		name: string;
		description: string;
	}>;
	tags?: string[];
	defaultOnVariationIndex: number;
	defaultOffVariationIndex: number;
	environmentId: string;
	variationType?: VariationType;
}

export interface GetFeatureRequest {
	id: string;
	environmentId: string;
	featureVersion?: number;
}

export interface UpdateFeatureRequest {
	id: string;
	environmentId: string;
	comment: string;
	name?: string;
	description?: string;
	tags?: StringListValue;
	enabled?: boolean;
	archived?: boolean;
}

// Response types
export interface ListFeaturesResponse {
	features: Feature[];
	cursor?: string;
	totalCount?: number;
}

export interface CreateFeatureResponse {
	feature: Feature;
}

export interface GetFeatureResponse {
	feature: Feature;
}

export interface UpdateFeatureResponse {
	feature: Feature;
}

// Error types
export interface BucketeerError {
	code: number;
	message: string;
	details?: any;
}
