#!/usr/bin/env node

/**
 * 校验脚本：检查 skills/*.json 的格式和 source_ref 仓库是否存在
 *
 * 用法：node scripts/validate.mjs [file1.json file2.json ...]
 * 不传参数则校验 skills/ 下所有 JSON 文件
 *
 * 校验规则：
 * 1. JSON 语法合法
 * 2. 必填字段：title, description, version, skills
 * 3. skills 数组每个 item 必须有：name, description, source_type, source_ref
 * 4. source_type 必须是 "github"
 * 5. source_ref 对应的 GitHub 仓库必须存在
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = "skills";

async function checkRepoExists(sourceRef) {
  try {
    const resp = await fetch(`https://api.github.com/repos/${sourceRef}`, {
      method: "HEAD",
      headers: { "User-Agent": "SkillsCollection-CI" },
    });
    return resp.ok;
  } catch {
    // 网络错误时不阻塞，只警告
    console.warn(`  ⚠️  无法校验仓库 ${sourceRef}（网络错误）`);
    return true;
  }
}

function validateJsonStructure(filePath, data) {
  const errors = [];

  // 集合级字段
  if (typeof data.title !== "string" || !data.title.trim()) {
    errors.push("缺少或无效的 title");
  }
  if (typeof data.description !== "string" || !data.description.trim()) {
    errors.push("缺少或无效的 description");
  }
  if (typeof data.version !== "string" || !data.version.trim()) {
    errors.push("缺少或无效的 version");
  }
  if (!Array.isArray(data.skills)) {
    errors.push("缺少 skills 数组");
    return errors; // 无法继续校验
  }
  if (data.skills.length === 0) {
    errors.push("skills 数组不能为空");
  }

  // 每个 skill 的字段
  for (let i = 0; i < data.skills.length; i++) {
    const skill = data.skills[i];
    const prefix = `skills[${i}]`;

    if (typeof skill.name !== "string" || !skill.name.trim()) {
      errors.push(`${prefix}: 缺少 name`);
    }
    if (typeof skill.description !== "string" || !skill.description.trim()) {
      errors.push(`${prefix}: 缺少 description`);
    }
    if (skill.source_type !== "github") {
      errors.push(`${prefix}: source_type 必须是 "github"，当前值: "${skill.source_type}"`);
    }
    if (typeof skill.source_ref !== "string" || !skill.source_ref.includes("/")) {
      errors.push(`${prefix}: source_ref 格式无效，应为 "owner/repo"`);
    }
  }

  return errors;
}

async function validateFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`❌ ${filePath}: 无法读取文件 - ${err.message}`);
    return false;
  }

  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`❌ ${filePath}: JSON 语法错误 - ${err.message}`);
    return false;
  }

  const errors = validateJsonStructure(filePath, data);
  if (errors.length > 0) {
    console.error(`❌ ${filePath}:`);
    for (const err of errors) {
      console.error(`   - ${err}`);
    }
    return false;
  }

  // 校验 source_ref 仓库是否存在
  const sourceRefs = [...new Set(data.skills.map((s) => s.source_ref))];
  for (const ref of sourceRefs) {
    const exists = await checkRepoExists(ref);
    if (!exists) {
      console.error(`❌ ${filePath}: 仓库 ${ref} 不存在`);
      return false;
    }
  }

  console.log(`✅ ${filePath}: 校验通过 (${data.skills.length} 个 skills)`);
  return true;
}

async function main() {
  let files = process.argv.slice(2);

  if (files.length === 0) {
    // 校验 skills/ 下所有 JSON
    files = readdirSync(SKILLS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(SKILLS_DIR, f));
  }

  if (files.length === 0) {
    console.log("没有需要校验的文件");
    return;
  }

  console.log(`校验 ${files.length} 个文件...\n`);

  let allPassed = true;
  for (const file of files) {
    const passed = await validateFile(file);
    if (!passed) allPassed = false;
  }

  if (!allPassed) {
    console.error("\n校验失败");
    process.exit(1);
  }

  console.log("\n全部通过");
}

main();
