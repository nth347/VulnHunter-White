import i18n from './index'

/**
 '* The backend has no i18n layer': it emits live-log system messages, HTTPException
 * detail text, pydantic validation errors and a few fixed phase-report titles in
 * Chinese only. This module translates those known strings to English at render
 * time when the UI locale is `en`. LLM-generated content (agent/reasoning log
 * lines, vuln report bodies) is deliberately left untouched.
 *
 * Keep the keys here byte-identical to the backend literals. Interpolated
 '* messages become RULES entries': `{...}` placeholders in the backend f-string are
 * matched by a capture group and re-inserted via `$1`, `$2`, ... Capture groups
 * are passed through FRAGMENTS so an embedded enum label (e.g. the mining mode)
 * is translated too.
 */

// Enum labels produced by *_label() helpers that show up embedded in larger messages.
const FRAGMENTS: Record<string, string> = {
  '赏金模式': 'Bounty mode',
  '全量模式': 'Full mode',
  '自定义模式': 'Custom mode',
  '自定义模式（': 'Custom mode (',
  '未命名': 'Untitled',
  'Web 应用': 'Web app',
  '组件库': 'Component library',
  '混合': 'Mixed',
  '启发式挖掘': 'Heuristic mining',
  '启发式轻量': 'Heuristic lite',
  '快速扫描': 'Fast scan',
  '历史漏洞绕过': 'Historical-vuln bypass',
  '无约束扫描': 'Unconstrained scan',
  '关闭': 'Off',
  '仅静态': 'Static-only',
  '靶场动态': 'Lab dynamic',
  '局部验证': 'Local verification',
  '函数级': 'Function level',
  '模块链': 'Module chain',
  '集成': 'Integration',
  '直接暴露': 'Directly exposed',
  '间接消费型': 'Indirect consumer',
  '中文报告': 'Chinese report',
  '挖掘提示': 'Mining hint',
  'Recon 提示': 'Recon hint',
  '人工靶场说明': 'Manual lab note',
  '续跑说明': 'Resume note',
  '消息': 'Message',
  '提示': 'Hint',
  '地图/鉴权': 'Map/auth',
  '历史漏洞': 'Historical vulns',
  '扩展名': 'Extensions',
  '盖章': 'File weighting',
}

function frag(s: string): string {
  let out = s
  for (const [zh, en] of Object.entries(FRAGMENTS)) {
    if (out.includes(zh)) out = out.split(zh).join(en)
  }
  return out
}

// Control-phase / recon-rerun labels that fill the {label} slot in a few
// pipeline messages. Only consulted by the label-family rules below, so these
// short words never leak into unrelated capture groups.
const CONTROL_LABEL: Record<string, string> = {
  '侦察': 'Recon',
  '代码库': 'Code intelligence',
  '挖掘': 'Mining',
  '审核': 'Review',
  '验证': 'Verification',
  '攻击链': 'Attack chain',
  '地图/鉴权': 'Map/auth',
  '历史漏洞': 'Historical vulns',
}
const ctrl = (zh: string): string => CONTROL_LABEL[zh] ?? frag(zh)

// Full static strings (no interpolation).
const EXACT: Record<string, string> = {
  // --- live_log: recon / pipeline lifecycle ---
  'Recon 完成': 'Recon complete',
  'Recon 提示已更新，下一轮侦察生效': 'Recon hint updated, effective next recon round',
  'Recon 提示已清空，下一轮侦察不再注入': 'Recon hint cleared, no longer injected next recon round',
  '侦察门闩已满足，系统标记 recon_done': 'Recon gate satisfied; system marked recon_done',
  '拉起 Recon 线程': 'Starting Recon thread',
  '拉起盖章（待标记文件，含新入库反编译类）':
    'Starting file weighting (pending files, incl. newly ingested decompiled classes)',
  '开始导入源码': 'Importing source',
  '导入中断且无文件索引，请重新导入': 'Import was interrupted with no file index; please re-import',
  '全部阶段续跑（接续原上下文）': 'All stages resumed (continuing the original context)',
  '用户取消审计': 'User cancelled the audit',
  '用户请求续跑环境搭建': 'User requested to resume lab setup',
  '用户新开环境搭建对话': 'User started a new lab-setup conversation',
  '用户请求重建代码库': 'User requested a code-intelligence rebuild',
  '项目恢复暂停': 'Project returned to paused',
  '项目审计完成（状态门闩满足）': 'Project audit complete (status gate satisfied)',
  '项目完成，已自动停止靶场容器': 'Project complete; lab containers stopped automatically',
  '项目应用指纹暂缺稳定语句，后续确认/验证时再补':
    'Project app fingerprint has no stable statement yet; it will be filled in during later confirmation / verification',
  // --- live_log: mining ---
  '挖掘循环还要继续，重新进入下一轮': 'Mining loop continues; entering the next round',
  '挖掘 Worker 提示已更新，下一轮挖掘生效': 'Mining Worker hint updated, effective next mining round',
  '挖掘 Worker 提示已清空，下一轮挖掘不再注入':
    'Mining Worker hint cleared, no longer injected next mining round',
  '挖掘范围已扩大，项目改回暂停，续跑后按新范围继续':
    'Mining scope expanded; project set back to paused; resume to continue with the new scope',
  '拉起快速扫描准备（Semgrep + Sink 筛选）': 'Starting fast-scan prep (Semgrep + Sink triage)',
  '快速扫描跳过：无 Semgrep，其他挖掘路径继续':
    'Fast scan skipped: no Semgrep; other mining paths continue',
  'Sink 筛选本批未完成，按代码分冻结队列':
    'Sink triage batch incomplete; queue frozen by code score',
  // --- live_log: reviewer / verifier / attack chain ---
  '拉起 Reviewer 线程': 'Starting Reviewer thread',
  '拉起 Verifier 线程': 'Starting Verifier thread',
  '拉起攻击链串联线程': 'Starting attack-chain linking thread',
  '动态环境搭建轮已完成': 'Lab setup round complete',
  '已复用现有 Docker 靶场，环境搭建轮结束': 'Reused the existing Docker lab; lab-setup round done',
  '搭建连续超时，后续审核强制仅静态':
    'Lab setup timed out repeatedly; later review forced to static-only',
  '环境搭建轮重试用尽，已结束本轮（后续审核可 static_only）':
    'Lab-setup retries exhausted; round ended (later review may be static_only)',
  // --- live_log: config toggles ---
  '已关闭 Verifier，不再对新的前台漏洞做互联网复测':
    'Verifier disabled; new frontend findings will no longer be re-tested online',
  '已开启攻击链串联，挖掘与审核结束后将尝试多漏洞串联':
    'Attack-chain linking enabled; multi-finding chains will be attempted after mining and review finish',
  '已关闭攻击链串联': 'Attack-chain linking disabled',
  '已开启靶场动态验证，后续审核将搭建靶场并做动态复现':
    'Lab dynamic verification enabled; later review will build a lab and reproduce dynamically',
  '已开启局部验证，后续审核用沙箱 harness 复现，不搭建 Docker 靶场':
    'Local verification enabled; later review reproduces via a sandbox harness, no Docker lab',
  '已关闭动态验证，后续审核仅静态复核':
    'Dynamic verification disabled; later review is static-only',
  '项目模型已改回全局默认，下一轮 Agent 生效':
    'Project model reverted to the global default, effective next Agent round',
  '已取消 Token 上限': 'Token cap removed',
  '已收到用户引导，将在下一轮模型调用前注入':
    'User guidance received; it will be injected before the next model call',
  // --- live_log: code intelligence ---
  '已开启代码库，开始构建调用图；挖掘会等构建结束后再继续':
    'Code intelligence enabled; building the call graph; mining waits for the build to finish',
  '已开启代码库，挖掘等待调用图构建结束':
    'Code intelligence enabled; mining is waiting for the call-graph build to finish',
  '拉起代码库构建线程': 'Starting code-intelligence build thread',
  // --- live_log: scheduler ---
  '调度器启动': 'Scheduler started',
  '调度器已在运行，跳过重复启动': 'Scheduler already running; skipping duplicate start',
  '调度器退出': 'Scheduler exited',

  // --- HTTPException details ---
  '项目不存在': 'Project not found',
  '漏洞不存在': 'Finding not found',
  '报告不存在': 'Report not found',
  '候选不存在': 'Candidate not found',
  '访问令牌无效': 'Invalid access token',
  '没有需要更新的字段': 'No fields to update',
  '自定义审计模式不存在': 'Custom audit mode not found',
  '已完成项目不可暂停': 'A completed project cannot be paused',
  '缺少 source_url': 'Missing source_url',
  '请使用 /api/projects/upload 上传 zip': 'Use /api/projects/upload to upload a zip',
  'custom_audit_mode_id 必须是整数': 'custom_audit_mode_id must be an integer',
  '当前项目未开启靶场动态验证': 'This project does not have lab dynamic verification enabled',
  '审计对象仅在项目暂停或完成后可更改':
    'The audit target can only be changed while the project is paused or completed',
  '挖掘路径仅在项目暂停或完成后可更改':
    'Mining paths can only be changed while the project is paused or completed',
  '挖掘模式仅在项目暂停或完成后可更改':
    'The mining mode can only be changed while the project is paused or completed',
  '代码库仅在项目暂停或完成后可更改':
    'Code intelligence can only be changed while the project is paused or completed',
  'created_date 不是合法日期': 'created_date is not a valid date',
  'created_date 须为 YYYY-MM-DD': 'created_date must be YYYY-MM-DD',
  'month 须为 1–12': 'month must be 1-12',
  'year 超出范围': 'year is out of range',
  'attack_surface 须为 frontend|backend': 'attack_surface must be frontend|backend',
  'kind 须为 report|advisory|cve': 'kind must be report|advisory|cve',
  'tracking_status 须为 none|submitted|ignored': 'tracking_status must be none|submitted|ignored',

  // --- pydantic / ValueError ---
  'Base URL 只允许 http 或 https': 'Base URL must be http or https',
  'Base URL 不能包含用户名或密码': 'Base URL must not contain a username or password',
  'Base URL 主机名无效': 'Base URL host is invalid',
  'Base URL 缺少主机名': 'Base URL is missing a host',
  'Base URL 不能指向云元数据地址': 'Base URL must not point at a cloud metadata address',
  'Provider id 不能为空': 'Provider id must not be empty',
  'CVE JSON 须为对象': 'CVE JSON must be an object',
  'action 须为 steer、continue 或 new': 'action must be steer, continue or new',
  'rce_effect 须为 true 或 false': 'rce_effect must be true or false',
  'max_token_usage 不能为负数': 'max_token_usage must not be negative',
  'max_token_usage 必须是非负整数，0 表示不限制':
    'max_token_usage must be a non-negative integer; 0 means unlimited',
  'submission_reason 须用中文说明分层理由（产品名/类名/CVE 编号可保留英文）':
    'submission_reason must explain the tier rationale (product / class / CVE identifiers may stay in English)',
  'submission_tier=duplicate_grouped 时必须提供 root_cause_key':
    'root_cause_key is required when submission_tier=duplicate_grouped',
  '缺少 submission_tier': 'Missing submission_tier',
  '缺少 submission_reason（须说明为何进入该提交分层）':
    'Missing submission_reason (explain why this submission tier applies)',
  '上一轮构建尚未退出，请稍后重试': 'The previous build has not exited yet; please retry shortly',
  '仅支持 markdown 报告': 'Only markdown reports are supported',
  '仅支持重跑 map（地图/鉴权）或 old_vulns（历史漏洞）':
    'Only map (map/auth) or old_vulns (historical vulns) can be re-run',
  '仅靶场动态验证模式可新开环境搭建':
    'Lab setup can only be restarted in lab dynamic verification mode',
  '仅靶场动态验证模式可续跑环境搭建':
    'Lab setup can only be resumed in lab dynamic verification mode',
  '代码库构建无 Agent 会话，请使用重建按钮':
    'The code-intelligence build has no Agent session; use the rebuild button',
  '修改指令不能为空': 'The edit instruction must not be empty',
  '修订内容不能为空': 'The revision must not be empty',
  '追问内容不能为空': 'The follow-up question must not be empty',
  '引导内容不能为空': 'The guidance must not be empty',
  '历史漏洞尚未完成，完成后才能新开更新':
    'Historical vulns are not finished yet; you can start an update only after they complete',
  '历史漏洞尚未完成，完成后才能重跑更新':
    'Historical vulns are not finished yet; you can re-run an update only after they complete',
  '地图/鉴权尚未完成，完成后才能新开更新':
    'Map/auth is not finished yet; you can start an update only after it completes',
  '地图/鉴权尚未完成，完成后才能重跑更新':
    'Map/auth is not finished yet; you can re-run an update only after it completes',
  '天数须 >= 0': 'The number of days must be >= 0',
  '已有侦察子阶段正在重跑': 'A recon sub-stage is already being re-run',
  '当前令牌不正确': 'The current token is incorrect',
  '当前小阶段未在运行，请使用接续或新开':
    'This sub-stage is not running; use resume or start-new',
  '当前项目状态不可操作对话': "The project's current state does not allow conversation actions",
  '当前项目状态不可续跑环境搭建':
    "The project's current state does not allow resuming lab setup",
  '当前项目状态不可重建代码库':
    "The project's current state does not allow rebuilding code intelligence",
  '当前项目状态不可重跑侦察子阶段':
    "The project's current state does not allow re-running a recon sub-stage",
  '未知子阶段': 'Unknown sub-stage',
  '未知阶段': 'Unknown stage',
  '没有可接续的对话': 'No conversation to resume',
  '消息必须是文本，不能包含空字节': 'The message must be text and must not contain null bytes',
  '续跑说明必须是文本，不能包含空字节':
    'The resume note must be text and must not contain null bytes',
  '环境搭建尚未结束或靶场已就绪，无需续跑':
    'Lab setup is not finished, or the lab is already ready; no resume needed',
  '环境搭建正在进行中': 'Lab setup is in progress',
  '环境搭建正在进行中，请使用引导': 'Lab setup is in progress; use guidance instead',
  '未开启代码库。请先在项目配置中开启（需暂停或完成）':
    'Code intelligence is disabled. Enable it in project settings first (project must be paused or completed)',
  '路径越界': 'Path out of bounds',
  '非法路径': 'Illegal path',
  '路径不允许包含 ..': "Paths must not contain '..'",
  '请指定具体 .class/.jar/.war 路径': 'Specify a concrete .class / .jar / .war path',
  '请先全部暂停项目，再重置挖掘进度':
    'Pause all projects before resetting mining progress',
  '该小阶段正在运行中': 'This sub-stage is currently running',
  '至少保留一个 Base URL 端点': 'Keep at least one Base URL endpoint',
  '自定义审计模式名称不能为空': 'The custom audit mode name must not be empty',
  '自定义审计模式正文不能为空': 'The custom audit mode body must not be empty',
  '自定义审计模式不存在，请先在设置页创建':
    'Custom audit mode not found; create it on the Settings page first',
  '自定义模式须指定 custom_audit_mode_id': 'Custom mode requires custom_audit_mode_id',
  '搜索失败': 'Search failed',

  // --- phase-report fixed titles ---
  '单轮挖掘方向': 'Single mining round',
  '快速 Sink 回推': 'Fast sink trace-back',
  '历史漏洞绕过': 'Historical-vuln bypass',
  '无约束扫描': 'Unconstrained scan',
  '代码地图': 'Code map',
  '鉴权说明': 'Auth notes',
  '额外源码扩展名': 'Extra source extensions',
  '历史漏洞索引': 'Historical-vuln index',
  '动态环境搭建': 'Lab setup',
  '攻击链索引': 'Attack-chain index',
}

// Interpolated messages. Order matters - first match wins. Use [\s\S] for
// placeholders that may span newlines (exception text). A replacement may be a
// template string ($1, $2, ... with FRAGMENTS applied) or a function.
type Rule = [RegExp, string | ((m: RegExpMatchArray) => string)]
const RULES: Rule[] = [
  // recon / weighting
  [/^Recon (.+?) 新开重试 (\d+)\/(.+)$/, 'Recon $1: new-conversation retry $2/$3'],
  [/^侦察盖章：已自动跳过 (\d+) 个隐藏\/生成文件$/, 'File weighting: auto-skipped $1 hidden / generated files'],
  [/^侦察盖章轮完成：(\d+) 个文件（(\d+) 个子批次）$/, 'File-weighting round complete: $1 files ($2 sub-batches)'],
  [/^侦察盖章轮完成：(\d+) 个文件$/, 'File-weighting round complete: $1 files'],
  [/^侦察盖章子批次未完成（(.+?)），未标记文件将在下一轮再注入$/, 'File-weighting sub-batch incomplete ($1); unmarked files will be re-injected next round'],
  [/^权重建库完成，共 (\d+) 个源码文件$/, 'Weight index built: $1 source files'],
  [/^预筛选入库 (\d+) 个文件$/, 'Pre-filtered and ingested $1 files'],
  [/^扩展名预筛选：有效 (\d+) 种，噪音 (\d+) 种，跳过 (\d+) 个文件$/, 'Extension pre-filter: $1 useful, $2 noisy, $3 files skipped'],
  [/^噪音扩展名（Agent 可恢复）：(.+)$/, 'Noisy extensions (Agent can restore): $1'],
  [/^已点名 (\d+) 个业务 jar，入库由反编译服务异步完成(.*)$/, 'Named $1 business jars; ingest completes asynchronously in the decompile service$2'],
  [/^已启发式入队 (\d+) 个 Java 反编译任务$/, 'Queued $1 Java decompile tasks for heuristic mining'],
  [/^反编译启发式入队跳过: ([\s\S]+)$/, 'Skipped heuristic decompile enqueue: $1'],

  // imports / fingerprint
  [/^导入失败: ([\s\S]+)$/, 'Import failed: $1'],
  [/^已写入项目应用指纹（(.+?)），后续漏洞复用$/, 'Wrote the project app fingerprint ($1); reused by later findings'],
  [/^采集项目应用指纹失败: ([\s\S]+)$/, 'Failed to collect the project app fingerprint: $1'],
  [/^鉴权失败，已暂停: ([\s\S]+)$/, 'Auth failed; paused: $1'],
  [/^自动停止靶场失败: ([\s\S]+)$/, 'Failed to auto-stop the lab: $1'],
  [/^自动停止靶场异常: ([\s\S]+)$/, 'Error auto-stopping the lab: $1'],

  // config toggles (with counts / enum labels)
  [/^已开启 Verifier，排队 (\d+) 条前台漏洞$/, 'Verifier enabled; queued $1 frontend findings'],
  [/^项目模型已改为 (.+?)，下一轮 Agent 生效$/, 'Project model changed to $1, effective next Agent round'],
  [/^Token 上限已改为 (.+?)（输入\+输出），到达后将自动暂停$/, 'Token cap set to $1 (input + output); the project auto-pauses when it is reached'],
  [/^审计对象已改为(.+?)，下一轮 Agent 生效$/, 'Audit target changed to $1, effective next Agent round'],
  [/^挖掘模式已改为(.+?)，续跑后 Worker\/Reviewer 将按新规则新开$/, 'Mining mode changed to $1; after resume, Worker / Reviewer restart under the new rules'],
  [/^挖掘路径已改为(.+?)，续跑后按新路径调度$/, 'Mining paths changed to $1; scheduling follows the new paths after resume'],

  // code intelligence
  [/^代码库构建失败，已降级继续审计: ([\s\S]+)$/, 'Code-intelligence build failed; degraded and continuing the audit: $1'],
  [/^代码库构建线程异常: ([\s\S]+)$/, 'Code-intelligence build thread error: $1'],

  // scheduler / threads / workers
  [/^启动 Worker (.+)$/, 'Starting Worker $1'],
  [/^启动 Fast Worker (.+)$/, 'Starting Fast Worker $1'],
  [/^启动 Bypass Worker (.+)$/, 'Starting Bypass Worker $1'],
  [/^启动无约束扫描 Worker (.+)$/, 'Starting Unconstrained Worker $1'],
  [/^启动恢复失败: ([\s\S]+)$/, 'Startup recovery failed: $1'],
  [/^调度器异常（将继续）: ([\s\S]+)$/, 'Scheduler error (will continue): $1'],
  [/^进程启动恢复审计（原 status=(.+?)）$/, 'Process start: recovering the audit (previous status=$1)'],
  [/^从检查点接续上下文 phase=(.+?) run=(.+)$/, 'Continuing context from checkpoint: phase=$1 run=$2'],
  [/^发现 (\d+) 个可接续检查点，将接着原上下文继续$/, 'Found $1 resumable checkpoints; continuing from the original context'],

  // worker / reviewer / verifier lifecycle
  [/^(无约束 )?Worker=(.+?) 异常: ([\s\S]+)$/, '$1Worker=$2 error: $3'],
  [/^Fast Worker=(.+?) 异常: ([\s\S]+)$/, 'Fast Worker=$1 error: $2'],
  [/^Bypass Worker=(.+?) 异常: ([\s\S]+)$/, 'Bypass Worker=$1 error: $2'],
  [/^Reviewer 异常: ([\s\S]+)$/, 'Reviewer error: $1'],
  [/^Reviewer 线程异常: ([\s\S]+)$/, 'Reviewer thread error: $1'],
  [/^Reviewer 等待用户确认局部验证 vuln=(.+)$/, 'Reviewer is waiting for user confirmation of local verification, vuln=$1'],
  [/^Reviewer 结束 vuln=(.+?) verdict=(.+?) reason=(.+)$/, 'Reviewer finished vuln=$1 verdict=$2 reason=$3'],
  [/^Verifier 异常: ([\s\S]+)$/, 'Verifier error: $1'],
  [/^Verifier 线程异常: ([\s\S]+)$/, 'Verifier thread error: $1'],
  [/^Verifier 等待用户确认 vuln=(.+)$/, 'Verifier is waiting for user confirmation, vuln=$1'],
  [/^Verifier 结束 vuln=(.+?) verdict=(.+?) reason=(.+)$/, 'Verifier finished vuln=$1 verdict=$2 reason=$3'],
  [/^Recon 线程异常: ([\s\S]+)$/, 'Recon thread error: $1'],
  [/^攻击链异常: ([\s\S]+)$/, 'Attack chain error: $1'],
  [/^攻击链线程异常: ([\s\S]+)$/, 'Attack-chain thread error: $1'],
  [/^攻击链结束 reason=(.+?) submitted=(\d+)$/, 'Attack chain finished: reason=$1 submitted=$2'],
  [/^攻击链结束 reason=(.+)$/, 'Attack chain finished: reason=$1'],
  [/^Fix 异常 vuln=(.+?): ([\s\S]+)$/, 'Fix error vuln=$1: $2'],
  [/^Fix 未完成，vuln=(.+?) 回 returned$/, 'Fix incomplete; vuln=$1 set back to returned'],

  // reviewer/verifier waiting, timeouts
  [/^漏洞 #(.+?) 审核超时已重试一轮仍未收口，已标误报$/, 'Finding #$1: review timed out, retried a round without converging; marked false positive'],
  [/^漏洞 #(.+?) 审核超时（连续 (\d+)\/(\d+)）$/, 'Finding #$1: review timed out (streak $2/$3)'],
  [/^漏洞 #(.+?) 已连续超时 (\d+) 轮，下一轮强制仅静态审核（仅此一轮重试）$/, 'Finding #$1: timed out $2 rounds in a row; next round forced to static-only review (one retry only)'],
  [/^漏洞 #(.+?) 接续原审核轮次追加(.+)$/, 'Finding #$1: appending to the original review round ($2)'],
  [/^环境搭建新开重试 (\d+)\/(\d+)$/, 'Lab setup: new-conversation retry $1/$2'],
  [/^环境搭建超时（连续 (\d+)\/(\d+)）$/, 'Lab setup timed out (streak $1/$2)'],
  [/^环境搭建轮异常: ([\s\S]+)$/, 'Lab-setup round error: $1'],

  // fast scan / sinks / bypass
  [/^开始 Semgrep 扫描（(.+?)）$/, 'Starting Semgrep scan ($1)'],
  [/^Semgrep 失败: ([\s\S]+)$/, 'Semgrep failed: $1'],
  [/^代码筛后候选 Sink (\d+) 条$/, '$1 candidate sinks after code filtering'],
  [/^快速扫描准备异常: ([\s\S]+)$/, 'Fast-scan prep error: $1'],
  [/^快速扫描队列已冻结，待审计 Sink (\d+) 条$/, 'Fast-scan queue frozen; $1 sinks pending review'],
  [/^历史漏洞绕过队列已冻结，待尝试 (\d+) 条$/, 'Historical-vuln bypass queue frozen; $1 pending attempts'],
  [/^GHSA 爬虫失败: ([\s\S]+)$/, 'GHSA crawler failed: $1'],
  [/^GitHub Issues 爬虫失败: ([\s\S]+)$/, 'GitHub Issues crawler failed: $1'],
  [/^仓库 Advisory 爬虫失败: ([\s\S]+)$/, 'Repository Advisory crawler failed: $1'],

  // phase-report doc titles
  [/^攻击链 · (.+)$/, 'Attack chain · $1'],

  // conversation
  [/^用户接续对话（(.+?)）$/, 'User resumed the conversation ($1)'],
  [/^用户新开对话（(.+?)）$/, 'User started a new conversation ($1)'],
  [/^数据库 schema 初始化失败: ([\s\S]+)$/, 'Database schema initialization failed: $1'],

  // the {label}{'新开对话'|'开始'}{suffix} family (pipeline.py:961) and
  // the {label}未完成 / {label}异常 recon-rerun family (pipeline.py:844/846)
  [/^(侦察|代码库|挖掘|审核|验证|攻击链)新开对话（(.+?)）$/, (m) => `${ctrl(m[1])}: new conversation (${m[2]})`],
  [/^(侦察|代码库|挖掘|审核|验证|攻击链)新开对话$/, (m) => `${ctrl(m[1])}: new conversation`],
  [/^(侦察|代码库|挖掘|审核|验证|攻击链)开始（(.+?)）$/, (m) => `${ctrl(m[1])} started (${m[2]})`],
  [/^(侦察|代码库|挖掘|审核|验证|攻击链)开始$/, (m) => `${ctrl(m[1])} started`],
  [/^(地图\/鉴权|历史漏洞)未完成$/, (m) => `${ctrl(m[1])} incomplete`],
  [/^(地图\/鉴权|历史漏洞)异常: ([\s\S]+)$/, (m) => `${ctrl(m[1])} error: ${m[2]}`],

  // ValueError with interpolation
  [/^(.+?)必须是文本，不能包含空字节$/, '$1 must be text and must not contain null bytes'],
  [/^(.+?)过长，最多 (\d+) 字$/, '$1 is too long (max $2 characters)'],
  [/^audit_mode 无效，可选: (.+)$/, 'Invalid audit_mode; allowed: $1'],
  [/^dynamic_verify_mode 无效，可选: (.+)$/, 'Invalid dynamic_verify_mode; allowed: $1'],
  [/^exposure_mode 无效：(.+?)。允许：(.+)$/, 'Invalid exposure_mode: $1. Allowed: $2'],
  [/^harness_depth 无效：(.+?)。允许：(.+)$/, 'Invalid harness_depth: $1. Allowed: $2'],
  [/^审计对象无效，可选：(.+)$/, 'Invalid audit target; allowed: $1'],
  [/^submission_tier 无效，可选: (.+)$/, 'Invalid submission_tier; allowed: $1'],
  [/^(.+?) 无效，可选: (.+)$/, 'Invalid $1; allowed: $2'],
  [/^缺少 (.+)$/, 'Missing $1'],
  [/^未知阶段: (.+)$/, 'Unknown stage: $1'],
  [/^当前漏洞暂无可修改的 (.+)$/, 'This finding has no editable $1 yet'],
  [/^仍有 (\d+) 个项目引用该自定义模式，请先在项目中改用其他模式后再删除$/, '$1 projects still reference this custom mode; switch those projects to another mode before deleting'],
  [/^自定义审计模式名称已存在：(.+)$/, 'A custom audit mode with this name already exists: $1'],
  [/^重复的 Provider id: (.+)$/, 'Duplicate Provider id: $1'],
  [/^重复的端点 id: (.+)$/, 'Duplicate endpoint id: $1'],
  [/^端点 (.+?): Base URL 不能为空$/, 'Endpoint $1: Base URL must not be empty'],
  [/^Provider (.+?): wire_api 须为 chat、responses 或 anthropic$/, 'Provider $1: wire_api must be chat, responses or anthropic'],
  [/^新令牌至少 (\d+) 个字符$/, 'The new token must be at least $1 characters'],
  [/^无效字段路径: (.+)$/, 'Invalid field path: $1'],
  [/^文件不存在: (.+)$/, 'File not found: $1'],
  [/^不支持的 language=(.+?)，可选: (.+)$/, 'Unsupported language=$1; allowed: $2'],
  [/^CVE JSON 不是合法 JSON: ([\s\S]+)$/, 'CVE JSON is not valid JSON: $1'],
  [/^zip 保存失败: ([\s\S]+)$/, 'Failed to save the zip: $1'],
  [/^max_token_usage 过大，最多 (.+)$/, 'max_token_usage is too large (max $1)'],
]

function isEnglish(): boolean {
  return (i18n.language || '').toLowerCase().startsWith('en')
}

/**
 * Translate a backend-produced string to English when the UI locale is `en`.
 * Unknown strings (LLM output, English text already) pass through unchanged.
 */
export function translateBackendText(raw: string | null | undefined): string {
  const s = raw ?? ''
  if (!s || !isEnglish()) return s
  const key = s.trim()
  const exact = EXACT[key]
  if (exact) return exact
  for (const [re, repl] of RULES) {
    const m = key.match(re)
    if (!m) continue
    if (typeof repl === 'function') return repl(m)
    return repl.replace(/\$(\d+)/g, (_, d: string) => frag(m[Number(d)] ?? ''))
  }
  return s
}
