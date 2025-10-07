import { Controller, Get, Query } from '@nestjs/common';
import { GithubService } from './github.service';
import { toMarkdownReport } from './utils/markdown-report';

@Controller('github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('report')
  async getReport(@Query('owner') owner: string, @Query('repo') repo: string) {
    const info = await this.github.analyzeRepo(owner, repo);
    const md = toMarkdownReport(info);
    return { ...info, markdown: md };
  }
}
