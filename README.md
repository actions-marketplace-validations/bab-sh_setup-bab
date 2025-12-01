<p align="center">
  <img src="https://avatars.githubusercontent.com/u/44036562" height="120" alt="GitHub Actions">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://cdn.bab.sh/l/favicon" height="120" alt="bab">
</p>

# setup-bab

[![CI](https://github.com/bab-sh/setup-bab/actions/workflows/ci.yml/badge.svg)](https://github.com/bab-sh/setup-bab/actions/workflows/ci.yml)
[![Integration Tests](https://github.com/bab-sh/setup-bab/actions/workflows/test.yml/badge.svg)](https://github.com/bab-sh/setup-bab/actions/workflows/test.yml)

GitHub Action to install [bab](https://github.com/bab-sh/bab) CLI - custom commands for every project.

## Usage

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup bab
    uses: bab-sh/setup-bab@v1
    with:
      version: 'latest'

  - name: Run bab commands
    run: |
      bab --version
      bab run build
```

## Inputs

| Input        | Description                                                                                               | Required | Default               |
|--------------|-----------------------------------------------------------------------------------------------------------|----------|-----------------------|
| `version`    | Version of bab to install. Supports `latest`, semver ranges (`0.x`, `0.2.x`), or exact versions (`v0.2.2` or `0.2.2`) | No       | `latest`              |
| `repo-token` | GitHub token for API requests. Helps avoid rate limiting                                                  | No       | `${{ github.token }}` |

## Outputs

| Output    | Description                                 |
|-----------|---------------------------------------------|
| `version` | The exact version of bab that was installed |
| `path`    | Path where bab was installed                |

## Examples

### Install latest version

```yaml
- uses: bab-sh/setup-bab@v1
```

### Install specific version

```yaml
- uses: bab-sh/setup-bab@v1
  with:
    version: 'v0.2.2'
```

### Install latest minor version

```yaml
- uses: bab-sh/setup-bab@v1
  with:
    version: '0.2.x'
```

### Use outputs

```yaml
- name: Setup bab
  id: setup-bab
  uses: bab-sh/setup-bab@v1

- name: Show installed version
  run: echo "Installed bab ${{ steps.setup-bab.outputs.version }}"
```

## Supported Platforms

| OS      | Architectures   |
|---------|-----------------|
| Linux   | x64, arm64, arm |
| macOS   | x64, arm64      |
| Windows | x64             |

## License

MIT
