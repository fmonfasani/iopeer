import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import fetch from 'node-fetch';

@Injectable()
export class GithubService {
  private readonly API = 'https://api.github.com/graphql';
  private readonly TOKEN = process.env.GITHUB_TOKEN;

  async analyzeRepo(owner: string, name: string) {
    const query = fs.readFileSync('src/github/queries/repo.graphql', 'utf8');

    const res = await fetch(this.API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { owner, name } }),
    });

    const data = await res.json();

    if (data.errors) {
      throw new Error(JSON.stringify(data.errors, null, 2));
    }

    const repo = data.data.repository;

    return {
      name: repo.name,
      description: repo.description,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      issues: repo.issues.totalCount,
      pulls: repo.pullRequests.totalCount,
      languages: repo.languages.nodes.map((l) => l.name),
      commits: repo.defaultBranchRef?.target?.history?.edges.map((c) => ({
        message: c.node.messageHeadline,
        date: c.node.committedDate,
      })),
      updatedAt: repo.updatedAt,
      url: repo.url,
    };
  }
}
