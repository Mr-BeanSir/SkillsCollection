# CONTEXT.md

## 术语

### SkillsCollection
GitHub 仓库，存储 skills 集合的元数据注册表。SkillsManager 从这里读取集合信息供用户浏览和安装。

### 集合 (Collection)
一个 JSON 文件（如 `skills/basic-skills.json`），描述一组相关 skill 的元数据。包含 `title`、`description`、`version` 和 `skills` 数组。集合本身不包含 skill 的实际内容，只存储来源信息。

### Skill
一个可安装的 agent 能力扩展包，由 SKILL.md（YAML frontmatter + Markdown 指令）及可选的 scripts/references/assets 组成。skill 的实际内容存储在各自的 GitHub 源仓库中。

### source_ref
skill 来源仓库的 `owner/repo` 标识（如 `obra/superpowers`）。SkillsManager 通过 clone 此仓库并扫描 SKILL.md 来安装 skill。

### source_type
skill 来源类型。当前只支持 `"github"`。

### index.json
仓库根目录的集合索引文件。聚合所有 `skills/*.json` 的 `title`、`description`、`version`、`file` 字段。SkillsManager 启动时读取此文件展示可用集合。

## 架构

```
SkillsCollection 仓库
├── index.json                    ← 集合索引（自动生成）
└── skills/
    ├── basic-skills.json         ← 集合：基础skills
    └── <其他集合>.json           ← 未来可扩展
```

## 数据流

```
用户提交 PR（skills/*.json）
    ↓
GitHub Actions CI 校验（JSON 格式 + source_ref 仓库存在性）
    ↓
校验通过 → 自动更新 index.json 并提交到 PR 分支
    ↓
人工 approve → 手动合并到 main
    ↓
SkillsManager 从 GitHub 读取 index.json → 展示集合
    ↓
用户点击集合 → 读取 skills/*.json → 展示 skill 列表
    ↓
用户安装集合 → clone 源仓库 → 扫描 SKILL.md → 安装 → 自动创建同名分组
```
