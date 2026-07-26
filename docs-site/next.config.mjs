/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;
const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.replace(/.*?\//, '') : '';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isGithubActions && repo ? `/${repo}` : '',
};

export default nextConfig;
