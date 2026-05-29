/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Material, FabProcess, FileItem, AIChatMessage } from "./types";
import { DEFAULT_MATERIALS, DEFAULT_PROCESSES, TEMPLATE_QUOTES } from "./catalog";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import BOMVisualizer from "./components/BOMVisualizer";
import CatalogManager from "./components/CatalogManager";
import { 
  Terminal, 
  Settings, 
  Play, 
  HelpCircle, 
  Github, 
  Check, 
  AlertCircle, 
  Cpu, 
  FileCode, 
  History,
  GitBranch,
  Bell,
  RefreshCw,
  Columns
} from "lucide-react";

export default function App() {
  // 1. Core State Managers
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState("quadcopter_frame.quote.json");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [processes, setProcesses] = useState<FabProcess[]>([]);
  const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<"explorer" | "catalog" | "copilot" | "help">("explorer");
  const [rightPanel, setRightPanel] = useState<"visualizer" | "catalog">("visualizer");

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeTerminalTab, setActiveTerminalTab] = useState<"terminal" | "problems" | "output">("terminal");
  const terminalRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [alertNotification, setAlertNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // 2. Initialize and Load from LocalStorage
  useEffect(() => {
    // A. Load catalog databases
    const storedMaterials = localStorage.getItem("quote_ide_materials");
    const storedProcesses = localStorage.getItem("quote_ide_processes");
    if (storedMaterials) {
      setMaterials(JSON.parse(storedMaterials));
    } else {
      setMaterials(DEFAULT_MATERIALS);
    }
    if (storedProcesses) {
      setProcesses(JSON.parse(storedProcesses));
    } else {
      setProcesses(DEFAULT_PROCESSES);
    }

    // B. Load files workspace
    const storedFiles = localStorage.getItem("quote_ide_workspace_files");
    if (storedFiles) {
      const parsedFiles = JSON.parse(storedFiles);
      setFiles(parsedFiles);
      if (parsedFiles.length > 0) {
        setActiveFilePath(parsedFiles[0].path);
      }
    } else {
      // Load preset templates
      const items: FileItem[] = Object.keys(TEMPLATE_QUOTES).map((name) => ({
        name: name,
        path: name,
        content: TEMPLATE_QUOTES[name],
        isDraft: false,
      }));
      setFiles(items);
      localStorage.setItem("quote_ide_workspace_files", JSON.stringify(items));
    }

    // C. Initialize logs
    addTerminalLog("SYSTEM: Initialize Material Quoting Engine v1.0.0...");
    addTerminalLog("DATABASE: Connected to local Materials database (Ready)");
    addTerminalLog("SERVER: Route API bindings configured. GEMINI model ready for requests.");
  }, []);

  // Save changes to directories on updates
  const saveWorkspaceToStore = (nextFiles: FileItem[]) => {
    localStorage.setItem("quote_ide_workspace_files", JSON.stringify(nextFiles));
  };

  const handleUpdateMaterials = (updated: Material[]) => {
    setMaterials(updated);
    localStorage.setItem("quote_ide_materials", JSON.stringify(updated));
    addTerminalLog(`DATABASE: Update Material Specifications catalog (Reloading compiler)...`);
  };

  const handleUpdateProcesses = (updated: FabProcess[]) => {
    setProcesses(updated);
    localStorage.setItem("quote_ide_processes", JSON.stringify(updated));
    addTerminalLog(`DATABASE: Reload Fabrication setup/run standard operational rates...`);
  };

  const handleResetCatalog = () => {
    if (window.confirm("Restore materials and fabrication indexes to original factory catalogs? Custom additions will be overwritten.")) {
      setMaterials(DEFAULT_MATERIALS);
      setProcesses(DEFAULT_PROCESSES);
      localStorage.removeItem("quote_ide_materials");
      localStorage.removeItem("quote_ide_processes");
      addTerminalLog("SYSTEM: Restoring catalog index maps to original configurations...");
      triggerAlert("Database indexes successfully cataloged to factories defaults.", "info");
    }
  };

  // Helper additions for custom logs
  const addTerminalLog = (logText: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${timestamp}] ${logText}`]);
  };

  // Scroll terminal logs on updates
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const triggerAlert = (msg: string, type: "success" | "info" | "error" = "success") => {
    setAlertNotification({ message: msg, type });
    setTimeout(() => {
      setAlertNotification(null);
    }, 4000);
  };

  // 3. active file content tracker
  const activeFile = files.find((f) => f.path === activeFilePath) || {
    name: "empty.quote.json",
    path: "empty.quote.json",
    content: "{}",
    isDraft: false,
  };

  const handleSaveActiveFile = () => {
    const next = files.map((f) => {
      if (f.path === activeFile.path) {
        return { ...f, isDraft: false };
      }
      return f;
    });
    setFiles(next);
    saveWorkspaceToStore(next);
    addTerminalLog(`FILES: Compiling workspace changes successfully. Content written to "${activeFile.name}".`);
    triggerAlert(`Written changes to disk: "${activeFile.name}"`, "success");
  };

  const handleEditActiveContent = (newText: string) => {
    const next = files.map((f) => {
      if (f.path === activeFile.path) {
        return { ...f, content: newText, isDraft: true };
      }
      return f;
    });
    setFiles(next);
  };

  const handleApplyAICode = (generatedCode: string) => {
    handleEditActiveContent(generatedCode);
    addTerminalLog(`AI: Applying customized quotation configurations to current editor buffer.`);
    triggerAlert("Quotation schema modified by Copilot code model suggestions.", "info");
  };

  // 4. File Directories Management
  const handleAddNewFile = () => {
    const nameInput = window.prompt("Enter name for a new quotation file (e.g. bracket_quote.quote.json):");
    if (!nameInput) return;

    let sanitized = nameInput.trim();
    if (!sanitized.endsWith(".quote.json")) {
      sanitized += ".quote.json";
    }

    // Check collision
    if (files.some((f) => f.path === sanitized)) {
      triggerAlert("A quote file with this name already exists in workspace.", "error");
      return;
    }

    const initialTemplate = {
      quoteName: sanitized.replace(".quote.json", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + " Quotation",
      customerName: "New Customer Organization Inc.",
      creatorName: "Lead Design Estimator",
      dateCreated: new Date().toISOString().split("T")[0],
      status: "Draft",
      globalMarkup: 1.25,
      taxRate: 0.08,
      shippingCost: 15.00,
      laborRatePerHour: 45,
      laborAssemblyHours: 1,
      parts: [],
      hardware: [],
    };

    const nextFile: FileItem = {
      name: sanitized,
      path: sanitized,
      content: JSON.stringify(initialTemplate, null, 2),
      isDraft: true,
    };

    const nextFiles = [...files, nextFile];
    setFiles(nextFiles);
    setActiveFilePath(nextFile.path);
    saveWorkspaceToStore(nextFiles);

    addTerminalLog(`FILES: Created new empty configuration sheet "${nextFile.path}" in root workspace directory.`);
    triggerAlert(`Registered workspace file entry: "${nextFile.name}"`, "success");
  };

  const handleDeleteFile = (filePath: string) => {
    if (files.length <= 1) {
      triggerAlert("Cannot delete the last remaining quotation setup.", "error");
      return;
    }
    if (window.confirm(`Permanently trash workspace file database record "${filePath}"?`)) {
      const nextFiles = files.filter((f) => f.path !== filePath);
      setFiles(nextFiles);
      saveWorkspaceToStore(nextFiles);

      // Reset active target
      if (activeFilePath === filePath) {
        setActiveFilePath(nextFiles[0].path);
      }

      addTerminalLog(`FILES: Purged config profile "${filePath}" from local directories.`);
      triggerAlert("Permanently deleted quotation document configuration.", "info");
    }
  };

  // 5. Copilot Chat Interface Integration
  const handleSendMessage = async (userText: string) => {
    const userMsg: AIChatMessage = {
      id: "u_" + Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    addTerminalLog(`AI: Connecting server proxy... Prompt sent: "${userText.slice(0, 40)}..."`);

    try {
      const payloadMessages = [...chatHistory, userMsg];
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: payloadMessages.map((m) => ({ role: m.role, content: m.content })),
          activeFile: activeFile.name,
          activeContent: activeFile.content,
        }),
      });

      if (!res.ok) {
        throw new Error("Local model returned internal status code error: " + res.status);
      }

      const data = await res.json();

      const modelMsg: AIChatMessage = {
        id: "m_" + Date.now().toString(),
        role: "model",
        content: data.content || "Empty response returned.",
        timestamp: new Date().toLocaleTimeString(),
        suggestedAction: data.suggestedAction,
      };

      setChatHistory((prev) => [...prev, modelMsg]);
      addTerminalLog(`AI: Processing response complete. Copilot returned markup configurations.`);
    } catch (err: any) {
      addTerminalLog(`AI ERROR: Failed to compute estimates - ${err.message || "Network Timeout"}`);
      triggerAlert("AI Proxy Error: Check API endpoint connection status or developer logs.", "error");

      // Set fallback friendly error response
      setChatHistory((prev) => [
        ...prev,
        {
          id: "m_err_" + Date.now().toString(),
          role: "model",
          content: `⚠️ Failed to fetch from QuoteCopilot server-side endpoint.

Is your GEMINI_API_KEY environment variable configured? You can configure it anytime in **Settings > Secrets** panel of the AI Studio.

Meanwhile, here is an example quotation structure you can manually write into your **Raw JSON Code View** to initialize calculation:
\`\`\`json
{
  "quoteName": "Example Optimized Quote",
  "customerName": "Demo Corp",
  "globalMarkup": 1.25,
  "parts": []
}
\`\`\`

Ask again once your environment secrets are refreshed!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 6. Direct Prompt Optimize shortcuts from editor
  const handleEditorTriggerCopilotOptimize = () => {
    setActiveSidebarTab("copilot");
    handleSendMessage(`Please review the active file "${activeFile.name}". Identify potential cost-saving material substitutions (e.g. steel to aluminum or polycarbonate to acrylic where structural boundaries allow) and check if setup fees or hourly fabrication run times can be consolidated.`);
  };

  // Problems Count Checker (schema check counts as problems)
  const problemCount = useMemo(() => {
    try {
      JSON.parse(activeFile.content);
      return 0;
    } catch {
      return 1;
    }
  }, [activeFile.content]);

  return (
    <div className="h-screen w-screen bg-[#1e1e1e] text-gray-300 flex flex-col font-sans select-none overflow-hidden text-xs">
      
      {/* Visual Window Title Bar Header */}
      <div className="bg-[#1e1e1e] border-b border-[#2d2d2d] h-9 px-3 flex items-center justify-between shrink-0 select-none select-none">
        {/* Left red-yellow-green dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          <span className="text-[11px] text-[#858585] ml-2 font-mono tracking-wide font-normal">
            Material Quote IDE • Desktop Environment
          </span>
        </div>

        {/* Current App path label */}
        <div className="text-[11px] font-sans text-gray-400 font-medium truncate max-w-[400px]">
          {activeFile.name} {activeFile.isDraft ? "• Draft buffer" : ""} - Material Quoting System
        </div>

        {/* Action icons right */}
        <div className="flex items-center gap-2 text-gray-400">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#252526] rounded text-[11px] font-mono border border-[#3e3e42]">
            <Cpu className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span>Server Active Connection</span>
          </div>
        </div>
      </div>

      {/* Persistent Notification Modals */}
      {alertNotification && (
        <div className={`fixed top-12 right-4 z-50 p-3.5 rounded-lg shadow-2xl border text-xs flex gap-2.5 items-center max-w-sm font-sans animate-bounce ${
          alertNotification.type === "success" 
            ? "bg-green-950/90 border-green-800 text-green-150" 
            : alertNotification.type === "error" 
              ? "bg-red-950/90 border-red-850 text-red-200" 
              : "bg-blue-950/90 border-blue-800 text-blue-200"
        }`}>
          {alertNotification.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-green-400 shrink-0" />
          )}
          <span className="font-medium text-gray-100">{alertNotification.message}</span>
        </div>
      )}

      {/* Main Split Panels content */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Sidebar explorer panel */}
        <Sidebar
          files={files}
          activeFile={activeFile}
          materials={materials}
          processes={processes}
          chatHistory={chatHistory}
          searchQuery={searchQuery}
          onSelectFile={setActiveFilePath}
          onAddNewFile={handleAddNewFile}
          onDeleteFile={handleDeleteFile}
          onSetSearchQuery={setSearchQuery}
          onSendMessage={handleSendMessage}
          onApplyAICode={handleApplyAICode}
          isChatLoading={isChatLoading}
          activeSidebarTab={activeSidebarTab}
          onSetSidebarTab={setActiveSidebarTab}
        />

        {/* Split screen content area (Editor left, visualizer right) */}
        <div className="flex-1 flex min-w-0 h-full">
          
          {/* Workspace code pane Editor (Left split module) */}
          <div className="flex-1 flex flex-col min-w-[40%] border-r border-[#1e1e1e]">
            {/* Tab header label */}
            <div className="flex bg-[#252526] border-b border-[#2d2d2d] items-center text-xs overflow-x-auto min-h-[30px] select-none text-[11.5px] scrollbar-none shrink-0">
              <div className="px-4 py-1.5 bg-[#1e1e1e] text-white border-t-2 border-[#007acc] flex items-center gap-2 shrink-0 border-r border-[#2d2d2d] font-mono select-none">
                <FileCode className="w-3.5 h-3.5 text-yellow-500" />
                <span>{activeFile.name}</span>
                {activeFile.isDraft && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0 ml-1.5" />
                )}
              </div>
              <div 
                onClick={() => {
                  setRightPanel(rightPanel === "visualizer" ? "catalog" : "visualizer");
                  addTerminalLog(`IDE: Toggle secondary view pane: ${rightPanel === "visualizer" ? "Catalog Editor" : "BOM Calc render"}.`);
                }}
                className="ml-auto px-4 py-1.5 text-gray-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                title="Toggle visualizer split screen layout"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Layout Target: {rightPanel === "visualizer" ? "Show Catalog DB" : "Show BOM Graph"}</span>
              </div>
            </div>

            {/* Inner code area editor */}
            <div className="flex-1 min-h-0">
              <CodeEditor
                activeFile={activeFile}
                materials={materials}
                processes={processes}
                onChangeContent={handleEditActiveContent}
                onSaveFile={handleSaveActiveFile}
                onTriggerAICopilotOptimize={handleEditorTriggerCopilotOptimize}
              />
            </div>

            {/* Bottom auxiliary shell terminal */}
            <div className="h-44 bg-[#1e1e1e] border-t border-[#2d2d2d] flex flex-col shrink-0">
              <div className="flex bg-[#252526] items-center text-xs border-b border-[#1e1e1e] select-none text-[10.5px]">
                <button
                  onClick={() => setActiveTerminalTab("terminal")}
                  className={`px-4 py-1.5 font-semibold uppercase tracking-wider ${
                    activeTerminalTab === "terminal" ? "text-white bg-[#1e1e1e] font-bold" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Bash Terminal Console
                </button>
                <button
                  onClick={() => setActiveTerminalTab("problems")}
                  className={`px-4 py-1.5 font-semibold uppercase tracking-wider flex items-center gap-1 ${
                    activeTerminalTab === "problems" ? "text-white bg-[#1e1e1e] font-bold" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Compilation Problems
                  <span className={`px-1 rounded-full text-[9px] ${problemCount > 0 ? "bg-red-800 text-red-200" : "bg-gray-800 text-gray-500"}`}>
                    {problemCount}
                  </span>
                </button>
                <button
                  onClick={() => setTerminalLogs([])}
                  className="ml-auto text-[10px] text-gray-500 hover:text-red-400 px-3 py-1.5 cursor-pointer"
                >
                  Clear logs
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-gray-400 selection:bg-[#32e0c4]/30" ref={terminalRef}>
                {activeTerminalTab === "terminal" ? (
                  <div className="space-y-0.5">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="whitespace-pre-wrap select-text">{log}</div>
                    ))}
                    <div className="text-gray-500 pt-0.5 select-none">$ _ <span className="animate-pulse">⬛</span></div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1.5">
                    {problemCount > 0 ? (
                      <div className="flex items-start gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <div className="font-semibold text-[11.5px]">JSON Code Compile Syntax Error</div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            The quotation configuration in the text area lacks clean brackets, ending commas, or quotes. Check your editor warnings or chat helper.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-450 font-sans p-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        <span>No structural syntax errors detected in active quote stream. Everything is building clean.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Graphical calculations visualizer split screen layout (Right Split Module) */}
          <div className="w-[50%] min-w-[30%] max-w-[65%] h-full shrink-0 flex flex-col bg-[#252526]">
            {rightPanel === "visualizer" ? (
              <BOMVisualizer
                quoteContent={activeFile.content}
                materials={materials}
                processes={processes}
              />
            ) : (
              <CatalogManager
                materials={materials}
                processes={processes}
                onUpdateMaterials={handleUpdateMaterials}
                onUpdateProcesses={handleUpdateProcesses}
                onResetCatalog={handleResetCatalog}
              />
            )}
          </div>

        </div>
      </div>

      {/* VS Code Bottom Flat Footer Status Bar */}
      <div className="bg-[#007acc] text-white h-[22px] px-3 flex items-center justify-between shrink-0 select-none select-none text-[11px] font-sans">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 select-none uppercase tracking-wide">
            <GitBranch className="w-3.5 h-3.5" />
            <span>main</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
            <span>Quotes Engine Indexed</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div>UTF-8</div>
          <div className="px-1 bg-white/10 rounded uppercase tracking-wider text-[10px]">JSON Configuration</div>
          <div>UTC Clock: {new Date().toISOString().slice(11, 16)}</div>
          <button 
            onClick={() => {
              triggerAlert("Welcome to Material Quote IDE! Built for industrial fabricate estimator workflows.", "info");
              addTerminalLog("SYSTEM: Checked active notifications list.");
            }}
            className="p-1 hover:bg-white/10 transition-colors rounded cursor-pointer"
            title="Notification alerts checklist"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
