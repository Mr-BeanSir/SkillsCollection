# ADR-0001: 集合 JSON 采用纯元数据格式

## 状态

已接受

## 背景

SkillsCollection 需要定义集合 JSON 的格式。两种方案：
- **自包含**：JSON 内嵌 SKILL.md 全文及 scripts/references 等资源
- **纯元数据**：JSON 只存储 skill 的来源信息（source_type, source_ref），实际内容由 SkillsManager 从源仓库获取

## 决策

采用纯元数据格式。每个 skill 只存储 `name`、`description`、`source_type`、`source_ref`。

## 原因

1. **避免冗余**：skill 内容已在源仓库维护，无需复制到 SkillsCollection
2. **自动更新**：SkillsManager 安装时从源仓库获取最新版本，而非依赖集合中可能过时的快照
3. **文件体积**：自包含格式会导致 JSON 膨胀（如 web-access 含大量 scripts 和 references）
4. **职责分离**：SkillsCollection 只做注册表，不做内容托管
5. **与 SkillsManager 现有机制一致**：SkillsManager 通过 clone 仓库 + 扫描 SKILL.md 安装 skill，无需集合提供内容

## 后果

- 集合 JSON 不可独立使用，必须依赖源仓库
- 源仓库删除或私有化会导致 skill 无法安装
- 字段命名遵循 SkillsManager SQLite schema（snake_case），而非 skills-lock.json 的 camelCase
