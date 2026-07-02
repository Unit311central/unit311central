const repo = process.env.GITHUB_REPO ?? "barcelonadronecenter";
const owner = process.env.GITHUB_OWNER ?? "paulwfotheringham-cmd";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(1);
}

async function main() {
  const check = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (check.status === 404) {
    const create = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        name: repo,
        private: true,
        description: "BCD Drone Center internal dashboard demo (cloned from Drone Catalyst)",
      }),
    });

    const data = await create.json();
    if (!create.ok) {
      throw new Error(`GitHub create failed: ${JSON.stringify(data)}`);
    }

    console.log(data.clone_url);
    return;
  }

  if (!check.ok) {
    const data = await check.json();
    throw new Error(`GitHub check failed: ${JSON.stringify(data)}`);
  }

  const data = await check.json();
  console.log(data.clone_url);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
