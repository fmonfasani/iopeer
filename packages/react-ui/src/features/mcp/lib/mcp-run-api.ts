import { api } from '@/lib/api';
import { McpRun, ListMcpRunRequest, SeekPage } from '@IOpeer/shared';

export const mcpRunApi = {
  async list(request: ListMcpRunRequest): Promise<SeekPage<McpRun>> {
    return await api.get<SeekPage<McpRun>>(`/v1/mcp-runs`, request);
  },
};
