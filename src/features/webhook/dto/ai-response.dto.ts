export interface AIResponseDto {
  choices: {
    message: {
      content: string;
      role: string;
      tool_calls?: any[];
    };
    finish_reason: string;
  }[];
  created: number;
  id: string;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  conversation_id?: string;
  search_results?: any[];
}
