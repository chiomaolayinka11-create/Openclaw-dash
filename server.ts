import express from "express";
import path from "path";
import fs from "fs";
import vm from "vm";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Directories
const DATA_DIR = path.join(process.cwd(), "data");
const AGENT_OUTPUT_DIR = path.join(process.cwd(), "agent_output");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(AGENT_OUTPUT_DIR)) {
  fs.mkdirSync(AGENT_OUTPUT_DIR, { recursive: true });
}

// Data store files
const SKILLS_FILE = path.join(DATA_DIR, "skills.json");
const MEMORIES_FILE = path.join(DATA_DIR, "memories.json");
const APPROVALS_FILE = path.join(DATA_DIR, "approvals.json");
const STATUS_FILE = path.join(DATA_DIR, "status.json");
const THREADS_FILE = path.join(DATA_DIR, "threads.json");

// System Logs queue (holds the last 50 entries)
const systemLogs: Array<{ timestamp: string; level: 'info' | 'warn' | 'success' | 'dev'; message: string }> = [];

function addLog(level: 'info' | 'warn' | 'success' | 'dev', message: string) {
  systemLogs.push({
    timestamp: new Date().toISOString(),
    level,
    message
  });
  if (systemLogs.length > 50) {
    systemLogs.shift();
  }
}

// Seed initial logs
addLog("info", "OpenClaw core kernel initialized successfully.");
addLog("success", "Disk memory controllers mounted at ./data and ./agent_output.");

// Default Data Seeds
const DEFAULT_SKILLS = [
  {
    id: "skill-search",
    name: "Web Grounded Search",
    description: "Search the live web using Google Search to answer queries, pull reference links, and find real-time status data.",
    systemPrompt: "You are allowed to query live web data. When answering, provide official external URLs from search grounding metadata.",
    category: "system",
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "skill-workspace-analyst",
    name: "Workspace Analyzer",
    description: "Scans, lists, and reads code snippets from files in the sandbox workspace directory for engineering insights.",
    systemPrompt: "You are an expert system engineer who can read file systems. Provide constructive structure analysis and code patterns.",
    category: "system",
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "skill-sandbox-maker",
    name: "File Weaver",
    description: "Generates report files, markdown documentation, or structured script outputs into the local sandboxed agent_output directory.",
    systemPrompt: "You compile professional text, documents, files, or analytical summaries. Save them cleanly with descriptive file names.",
    category: "system",
    enabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "skill-code-runner",
    name: "Node JS Math Console",
    description: "Performs mathematical modeling, statistics calculations, and evaluates algorithmic scripts in Node.js environment.",
    systemPrompt: "Formulate code segments to run numerical logic or parser simulations. Give crisp calculations with clean execution logs.",
    category: "browser",
    enabled: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_MEMORIES = [
  {
    id: "mem-1",
    content: "Host operating environment detected as Linux Container with absolute workspace root mapped at .",
    category: "system_state",
    timestamp: new Date().toISOString()
  },
  {
    id: "mem-2",
    content: "User prefers clean Inter display headings, Space Grotesk accent lines, and strict JetBrains Mono data tables.",
    category: "user_preference",
    timestamp: new Date().toISOString()
  }
];

const DEFAULT_STATUS = {
  online: true,
  uptime: "4h 12m",
  autoMode: false, // Default is safe mode (approval required for risky tasks)
  llmModel: "gemini-3.5-flash",
  connectedPlatforms: {
    cli: true,
    slack: true,
    telegram: false,
    webhook: true
  },
  metrics: {
    cpu: 18,
    memory: {
      used: 342, // MB
      total: 1024
    },
    tokensToday: 14502,
    stepsExecuted: 49
  }
};

const DEFAULT_THREADS = [
  {
    id: "thread-default",
    title: "Primary Research Stream",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "step-seed-1",
        timestamp: new Date().toISOString(),
        type: "thought",
        title: "Session Synced",
        message: "Cognitive channel successfully active. Connected to OpenClaw distributed cluster."
      }
    ],
    answer: "Welcome to your real-time agent console. Ask me to research technology trends or generate reports. All threads are persisted to disk automatically!"
  }
];

// Helper Read/Write operations
function readJSONFile(filePath: string, defaultData: any) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

function writeJSONFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Initialize JSON stores
let skills = readJSONFile(SKILLS_FILE, DEFAULT_SKILLS);
let memories = readJSONFile(MEMORIES_FILE, DEFAULT_MEMORIES);
let approvals = readJSONFile(APPROVALS_FILE, []);
let systemStatus = readJSONFile(STATUS_FILE, DEFAULT_STATUS);
let threads = readJSONFile(THREADS_FILE, DEFAULT_THREADS);

// Save initial loaded states
writeJSONFile(SKILLS_FILE, skills);
writeJSONFile(MEMORIES_FILE, memories);
writeJSONFile(APPROVALS_FILE, approvals);
writeJSONFile(STATUS_FILE, systemStatus);
writeJSONFile(THREADS_FILE, threads);

// Set up lazy-loaded Gemini client
let geminiAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please add your key in Settings > Secrets to enable real-world AI processing.");
    }
    geminiAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiAI;
}

// Refresh simulated dynamic metrics
setInterval(() => {
  systemStatus = readJSONFile(STATUS_FILE, systemStatus);
  if (systemStatus.online) {
    // Tick cpu and memory with minor fluctuations
    const cpuDiff = Math.floor(Math.random() * 5) - 2;
    const memDiff = Math.floor(Math.random() * 11) - 5;
    
    systemStatus.metrics.cpu = Math.max(5, Math.min(85, systemStatus.metrics.cpu + cpuDiff));
    systemStatus.metrics.memory.used = Math.max(100, Math.min(1024, systemStatus.metrics.memory.used + memDiff));
    writeJSONFile(STATUS_FILE, systemStatus);
  }
}, 5000);

/* =========================================
   API ROUTES
   ========================================= */

// status endpoint
app.get("/api/status", (req, res) => {
  const current = readJSONFile(STATUS_FILE, systemStatus);
  res.json(current);
});

// toggle auto-mode (YOLO)
app.post("/api/status/toggle-mode", (req, res) => {
  const current = readJSONFile(STATUS_FILE, systemStatus);
  current.autoMode = !current.autoMode;
  writeJSONFile(STATUS_FILE, current);
  res.json({ success: true, autoMode: current.autoMode });
});

// list skills
app.get("/api/skills", (req, res) => {
  const currentSkills = readJSONFile(SKILLS_FILE, skills);
  res.json(currentSkills);
});

// create skill
app.post("/api/skills", (req, res) => {
  const { name, description, systemPrompt, codeSnippet, category } = req.body;
  if (!name || !systemPrompt) {
    return res.status(400).json({ error: "Name and system prompt are required fields." });
  }
  const currentSkills = readJSONFile(SKILLS_FILE, skills);
  const newSkill = {
    id: `skill-${Date.now()}`,
    name,
    description: description || "Custom built agent skill.",
    systemPrompt,
    codeSnippet: codeSnippet || "",
    category: category || "custom",
    enabled: true,
    createdAt: new Date().toISOString()
  };
  currentSkills.push(newSkill);
  writeJSONFile(SKILLS_FILE, currentSkills);
  res.status(201).json(newSkill);
});

// delete skill
app.delete("/api/skills/:id", (req, res) => {
  const { id } = req.params;
  const currentSkills = readJSONFile(SKILLS_FILE, skills);
  const index = currentSkills.findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Skill not found" });
  }
  const deleted = currentSkills.splice(index, 1);
  writeJSONFile(SKILLS_FILE, currentSkills);
  res.json({ success: true, deleted: deleted[0] });
});

// list memories
app.get("/api/memories", (req, res) => {
  const currentMemories = readJSONFile(MEMORIES_FILE, memories);
  res.json(currentMemories);
});

// create memory
app.post("/api/memories", (req, res) => {
  const { content, category } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }
  const currentMemories = readJSONFile(MEMORIES_FILE, memories);
  const newMemory = {
    id: `mem-${Date.now()}`,
    content,
    category: category || "user_preference",
    timestamp: new Date().toISOString()
  };
  currentMemories.push(newMemory);
  writeJSONFile(MEMORIES_FILE, currentMemories);
  res.status(201).json(newMemory);
});

// delete memory
app.delete("/api/memories/:id", (req, res) => {
  const { id } = req.params;
  const currentMemories = readJSONFile(MEMORIES_FILE, memories);
  const index = currentMemories.findIndex((m: any) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Memory not found" });
  }
  currentMemories.splice(index, 1);
  writeJSONFile(MEMORIES_FILE, currentMemories);
  res.json({ success: true });
});

// retrieve details of output directory files
app.get("/api/reports", (req, res) => {
  try {
    const files = fs.readdirSync(AGENT_OUTPUT_DIR);
    const reports = files.map(file => {
      const filePath = path.join(AGENT_OUTPUT_DIR, file);
      const stat = fs.statSync(filePath);
      let contentSample = "";
      try {
        const fullContent = fs.readFileSync(filePath, "utf-8");
        contentSample = fullContent.length > 500 ? fullContent.substring(0, 500) + "..." : fullContent;
      } catch (e) {}
      return {
        name: file,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
        contentSample
      };
    }).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json(reports);
  } catch (error) {
    res.json([]);
  }
});

// view specific report file
app.get("/api/reports/:name", (req, res) => {
  try {
    const safeName = path.basename(req.params.name);
    const filePath = path.join(AGENT_OUTPUT_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ name: safeName, content });
  } catch (err) {
    res.status(500).json({ error: "Failed to read file" });
  }
});

// delete specific report file
app.delete("/api/reports/:name", (req, res) => {
  try {
    const safeName = path.basename(req.params.name);
    const filePath = path.join(AGENT_OUTPUT_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// list approvals
app.get("/api/approvals", (req, res) => {
  const currentApprovals = readJSONFile(APPROVALS_FILE, []);
  res.json(currentApprovals);
});

// batch decide approvals on action queue
app.post("/api/approvals/batch-decide", (req, res) => {
  const { ids, status } = req.body; // ids array, status: approved or rejected
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "IDs must be a non-empty array." });
  }
  if (!status || (status !== "approved" && status !== "rejected")) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
  }

  const currentApprovals = readJSONFile(APPROVALS_FILE, []);
  let updatedCount = 0;
  const currentMemories = readJSONFile(MEMORIES_FILE, []);

  for (const id of ids) {
    const approval = currentApprovals.find((a: any) => a.id === id);
    if (approval && approval.status === "pending") {
      approval.status = status;
      updatedCount++;

      // If approved, perform actual pending system action
      if (status === "approved" && approval.actionType === "file_edit") {
        try {
          const payload = approval.payload;
          const targetPath = path.join(AGENT_OUTPUT_DIR, path.basename(payload.fileName));
          fs.writeFileSync(targetPath, payload.content);
          
          currentMemories.push({
            id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            content: `Executed approved batch file write on '${payload.fileName}' with length: ${payload.content.length} characters.`,
            category: "task_result",
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error(`Failed to commit approved batch file modification (${id}):`, err);
        }
      }
    }
  }

  if (updatedCount > 0) {
    writeJSONFile(APPROVALS_FILE, currentApprovals);
    if (status === "approved") {
      writeJSONFile(MEMORIES_FILE, currentMemories);
    }
  }

  res.json({ success: true, updatedCount, approvals: currentApprovals });
});

// decide approval on action queue
app.post("/api/approvals/:id/decide", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved or rejected
  if (!status || (status !== "approved" && status !== "rejected")) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
  }
  const currentApprovals = readJSONFile(APPROVALS_FILE, []);
  const approval = currentApprovals.find((a: any) => a.id === id);
  if (!approval) {
    return res.status(404).json({ error: "Approval request not found" });
  }
  
  approval.status = status;
  writeJSONFile(APPROVALS_FILE, currentApprovals);

  // If approved, perform the actual pending system action
  if (status === "approved" && approval.actionType === "file_edit") {
    try {
      const payload = approval.payload;
      const targetPath = path.join(AGENT_OUTPUT_DIR, path.basename(payload.fileName));
      fs.writeFileSync(targetPath, payload.content);
      
      // Seed into memory that file was updated
      const currentMemories = readJSONFile(MEMORIES_FILE, memories);
      currentMemories.push({
        id: `mem-${Date.now()}`,
        content: `Executed approved file write on '${payload.fileName}' with length: ${payload.content.length} characters.`,
        category: "task_result",
        timestamp: new Date().toISOString()
      });
      writeJSONFile(MEMORIES_FILE, currentMemories);
    } catch (err) {
      console.error("Failed to commit approved file modification:", err);
    }
  }

  res.json({ success: true, approval });
});

// GET /api/logs
app.get("/api/logs", (req, res) => {
  res.json(systemLogs);
});

// GET /api/threads
app.get("/api/threads", (req, res) => {
  const currentThreads = readJSONFile(THREADS_FILE, DEFAULT_THREADS);
  res.json(currentThreads);
});

// POST /api/threads
app.post("/api/threads", (req, res) => {
  const { title } = req.body;
  const currentThreads = readJSONFile(THREADS_FILE, DEFAULT_THREADS);
  const newThread = {
    id: `thread-${Date.now()}`,
    title: title || `Research Topic #${currentThreads.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: `step-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "thought" as const,
        title: "Thread Spawned",
        message: "Cognitive thread allocated on host stack. Preparing active search channels."
      }
    ],
    answer: "Welcome to this new research stream! How can I assist you with details or reports?"
  };
  currentThreads.push(newThread);
  writeJSONFile(THREADS_FILE, currentThreads);
  addLog("info", `Created new conversation context thread: "${newThread.title}"`);
  res.status(201).json(newThread);
});

// DELETE /api/threads/:id
app.delete("/api/threads/:id", (req, res) => {
  const { id } = req.params;
  const currentThreads = readJSONFile(THREADS_FILE, DEFAULT_THREADS);
  const index = currentThreads.findIndex((t: any) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Thread not found" });
  }
  const deleted = currentThreads.splice(index, 1);
  writeJSONFile(THREADS_FILE, currentThreads);
  addLog("warn", `Deleted conversation context thread: "${deleted[0].title}"`);
  res.json({ success: true });
});

// POST /api/reports/save (Write contents straight to disk)
app.post("/api/reports/save", (req, res) => {
  const { name, content } = req.body;
  if (!name || content === undefined) {
    return res.status(400).json({ error: "Name and content parameters are required." });
  }
  try {
    const safeName = path.basename(name);
    const targetPath = path.join(AGENT_OUTPUT_DIR, safeName);
    fs.writeFileSync(targetPath, content);
    addLog("success", `Committed manual editor changes to sandbox file: '${safeName}' (${content.length} characters)`);
    res.json({ success: true });
  } catch (err: any) {
    addLog("warn", `Failed to write manual document update: ${err.message}`);
    res.status(500).json({ error: `Disk writing failed: ${err.message}` });
  }
});

// POST /api/reports/create
app.post("/api/reports/create", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "File name is required." });
  }
  try {
    const safeName = path.basename(name);
    const targetPath = path.join(AGENT_OUTPUT_DIR, safeName);
    if (fs.existsSync(targetPath)) {
      return res.status(400).json({ error: "A file with that name already exists in output directory." });
    }
    const standardSnippet = `# Custom Markdown Document\n\nCreated: ${new Date().toLocaleDateString()}\n\nAdd content details back.`;
    fs.writeFileSync(targetPath, standardSnippet);
    addLog("success", `Spawned new document file '${safeName}' inside task sandbox.`);
    res.status(201).json({ name: safeName, size: standardSnippet.length, content: standardSnippet });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sandbox/run (Execute JS code inside Node Safe VM Context or Unbounded System Mode)
app.post("/api/sandbox/run", (req, res) => {
  const { code, unbounded } = req.body;
  if (!code) {
    return res.status(400).json({ error: "JavaScript/TypeScript code parameters required to compile." });
  }

  const logs: string[] = [];

  if (unbounded) {
    // Unbounded System Mode: Execute natively outside the VM sandbox with full system, environment, & require capabilities!
    try {
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
        },
        error: (...args: any[]) => {
          logs.push("[UNBOUNDED_ERROR] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
        }
      };

      // Create function wrapping with native require, process and globals exposed
      const wrapperFunction = new Function('console', 'require', 'process', 'global', `
        ${code}
      `);

      const evalResult = wrapperFunction(customConsole, require, process, global);

      addLog("success", `Executed unbounded task natively outside sandbox container context.`);
      return res.json({
        success: true,
        output: logs.join("\n"),
        result: evalResult !== undefined ? String(evalResult) : "undefined"
      });
    } catch (err: any) {
      addLog("warn", `Unbounded host run failed: ${err.message}`);
      return res.json({
        success: false,
        error: err.message,
        output: logs.join("\n")
      });
    }
  }

  const sandbox = {
    console: {
      log: (...args: any[]) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
      },
      error: (...args: any[]) => {
        logs.push("[RUNERROR] " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
      }
    },
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    JSON,
    Map,
    Set,
    RegExp,
    parseFloat,
    parseInt
  };

  try {
    // Run VM scripts safely with strict timeout constraints and standard object maps
    const script = new vm.Script(code);
    const context = vm.createContext(sandbox);
    const evalResult = script.runInContext(context, { timeout: 1500 });
    
    addLog("dev", `Compiled & executed sandbox JS evaluator snippet.`);
    res.json({
      success: true,
      output: logs.join("\n"),
      result: evalResult !== undefined ? String(evalResult) : "undefined"
    });
  } catch (err: any) {
    addLog("warn", `Sandbox execution threw runtime exception: ${err.message}`);
    res.json({
      success: false,
      error: err.message,
      output: logs.join("\n")
    });
  }
});


/* =========================================
   REAL AI AGENT LOOP ROUTE (THE BRAINS)
   ========================================= */
app.post("/api/agent/run", async (req, res) => {
  const { prompt, activeSkillId, autoMode, threadId } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const targetThreadId = threadId || "thread-default";
  const currentThreads = readJSONFile(THREADS_FILE, DEFAULT_THREADS);
  const activeThread = currentThreads.find((t: any) => t.id === targetThreadId) || currentThreads[0];

  addLog("info", `Prompt query routed to thread "${activeThread.title}": "${prompt}"`);

  const steps: any[] = [];
  let answer = "";
  
  // Step 1: Initialize thinking phase
  const runId = `run-${Date.now()}`;
  steps.push({
    id: `step-${Date.now()}-1`,
    timestamp: new Date().toISOString(),
    type: "thought",
    title: "Orchestration Layer",
    message: `Received prompt: "${prompt}". Parsing configured skill profiles and preparing active guardrails.`
  });

  // Load configured skills
  const currentSkills = readJSONFile(SKILLS_FILE, skills);
  const currentMemories = readJSONFile(MEMORIES_FILE, memories);
  const chosenSkill = activeSkillId ? currentSkills.find((s: any) => s.id === activeSkillId) : null;
  
  steps.push({
    id: `step-${Date.now()}-2`,
    timestamp: new Date().toISOString(),
    type: "thought",
    title: "Retrieval Augmented Memory",
    message: `Injected ${currentMemories.length} cognitive memory constraints, including environment configuration data.`
  });

  // Verify API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    addLog("warn", "GEMINI_API_KEY is not defined. Bootstrapping simulation node sandbox thread.");
    steps.push({
      id: `step-${Date.now()}-err`,
      timestamp: new Date().toISOString(),
      type: "thought",
      title: "API Status Offline",
      message: "⚠️ GEMINI_API_KEY is not defined in Secrets. Falling back to offline Simulation Mode."
    });

    // Offline simulation mode so the application ALWAYS works and provides a gorgeous interface
    setTimeout(() => {
      const simulatedSteps = [
        ...steps,
        {
          id: `step-${Date.now()}-sim1`,
          timestamp: new Date().toISOString(),
          type: "tool_call",
          title: "Invoking Analytical Skill",
          message: "Searching memory cluster & evaluating workspace guidelines."
        },
        {
          id: `step-${Date.now()}-sim2`,
          timestamp: new Date().toISOString(),
          type: "tool_output",
          title: "Memory Index Restored",
          message: "No relevant local workspace modifications required. Recommending action summary."
        }
      ];

      // If they are simulating a file creation
      const lowerPrompt = prompt.toLowerCase();
      let simAnswer = `[SIMULATION RESPONSE - NO GEMINI API KEY CONFIGURED]\n\nHello! I parsed your instruction: "${prompt}".\n\nBecause there is no **GEMINI_API_KEY** found in the host env variables, I am simulating an intelligent response loop.\n\nTo make this agent fully alive, paste your API Key in the **Settings > Secrets** panel of the AI Studio UI, and the agent will immediately perform real Google Search grounding, list live system files, and generate responses directly from the Gemini 3.5 Flash model!`;
      
      if (lowerPrompt.includes("write") || lowerPrompt.includes("file") || lowerPrompt.includes("create") || lowerPrompt.includes("report")) {
        const dummyFileName = lowerPrompt.includes("report") ? "analytics_briefing.md" : "agent_note.txt";
        const dummyContent = `# OpenClaw Analytical Output\n\nGenerated dynamically on request.\nPrompt: "${prompt}"\nTimestamp: ${new Date().toISOString()}\n\nThis output is hosted securely inside the sandboxed environment directory.`;

        if (!autoMode) {
          // Trigger Exec Approval required
          const approvalId = `appr-${Date.now()}`;
          const currentApprovals = readJSONFile(APPROVALS_FILE, []);
          const approvalRequest = {
            id: approvalId,
            timestamp: new Date().toISOString(),
            agentId: "OpenClaw-Prime",
            actionType: "file_edit",
            description: `Generate analytical text report: '${dummyFileName}' on disk.`,
            payload: { fileName: dummyFileName, content: dummyContent },
            status: "pending"
          };
          currentApprovals.push(approvalRequest);
          writeJSONFile(APPROVALS_FILE, currentApprovals);

          simulatedSteps.push({
            id: `step-${Date.now()}-appr`,
            timestamp: new Date().toISOString(),
            type: "approval_required",
            title: "🔒 Executive Approval Required",
            message: `Writing file request queued (ID: ${approvalId}). Suspended execution until approved on active console deck.`,
            metadata: { approvalId }
          });

          simAnswer = `I have formatted the requested analytical report file structure. However, because you are running in **Executive Safe Mode**, a manual authorization was triggered! Please look at the **Approvals Queue** on your left and authorize the action to commit the write to disk!`;
          
          activeThread.steps = simulatedSteps;
          activeThread.answer = simAnswer;
          activeThread.updatedAt = new Date().toISOString();
          writeJSONFile(THREADS_FILE, currentThreads);

          return res.json({
            answer: simAnswer,
            steps: simulatedSteps
          });
        } else {
          // Auto Mode (YOLO) - write file directly
          const targetPath = path.join(AGENT_OUTPUT_DIR, dummyFileName);
          fs.writeFileSync(targetPath, dummyContent);
          
          simulatedSteps.push({
            id: `step-${Date.now()}-write`,
            timestamp: new Date().toISOString(),
            type: "tool_output",
            title: "Disk Sync Committed",
            message: `Wrote file '${dummyFileName}' successfully to sandbox disk. Size: ${dummyContent.length} bytes.`,
            metadata: { fileName: dummyFileName }
          });
          addLog("success", `Simulation automatic file generation written: '${dummyFileName}'`);
        }
      }

      // Add final response
      simulatedSteps.push({
        id: `step-${Date.now()}-final`,
        timestamp: new Date().toISOString(),
        type: "response",
        title: "Agent Final Response",
        message: "Finished parsing. Displaying structured recommendation."
      });

      // Update metrics
      const currentStats = readJSONFile(STATUS_FILE, systemStatus);
      currentStats.metrics.stepsExecuted += 1;
      currentStats.metrics.tokensToday += 210;
      writeJSONFile(STATUS_FILE, currentStats);

      activeThread.steps = simulatedSteps;
      activeThread.answer = simAnswer;
      activeThread.updatedAt = new Date().toISOString();
      writeJSONFile(THREADS_FILE, currentThreads);

      res.json({
        answer: simAnswer,
        steps: simulatedSteps
      });
    }, 1500);

    return;
  }

  // REAL ONLINE MODE WITH GEMINI API!
  try {
    const ai = getGeminiClient();
    addLog("info", `Querying Live Google Gemini client from Thread: "${activeThread.title}"`);

    // Prepare system guidelines and memories
    let systemInstruction = `You are OpenClaw Prime, a powerful autonomous AI Agent built on the OpenClaw framework.
You run in a full-stack container environment on Cloud Run.
You have access to active system memory context, dynamic external tool definitions, and live skills.

Current System Date & Time: ${new Date().toISOString()}

=========================================
ACTIVE COGNITIVE PERSISTENT MEMORIES:
${currentMemories.map((m: any, idx: number) => `Memory ${idx+1} [${m.category}]: "${m.content}"`).join("\n")}
=========================================

${chosenSkill ? `Your active primary skill focus is set to "${chosenSkill.name}". Follow this instruction profile strictly: \n"${chosenSkill.systemPrompt}"` : ""}

Follow these rules during execution:
1. Always maintain a calm, highly competent, analytical tone. Refer to yourself as "OpenClaw AI agent".
2. If the user asks about system assets or directory contents, you are allowed to list files or analyze structural data which we can relay.
3. If the user asks to write a file or formulate analytical reports (e.g. documentation, logs), write out a full, detailed text body in markdown or text. Start your response with the exact marker '[ACTION_WRITE_FILE: fileName.ext]' on its own line, followed by the complete body content.
   IMPORTANT: Our orchestration container will capture this marker '[ACTION_WRITE_FILE: filename]' and handle the file synchronization (including checking for Safe approval constraints).
4. If you require real-time web knowledge, the orchestration layer registers Google Search grounding dynamically. Use it to verify external claims, pull official links, and state grounded references back.`;

    steps.push({
      id: `step-${Date.now()}-ai-call`,
      timestamp: new Date().toISOString(),
      type: "tool_call",
      title: "Querying Gemini Core Engine",
      message: `Formulating LLM payload using system directives and generating response under validation model: ${systemStatus.llmModel}.`
    });

    // Run basic content generation with search grounding tool!
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }] // Enabled live Search Grounding!
      }
    });

    const outputText = response.text || "";

    // Parse Search Grounding details
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
      const searchLinks = groundingChunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web?.title || "Search Reference",
          url: chunk.web?.uri
        }));

      if (searchLinks.length > 0) {
        steps.push({
          id: `step-${Date.now()}-grounding`,
          timestamp: new Date().toISOString(),
          type: "tool_output",
          title: "Google Search Grounding Connected",
          message: `Verified and grounded response against live web anchors. Retrieved ${searchLinks.length} references.`,
          metadata: { searchLinks }
        });
        addLog("success", `Google Search Grounding referenced ${searchLinks.length} active sites.`);
      }
    }

    // Check if the agent wanted to write a file
    const writeFileMatch = outputText.match(/\[ACTION_WRITE_FILE:\s*([a-zA-Z0-9_\-\.]+)\s*\]/);
    if (writeFileMatch) {
      const targetFileName = writeFileMatch[1];
      // Clean marker out of conversational text
      const cleanOutput = outputText.replace(/\[ACTION_WRITE_FILE:\s*[a-zA-Z0-9_\-\.]+\s*\]/, "").trim();
      
      const fileReportBody = cleanOutput;

      if (!autoMode) {
        // Safe Mode - queue for executive approval!
        const approvalId = `appr-${Date.now()}`;
        const currentApprovals = readJSONFile(APPROVALS_FILE, []);
        const approvalRequest = {
          id: approvalId,
          timestamp: new Date().toISOString(),
          agentId: "OpenClaw-Prime",
          actionType: "file_edit",
          description: `Create workspace document/report file: '${targetFileName}'`,
          payload: { fileName: targetFileName, content: fileReportBody },
          status: "pending"
        };
        currentApprovals.push(approvalRequest);
        writeJSONFile(APPROVALS_FILE, currentApprovals);

        steps.push({
          id: `step-${Date.now()}-approval-prompt`,
          timestamp: new Date().toISOString(),
          type: "approval_required",
          title: "🔒 Executive Approval Required",
          message: `Target System Action blocked under active safety rules: Requesting to create file '${targetFileName}'. Approvals queue updated.`,
          metadata: { approvalId }
        });

        // Update stats
        const currentStats = readJSONFile(STATUS_FILE, systemStatus);
        currentStats.metrics.stepsExecuted += 1;
        currentStats.metrics.tokensToday += (response.usageMetadata?.totalTokenCount || 450);
        writeJSONFile(STATUS_FILE, currentStats);

        const safeResponseText = `I have generated the structured report for **${targetFileName}** using the active models. However, because we are operating in **Executive Safe Mode**, this action has been halted. Please authorize step ID: \`${approvalId}\` in the Approvals panel to allow writing this file to disk memory!`;

        activeThread.steps = steps;
        activeThread.answer = safeResponseText;
        activeThread.updatedAt = new Date().toISOString();
        writeJSONFile(THREADS_FILE, currentThreads);

        return res.json({
          answer: safeResponseText,
          steps
        });
      } else {
        // Auto Mode (YOLO) - write file directly
        const targetPath = path.join(AGENT_OUTPUT_DIR, targetFileName);
        fs.writeFileSync(targetPath, fileReportBody);
        
        steps.push({
          id: `step-${Date.now()}-write-success`,
          timestamp: new Date().toISOString(),
          type: "tool_output",
          title: "Immediate File Write Synced",
          message: `Wrote '${targetFileName}' straight to container sandbox directory. Data persistence established.`,
          metadata: { fileName: targetFileName }
        });
        addLog("success", `Committed agent dynamic file write successfully: '${targetFileName}'`);

        // Add user-visible memory of task result
        const currentMemories = readJSONFile(MEMORIES_FILE, memories);
        currentMemories.push({
          id: `mem-${Date.now()}`,
          content: `Successfully generated and saved research paper: '${targetFileName}' into standard disk folder.`,
          category: "task_result",
          timestamp: new Date().toISOString()
        });
        writeJSONFile(MEMORIES_FILE, currentMemories);
      }
    }

    // Complete active run
    steps.push({
      id: `step-${Date.now()}-complete`,
      timestamp: new Date().toISOString(),
      type: "response",
      title: "Task Finalized",
      message: "Formulated conversational interface feedback and released CPU buffers."
    });

    // Update real metrics
    const currentStats = readJSONFile(STATUS_FILE, systemStatus);
    currentStats.metrics.stepsExecuted += 1;
    currentStats.metrics.tokensToday += (response.usageMetadata?.totalTokenCount || 450);
    writeJSONFile(STATUS_FILE, currentStats);

    const cleanConversationalText = outputText
      .replace(/\[ACTION_WRITE_FILE:\s*[a-zA-Z0-9_\-\.]+\s*\]/g, "")
      .trim();

    activeThread.steps = steps;
    activeThread.answer = cleanConversationalText;
    activeThread.updatedAt = new Date().toISOString();
    writeJSONFile(THREADS_FILE, currentThreads);

    addLog("success", "Active Gemini query completed and returned successfully.");

    res.json({
      answer: cleanConversationalText,
      steps
    });

  } catch (err: any) {
    console.error("Gemini API Error details:", err);
    addLog("warn", `Gemini active modelling threw error: ${err.message}`);
    res.status(500).json({ 
      error: err.message || "Failed during live Gemini agent modeling loop." 
    });
  }
});


// Synchronously serve critical PWA assets to prevent 404s and proxy redirects during async server bootup
app.get("/sw.js", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const filePath = isProd 
    ? path.join(process.cwd(), "dist", "sw.js")
    : path.join(process.cwd(), "public", "sw.js");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Service Worker not found on disk");
  }
});

app.get("/manifest.json", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const filePath = isProd 
    ? path.join(process.cwd(), "dist", "manifest.json")
    : path.join(process.cwd(), "public", "manifest.json");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/json");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Manifest not found on disk");
  }
});

app.get("/icon.png", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const filePath = isProd 
    ? path.join(process.cwd(), "dist", "icon.png")
    : path.join(process.cwd(), "public", "icon.png");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/png");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Icon not found on disk");
  }
});

app.get("/icon-192.png", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const filePath = isProd 
    ? path.join(process.cwd(), "dist", "icon-192.png")
    : path.join(process.cwd(), "public", "icon-192.png");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/png");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Icon-192 not found on disk");
  }
});

// Fallback static files serving for Production builds
const distPath = path.join(process.cwd(), "dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Integrate Vite Dev Server Middleware
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    // Bind fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "index.html"));
    });
  });
}

// Fire up listeners
app.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenClaw AI Dashboard Server booting up on http://localhost:${PORT}`);
});
