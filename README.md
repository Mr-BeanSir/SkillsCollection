# SkillsCollection

Skills 集合注册表。SkillsManager 从这里读取集合信息，供用户浏览和安装。

## 导出你的 skills 为集合

### 方式一：通过 npx 安装的 skills

复制下方 prompt 粘贴到 各Agent Cli中，按引导完成导出：

```
依次询问用户以下问题：
1. 你的 skills 安装在哪个目录？（即包含各 skill 子文件夹的目录，每个子文件夹里有 SKILL.md）
2. skills-lock.json 文件的路径是什么？（用于读取每个 skill 的 source_ref）
3. 你要导出哪些 skills？（列出目录下的所有 skill 供用户选择）

读取用户选定的 skills 的 SKILL.md，从 YAML frontmatter 提取 name 和 description。
读取 skills-lock.json 获取每个 skill 的 source_ref（owner/repo 格式）。

选定后，继续问用户：
4. 你 fork 的 SkillsCollection 仓库地址是什么？（如 https://github.com/你的用户名/SkillsCollection.git）
5. 要把仓库克隆到哪个本地目录？

执行：
  git clone --filter=blob:none <用户fork地址> <用户指定的目录>
  mkdir -p <用户指定的目录>/skills

接着依次问用户：
6. JSON 文件名（如 my-skills，自动补 .json 后缀）
7. title — 集合标题
8. description — 一句话描述
9. version — 版本号，默认 0.0.1

生成 JSON 文件写入 <目录>/skills/<文件名>.json，格式：

{
  "title": "用户输入的标题",
  "description": "用户输入的描述",
  "version": "用户输入的版本",
  "skills": [
    {
      "name": "skill 名称",
      "description": "skill 描述",
      "source_type": "github",
      "source_ref": "owner/repo"
    }
  ]
}

完成后告知用户文件路径，提醒用户 push 到自己的 fork 仓库后，
到 https://github.com/Mr-BeanSir/SkillsCollection 提交 PR。
```

### 方式二：通过 SkillsManager 安装的 skills

SkillsManager 自带导出功能，无需手动操作。
