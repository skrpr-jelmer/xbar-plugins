#!/usr/bin/env -S -P/${HOME}/.deno/bin:/usr/local/bin:/opt/homebrew/bin deno run --allow-read --allow-net
import { xbar, separator } from 'https://deno.land/x/xbar@v2.1.0/mod.ts';
import { Octokit } from 'npm:@octokit/rest';
import { MenuItem } from 'https://deno.land/x/xbar@v2.1.0/src/types.d.ts';
import { parse } from 'https://deno.land/std@0.177.0/encoding/yaml.ts';
import { formatDistanceToNow } from 'npm:date-fns';

const start = new Date();

const config = parse(await Deno.readTextFile('./.config.yml'));

// Your tracked repos
const REPOS = config.github.repos.map((repo: string) => repo.split('/'));

const MENU_BAR_ICON =
    'PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAzNCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfMjEpIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAxXzFfMjEpIj4KPHBhdGggZD0iTTYgMTIuNjY2N0MyLjY2NjY3IDEzLjY2NjcgMi42NjY2NyAxMSAxLjMzMzM0IDEwLjY2NjdNMTAuNjY2NyAxNC42NjY3VjEyLjA4NjdDMTAuNjkxNyAxMS43Njg4IDEwLjY0ODcgMTEuNDQ5MiAxMC41NDA3IDExLjE0OTJDMTAuNDMyNiAxMC44NDkyIDEwLjI2MiAxMC41NzU2IDEwLjA0IDEwLjM0NjdDMTIuMTMzMyAxMC4xMTMzIDE0LjMzMzMgOS4zMiAxNC4zMzMzIDUuNjhDMTQuMzMzMiA0Ljc0OTIyIDEzLjk3NTEgMy44NTQxMyAxMy4zMzMzIDMuMThDMTMuNjM3MiAyLjM2NTY3IDEzLjYxNTggMS40NjU1NyAxMy4yNzMzIDAuNjY2NjY2QzEzLjI3MzMgMC42NjY2NjYgMTIuNDg2NyAwLjQzMzMzMiAxMC42NjY3IDEuNjUzMzNDOS4xMzg2OCAxLjIzOTIxIDcuNTI4IDEuMjM5MjEgNiAxLjY1MzMzQzQuMTggMC40MzMzMzIgMy4zOTMzNCAwLjY2NjY2NiAzLjM5MzM0IDAuNjY2NjY2QzMuMDUwOTIgMS40NjU1NyAzLjAyOTQzIDIuMzY1NjcgMy4zMzMzNCAzLjE4QzIuNjg2NzUgMy44NTkxMyAyLjMyODM1IDQuNzYyMzEgMi4zMzMzNCA1LjdDMi4zMzMzNCA5LjMxMzMzIDQuNTMzMzQgMTAuMTA2NyA2LjYyNjY3IDEwLjM2NjdDNi40MDczMyAxMC41OTMzIDYuMjM4MTggMTAuODYzNiA2LjEzMDIxIDExLjE1OTlDNi4wMjIyNCAxMS40NTYzIDUuOTc3ODcgMTEuNzcyIDYgMTIuMDg2N1YxNC42NjY3IiBzdHJva2U9IiNGM0VCRTgiIHN0cm9rZS13aWR0aD0iMS4zMzMzMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPHBhdGggZD0iTTI4LjY2NjcgMTRWMTIuNjY2N0MyOC42NjY3IDExLjk1OTQgMjguMzg1NyAxMS4yODExIDI3Ljg4NTYgMTAuNzgxQzI3LjM4NTUgMTAuMjgxIDI2LjcwNzIgMTAgMjYgMTBIMjEuMzMzM0MyMC42MjYxIDEwIDE5Ljk0NzggMTAuMjgxIDE5LjQ0NzcgMTAuNzgxQzE4Ljk0NzYgMTEuMjgxMSAxOC42NjY3IDExLjk1OTQgMTguNjY2NyAxMi42NjY3VjE0IiBzdHJva2U9IiNGM0VCRTgiIHN0cm9rZS13aWR0aD0iMS4zMzMzMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yMy42NjY3IDcuMzMzMzNDMjUuMTM5NCA3LjMzMzMzIDI2LjMzMzMgNi4xMzk0MyAyNi4zMzMzIDQuNjY2NjdDMjYuMzMzMyAzLjE5MzkxIDI1LjEzOTQgMiAyMy42NjY3IDJDMjIuMTkzOSAyIDIxIDMuMTkzOTEgMjEgNC42NjY2N0MyMSA2LjEzOTQzIDIyLjE5MzkgNy4zMzMzMyAyMy42NjY3IDcuMzMzMzNaIiBzdHJva2U9IiNGM0VCRTgiIHN0cm9rZS13aWR0aD0iMS4zMzMzMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yOS4zMzMzIDcuMzMzMzNMMzAuNjY2NyA4LjY2NjY3TDMzLjMzMzMgNiIgc3Ryb2tlPSIjRjNFQkU4IiBzdHJva2Utd2lkdGg9IjEuMzMzMzMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzFfMjEiPgo8cmVjdCB3aWR0aD0iMzQiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjxjbGlwUGF0aCBpZD0iY2xpcDFfMV8yMSI+CjxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K';

const octokit = new Octokit({ auth: config.github.auth_key });

const output: MenuItem[] = [];

let reviewRequestedCount = 0;

for (const [owner, repo] of REPOS) {
    const pulls = [];
    let page = 1;

    while (page < 100) {
        const { data } = await octokit.rest.pulls.list({
            owner,
            repo,
            status: 'open',
            per_page: 100,
            page: page++,
        });

        if (data.length === 0) {
            break;
        }

        pulls.push(...data);
    }

    const reviewRequestedPulls = pulls.filter(
        (pull) =>
            pull.requested_reviewers.filter(
                (reviewer) => reviewer.login === config.github.user
            ).length > 0 &&
            pull.assignees?.filter(
                (assignee) => assignee.login === config.github.user
            ).length === 0 &&
            !config.github.ignored_authors.includes(pull.user.login)
    );

    if (reviewRequestedPulls.length === 0) {
        continue;
    }

    reviewRequestedCount += reviewRequestedPulls.length;

    output.push(
        {
            text: `${owner}/${repo}`,
            href: `https://github.com/${owner}/${repo}`,
            submenu: [
                {
                    text: 'Issues',
                    href: `https://github.com/${owner}/${repo}/issues`,
                },
                {
                    text: 'Pull Requests',
                    href: `https://github.com/${owner}/${repo}/pulls`,
                },
            ],
        },
        ...reviewRequestedPulls.map((pull) => {
            return {
                text: `#${pull.number} - ${pull.title}`,
                href: pull.html_url,
                submenu: [
                    {
                        text: 'Open Pull Request',
                        href: pull.html_url,
                    },
                    {
                        text: 'Requested Reviewers:',
                    },
                    ...pull.requested_reviewers.map((reviewer) => ({
                        text: `- ${reviewer.login}`,
                        href: reviewer.html_url,
                        color: 'white',
                    })),
                ],
            };
        }),
        separator
    );
}

xbar([
    {
        text: reviewRequestedCount > 0 ? `(${reviewRequestedCount})` : '',
        templateImage: MENU_BAR_ICON,
    },
    separator,
    ...output,
    {
        text: `Refreshed at ${new Date().toLocaleTimeString()} in ${formatDistanceToNow(
            start,
            { includeSeconds: true }
        )}`,
        refresh: true,
    },
]);
