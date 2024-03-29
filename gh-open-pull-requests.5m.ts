#!/usr/bin/env -S -P/${HOME}/.deno/bin:/usr/local/bin:/opt/homebrew/bin deno run --allow-read --allow-net
import { parse } from 'https://deno.land/std@0.177.0/encoding/yaml.ts';
import { xbar, separator } from 'https://deno.land/x/xbar@v2.1.0/mod.ts';
import { MenuItem } from 'https://deno.land/x/xbar@v2.1.0/src/types.d.ts';
import { Octokit } from 'npm:@octokit/rest';
import { components } from 'npm:@octokit/openapi-types';
import { formatDistanceToNow } from 'npm:date-fns';

const start = new Date();

interface Config {
    github: {
        user: string;
        auth_key: string;
        repos: string[];
    };
}

const config: Config = parse(
    await Deno.readTextFile('./.config.yml')
) as Config;

const REPOS = config.github.repos.map((repo: string) => repo.split('/'));
const MINIMAL_APPROVES = 2;

const MENU_BAR_ICON =
    'PHN2ZyB3aWR0aD0iMzQiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAzNCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzFfMTMpIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAxXzFfMTMpIj4KPHBhdGggZD0iTTYgMTIuNjY2N0MyLjY2NjY3IDEzLjY2NjcgMi42NjY2NyAxMSAxLjMzMzM0IDEwLjY2NjdNMTAuNjY2NyAxNC42NjY3VjEyLjA4NjdDMTAuNjkxNyAxMS43Njg4IDEwLjY0ODcgMTEuNDQ5MiAxMC41NDA3IDExLjE0OTJDMTAuNDMyNiAxMC44NDkyIDEwLjI2MiAxMC41NzU2IDEwLjA0IDEwLjM0NjdDMTIuMTMzMyAxMC4xMTMzIDE0LjMzMzMgOS4zMiAxNC4zMzMzIDUuNjhDMTQuMzMzMiA0Ljc0OTIyIDEzLjk3NTEgMy44NTQxMyAxMy4zMzMzIDMuMThDMTMuNjM3MiAyLjM2NTY3IDEzLjYxNTggMS40NjU1NyAxMy4yNzMzIDAuNjY2NjY2QzEzLjI3MzMgMC42NjY2NjYgMTIuNDg2NyAwLjQzMzMzMiAxMC42NjY3IDEuNjUzMzNDOS4xMzg2OCAxLjIzOTIxIDcuNTI4IDEuMjM5MjEgNiAxLjY1MzMzQzQuMTggMC40MzMzMzIgMy4zOTMzNCAwLjY2NjY2NiAzLjM5MzM0IDAuNjY2NjY2QzMuMDUwOTIgMS40NjU1NyAzLjAyOTQzIDIuMzY1NjcgMy4zMzMzNCAzLjE4QzIuNjg2NzUgMy44NTkxMyAyLjMyODM1IDQuNzYyMzEgMi4zMzMzNCA1LjdDMi4zMzMzNCA5LjMxMzMzIDQuNTMzMzQgMTAuMTA2NyA2LjYyNjY3IDEwLjM2NjdDNi40MDczMyAxMC41OTMzIDYuMjM4MTggMTAuODYzNiA2LjEzMDIxIDExLjE1OTlDNi4wMjIyNCAxMS40NTYzIDUuOTc3ODcgMTEuNzcyIDYgMTIuMDg2N1YxNC42NjY3IiBzdHJva2U9IiNGM0VCRTgiIHN0cm9rZS13aWR0aD0iMS4zMzMzMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPHBhdGggZD0iTTMwIDE0QzMxLjEwNDYgMTQgMzIgMTMuMTA0NiAzMiAxMkMzMiAxMC44OTU0IDMxLjEwNDYgMTAgMzAgMTBDMjguODk1NCAxMCAyOCAxMC44OTU0IDI4IDEyQzI4IDEzLjEwNDYgMjguODk1NCAxNCAzMCAxNFoiIHN0cm9rZT0iI0YzRUJFOCIgc3Ryb2tlLXdpZHRoPSIxLjMzMzMzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIyIDZDMjMuMTA0NiA2IDI0IDUuMTA0NTcgMjQgNEMyNCAyLjg5NTQzIDIzLjEwNDYgMiAyMiAyQzIwLjg5NTQgMiAyMCAyLjg5NTQzIDIwIDRDMjAgNS4xMDQ1NyAyMC44OTU0IDYgMjIgNloiIHN0cm9rZT0iI0YzRUJFOCIgc3Ryb2tlLXdpZHRoPSIxLjMzMzMzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI2LjY2NjcgNEgyOC42NjY3QzI5LjAyMDMgNCAyOS4zNTk0IDQuMTQwNDggMjkuNjA5NSA0LjM5MDUyQzI5Ljg1OTUgNC42NDA1NyAzMCA0Ljk3OTcxIDMwIDUuMzMzMzNWMTAiIHN0cm9rZT0iI0YzRUJFOCIgc3Ryb2tlLXdpZHRoPSIxLjMzMzMzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTIyIDZWMTQiIHN0cm9rZT0iI0YzRUJFOCIgc3Ryb2tlLXdpZHRoPSIxLjMzMzMzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzEzIj4KPHJlY3Qgd2lkdGg9IjM0IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8Y2xpcFBhdGggaWQ9ImNsaXAxXzFfMTMiPgo8cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==';

const octokit = new Octokit({ auth: config.github.auth_key });

const output: MenuItem[] = [];

let nonApprovedPulls = 0;

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

    output.push({
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
    });

    const myPulls = pulls.filter(
        (pull) =>
            pull.user?.login === config.github.user ||
            pull.assignees?.some((user) => user.login === config.github.user)
    );

    for (const pull of myPulls) {
        const { data: reviews } = await octokit.rest.pulls.listReviews({
            owner,
            repo,
            pull_number: pull.number,
        });

        const latestReviewsByLogin = reviews.reduce<
            Record<string, components['schemas']['pull-request-review']>
        >((reviews, review) => {
            const user = review.user;

            if (!user) {
                return reviews;
            }

            if (!reviews[user.login]) {
                reviews[user.login] = review;

                return reviews;
            }

            if (
                // @ts-ignore
                new Date(review.submitted_at) >
                // @ts-ignore
                new Date(reviews[user.login].submitted_at)
            ) {
                reviews[user.login] = review;
            }

            return reviews;
        }, {});

        for (const reviewer of pull.requested_reviewers ?? []) {
            delete latestReviewsByLogin[reviewer.login];
        }

        const approvedReviewsCount = Object.values(latestReviewsByLogin).reduce(
            (total, review) => total + (review.state === 'APPROVED' ? 1 : 0),
            0
        );
        const hasChangesRequested =
            Object.values(latestReviewsByLogin).reduce(
                (total, review) =>
                    total + (review.state === 'CHANGES_REQUESTED' ? 1 : 0),
                0
            ) > 0;

        if (approvedReviewsCount < MINIMAL_APPROVES) {
            nonApprovedPulls += 1;
        }

        output.push({
            text: `#${
                pull.number
            } (${approvedReviewsCount}/${MINIMAL_APPROVES})${
                hasChangesRequested ? ' ⚠️' : ''
            } - ${pull.title.replace('|', 'ǀ')}`,
            href: pull.html_url,
            color:
                approvedReviewsCount >= MINIMAL_APPROVES
                    ? '#8ace8a'
                    : '#f7a691',
            submenu: [
                {
                    text: `${pull.base.ref} < ${pull.head.ref}`,
                },
                separator,
                {
                    text: 'Open Pull Request',
                    href: pull.html_url,
                },
                separator,
                {
                    text: 'Requested Reviewers:',
                },
                ...(pull.requested_reviewers ?? []).map((reviewer) => ({
                    text: `- ${reviewer.login}`,
                    href: reviewer.html_url,
                })),
                separator,
                {
                    text: 'Reviews:',
                },
                ...Object.values(latestReviewsByLogin).map((review) => ({
                    text: `- ${review.user?.login}: ${review.state}`,
                    href: review.html_url,
                })),
            ],
        });

        if ((pull.requested_reviewers ?? []).length > 0) {
            output.push({
                text: `- ${(pull.requested_reviewers ?? [])
                    .map((reviewer) => reviewer.login)
                    .join(', ')}`,
            });
        }
    }
    output.push(separator);
}

xbar([
    {
        text: nonApprovedPulls > 0 ? `(${nonApprovedPulls})` : '',
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
