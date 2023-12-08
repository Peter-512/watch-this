export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			movies: {
				Row: {
					content: Json;
					embedding: number[];
					imdbid: string;
					token_count: number;
				};
				Insert: {
					content: Json;
					embedding: number[];
					imdbid: string;
					token_count: number;
				};
				Update: {
					content?: Json;
					embedding?: number[];
					imdbid?: string;
					token_count?: number;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			find_closest_movies: {
				Args: {
					embedding: number[];
					match_threshold: number;
					match_count: number;
				};
				Returns: {
					content: Json;
					similarity: number;
				}[];
			};
			hnswhandler: {
				Args: {
					'': unknown;
				};
				Returns: unknown;
			};
			ivfflathandler: {
				Args: {
					'': unknown;
				};
				Returns: unknown;
			};
			vector_avg: {
				Args: {
					'': number[];
				};
				Returns: string;
			};
			vector_dims: {
				Args: {
					'': string;
				};
				Returns: number;
			};
			vector_norm: {
				Args: {
					'': string;
				};
				Returns: number;
			};
			vector_out: {
				Args: {
					'': string;
				};
				Returns: unknown;
			};
			vector_send: {
				Args: {
					'': string;
				};
				Returns: string;
			};
			vector_typmod_in: {
				Args: {
					'': unknown[];
				};
				Returns: number;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
