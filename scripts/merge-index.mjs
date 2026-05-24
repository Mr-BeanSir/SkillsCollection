#!/usr/bin/env node

/**
 * 合并脚本：检测 PR 中 skills/*.json 的变更，更新 index.json
 *
 * 用法：node scripts/merge-index.mjs
 * 环境：在 GitHub Actions 中运行，需要 GITHUB_TOKEN
 *
 * 逻辑：
 * - 新增的集合 JSON → 追加到 index.json
 * - 修改的集合 JSON → 覆盖 index.json 中对应条目
 * - 删除的集合 JSON → 从 index.json 移除对应条目
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, basename } from "node:path";

const SKILLS_DIR = "skills";
const INDEX_PATH = "index.json";

function getChangedFiles() {
  // PUSH_BEFORE: push event 携带的变更前 SHA，支持多 commit push
  // 未设置时回退到 HEAD~1（单次直接 push）
  const before = process.env.PUSH_BEFORE;
  const range = before ? `${before}..HEAD` : "HEAD~1..HEAD";
  const diff = execSync(`git diff --name-status ${range}`, {
    encoding: "utf-8",
  }).trim();

  if (!diff) return { added: [], modified: [], deleted: [] };

  const added = [];
  const modified = [];
  const deleted = [];

  for (const line of diff.split("\n")) {
    const parts = line.split("\t");
    const status = parts[0];
    const filePath = parts[1];
    if (!filePath || !filePath.startsWith(SKILLS_DIR + "/")) continue;
    if (!filePath.endsWith(".json")) continue;

    switch (status[0]) {
      case "A":
        added.push(filePath);
        break;
      case "M":
        modified.push(filePath);
        break;
      case "D":
        deleted.push(filePath);
        break;
      // R (rename) = delete old + add new, 输出格式: R100\told\tnew
      case "R": {
        const newPath = parts[2];
        if (newPath) {
          deleted.push(filePath);
          added.push(newPath);
        }
        break;
      }
    }
  }

  return { added, modified, deleted };
}

function loadIndex() {
  if (!existsSync(INDEX_PATH)) {
    return { version: 1, collections: [] };
  }
  return JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
}

function saveIndex(index) {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n", "utf-8");
}

function readCollectionJson(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  // 基本字段校验
  if (!data.title || !data.description || !data.version || !Array.isArray(data.skills)) {
    throw new Error(`${filePath}: 缺少必填字段 (title, description, version, skills)`);
  }

  return {
    title: data.title,
    description: data.description,
    version: data.version,
    totalSkills: data.skills.length,
  };
}

function upsertCollection(index, filePath, meta) {
  const existingIdx = index.collections.findIndex((c) => c.file === filePath);
  const entry = {
    title: meta.title,
    description: meta.description,
    version: meta.version,
    totalSkills: meta.totalSkills,
    file: filePath,
  };

  if (existingIdx >= 0) {
    index.collections[existingIdx] = entry;
  } else {
    index.collections.push(entry);
  }
}

function removeCollection(index, filePath) {
  index.collections = index.collections.filter((c) => c.file !== filePath);
}

function main() {
  const { added, modified, deleted } = getChangedFiles();
  const allChanged = [...added, ...modified, ...deleted];

  if (allChanged.length === 0) {
    console.log("没有 skills/ 目录下的 JSON 文件变更，跳过");
    return;
  }

  const index = loadIndex();
  let changed = false;

  // 处理新增和修改
  for (const filePath of [...added, ...modified]) {
    try {
      const meta = readCollectionJson(filePath);
      upsertCollection(index, filePath, meta);
      changed = true;
      console.log(`✅ ${added.includes(filePath) ? "新增" : "更新"}: ${filePath} (${meta.title})`);
    } catch (err) {
      console.error(`❌ 处理 ${filePath} 失败: ${err.message}`);
      process.exit(1);
    }
  }

  // 处理删除
  for (const filePath of deleted) {
    removeCollection(index, filePath);
    changed = true;
    console.log(`🗑️  删除: ${filePath}`);
  }

  if (changed) {
    saveIndex(index);
    console.log(`\n📝 index.json 已更新，当前 ${index.collections.length} 个集合`);
  }
}

main();
