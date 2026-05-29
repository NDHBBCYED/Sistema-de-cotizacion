/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  FileItem, 
  AIChatMessage, 
  Material, 
  FabProcess 
} from "../types";
import { 
  Folder, 
  MessageSquare, 
  BookOpen, 
  Database,
  Search, 
  Bot, 
  Paperclip, 
  Send, 
  Loader, 
  Wand2, 
  ChevronRight, 
  Plus, 
  CheckCheck,
  Play,
  FileMinus,
  HelpCircle,
  FileJson
} from "lucide-react";

interface SidebarProps {
  files: FileItem[];
  activeFile: FileItem;
  materials: Material[];
  processes: FabProcess[];
  chatHistory: AIChatMessage[];
  searchQuery: string;
  onSelectFile: (filePath: string) => void;
  onAddNewFile: () => void;
  onDeleteFile: (filePath: string) => void;
  onSetSearchQuery: (query: string) => void;
  onSendMessage: (userText: string) => void;
  onApplyAICode: (code: string) => void;
  isChatLoading: boolean;
  activeSidebarTab: "explorer" | "catalog" | "copilot" | "help";
  onSetSidebarTab: (tab: "explorer" | "catalog" | "copilot" | "help") => void;
}

export default function Sidebar({
  files,
  activeFile,
  materials,
  processes,
  chatHistory,
  searchQuery,
  onSelectFile,
  onAddNewFile,
  onDeleteFile,
  onSetSearchQuery,
  onSendMessage,
  onApplyAICode,
  isChatLoading,
  activeSidebarTab,
  onSetSidebarTab,
}: SidebarProps) {
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when message arrives
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isChatLoading) return;
    onSendMessage(promptText);
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-[#252526] border-r border-[#1e1e1e] flex text-gray-305 h-full select-none">
      
      {/* VS Code Side Activity Bar (Deep Panel Icons) */}
      <div className="w-12 bg-[#333333] flex flex-col items-center justify-between py-4 border-r border-[#1e1e1e] shrink-0">
        <div className="flex flex-col gap-5 w-full items-center">
          
          <button
            onClick={() => onSetSidebarTab("explorer")}
            className={`p-2 transition-all rounded text-center relative max-w-[36px] cursor-pointer ${
              activeSidebarTab === "explorer"
                ? "text-[#007acc] bg-[#252526] border-l-2 border-[#007acc] rounded-none w-full"
                : "text-gray-400 hover:text-white"
            }`}
            title="Workspace Files Explorer"
          >
            <Folder className="w-5 h-5 mx-auto" />
          </button>

          <button
            onClick={() => onSetSidebarTab("catalog")}
            className={`p-2 transition-all rounded text-center relative max-w-[36px] cursor-pointer ${
              activeSidebarTab === "catalog"
                ? "text-[#007acc] bg-[#252526] border-l-2 border-[#007acc] rounded-none w-full"
                : "text-gray-400 hover:text-white"
            }`}
            title="Raw Catalog Database overrides"
          >
            <Database className="w-5 h-5 mx-auto" />
          </button>

          <button
            onClick={() => onSetSidebarTab("copilot")}
            className={`p-2 transition-all rounded text-center relative max-w-[36px] cursor-pointer ${
              activeSidebarTab === "copilot"
                ? "text-[#007acc] bg-[#252526] border-l-2 border-[#007acc] rounded-none w-full"
                : "text-gray-400 hover:text-white"
            }`}
            title="QuoteCopilot AI chat assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 mx-auto" />
              {/* Little glowing indicator */}
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            </div>
          </button>

          <button
            onClick={() => onSetSidebarTab("help")}
            className={`p-2 transition-all rounded text-center relative max-w-[36px] cursor-pointer ${
              activeSidebarTab === "help"
                ? "text-[#007acc] bg-[#252526] border-l-2 border-[#007acc] rounded-none w-full"
                : "text-gray-400 hover:text-white"
            }`}
            title="Help documentation handbook"
          >
            <HelpCircle className="w-5 h-5 mx-auto" />
          </button>

        </div>

        {/* Bottom icon indicating telemetry or status */}
        <div className="text-gray-500 hover:text-gray-300 transition-colors text-center cursor-help">
          <BookOpen className="w-5 h-5 mx-auto" label="Docs" />
        </div>
      </div>

      {/* VS Code Panel Drawer Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#252526]">
        
        {/* Explorer Drawer view */}
        {activeSidebarTab === "explorer" && (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[#1e1e1e] flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-200">
                Workspace Explorer
              </span>
              <button
                onClick={onAddNewFile}
                className="p-1 hover:bg-[#3e3e42] transition-colors rounded text-gray-300"
                title="Create New Quote Config file"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Path filter Search field */}
            <div className="p-2 border-b border-[#1e1e1e] relative">
              <input
                type="text"
                placeholder="Search pricing records..."
                value={searchQuery}
                onChange={(e) => onSetSearchQuery(e.target.value)}
                className="bg-[#1e1e1e] border border-[#3e3e42] hover:border-[#4e4e52] focus:border-[#007acc] transition-colors rounded p-1.5 pl-7 w-full text-xs text-white outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-4 top-3.5" />
            </div>

            {/* File item trees */}
            <div className="flex-1 overflow-y-auto pt-2">
              <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 px-3 py-1 uppercase tracking-wide">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                material-quoting-workspace
              </div>

              <div className="pl-4 mt-1.5 space-y-0.5">
                {filteredFiles.map((f) => {
                  const isActive = f.path === activeFile.path;
                  return (
                    <div
                      key={f.path}
                      className={`group flex items-center justify-between px-3 py-1.5 text-xs rounded-l cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#37373d] text-white font-medium border-r-2 border-[#007acc]"
                          : "text-gray-400 hover:bg-[#2a2a2b] hover:text-gray-200"
                      }`}
                      onClick={() => onSelectFile(f.path)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileJson className="w-3.5 h-3.5 text-[#e5a00d] shrink-0" />
                        <span className="truncate">{f.name}</span>
                        {f.isDraft && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved alterations" />}
                      </div>

                      {/* Delete folder file item button */}
                      {files.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFile(f.path);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#1e1e1e] text-gray-500 hover:text-red-400 rounded transition-all shrink-0 cursor-pointer"
                          title="Trash this workspace config"
                        >
                          <FileMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {filteredFiles.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-[11px]">
                    No files found matching criteria.
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick stats panel */}
            <div className="p-3 bg-[#1e1e1e] border-t border-[#2d2d2d] shrink-0 text-[11px] text-gray-500 space-y-1">
              <div>Catalog status: <span className="text-gray-300 font-mono font-bold">{materials.length} Materials</span>, <span className="text-gray-300 font-mono font-bold">{processes.length} Processes</span> loaded.</div>
              <div>Save files often to keep estimates tightly synced.</div>
            </div>
          </div>
        )}

        {/* Database Quick Summary Tab drawer */}
        {activeSidebarTab === "catalog" && (
          <div className="flex flex-col h-full text-xs">
            <div className="p-3 border-b border-[#1e1e1e] flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-200">
                Catalog DB Overview
              </span>
              <button
                onClick={() => onSetSidebarTab("catalog")}
                className="text-[10px] text-[#007acc] hover:underline cursor-pointer"
              >
                Configure All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1.5">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Materials Wholesale Base Rates</div>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {materials.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-1.5 bg-[#1e1e1e] rounded font-mono text-[10.5px]">
                      <span className="text-gray-300 font-sans truncate pr-1 max-w-[150px]">{m.name}</span>
                      <span className="text-green-450 font-semibold shrink-0">${m.costPerKg.toFixed(2)}/kg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#1e1e1e]">
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Operating Machine Costs</div>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {processes.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-1.5 bg-[#1e1e1e] rounded font-mono text-[10.5px]">
                      <span className="text-gray-300 font-sans truncate pr-1 max-w-[140px]">{p.name}</span>
                      <span className="text-amber-500 font-semibold shrink-0">${p.ratePerHour}/hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Copilot Chat Drawer */}
        {activeSidebarTab === "copilot" && (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[#1e1e1e] flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-200">
                QuoteCopilot AI Assistant
              </span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 select-text">
              {chatHistory.length === 0 ? (
                <div className="p-4 bg-[#1e1e1e] rounded border border-purple-900/30 text-[11px] text-gray-400 space-y-3.5 relative">
                  <Wand2 className="w-5 h-5 text-purple-400 sticky top-0" />
                  <p>
                    Greetings! I am <strong>QuoteCopilot</strong>, your AI assistant for material quoting, sheet nesting, and CNC calculation.
                  </p>
                  <p>
                    Ask me to select raw structural metals, rewrite or optimize machining files, or generate a custom quote bracket from scratch.
                  </p>
                  
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">Quick Commands</div>
                    <button
                      onClick={() => handleQuickPrompt("Let's audit this quote file to reduce manufacturing setup and milling costs.")}
                      className="w-full text-left p-1.5 bg-[#252526] hover:bg-[#2e2e30] transition-colors rounded border border-purple-900/30 text-gray-300 truncate cursor-pointer text-[10.5px]"
                    >
                      ✦ Audit fabrication costs
                    </button>
                    <button
                      onClick={() => handleQuickPrompt("Write a quotation for structural carbon fiber aerospace linkage components.")}
                      className="w-full text-left p-1.5 bg-[#252526] hover:bg-[#2e2e30] transition-colors rounded border border-purple-900/30 text-gray-300 truncate cursor-pointer text-[10.5px]"
                    >
                      ✦ Generate custom carbon quote
                    </button>
                    <button
                      onClick={() => handleQuickPrompt("Recommend a cheap translucent material alternative to Polycarbonate.")}
                      className="w-full text-left p-1.5 bg-[#252526] hover:bg-[#2e2e30] transition-colors rounded border border-purple-900/30 text-gray-300 truncate cursor-pointer text-[10.5px]"
                    >
                      ✦ Compare acrylic vs polycarb densities
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg) => {
                    const isModel = msg.role === "model";
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg text-xs leading-relaxed max-w-[92%] select-text ${
                          isModel
                            ? "bg-[#1e1e1c] border border-purple-900/10 text-gray-200 self-start"
                            : "bg-[#0b3e66] border border-[#0d5ca0]/20 text-white self-end ml-auto"
                        }`}
                      >
                        <div className="font-semibold text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                          {isModel ? (
                            <>
                              <Bot className="w-3.5 h-3.5 text-purple-400" />
                              QuoteCopilot AI
                            </>
                          ) : (
                            "Estimator Engineer"
                          )}
                        </div>
                        <div className="whitespace-pre-wrap select-text">{msg.content}</div>

                        {/* Special button to immediately copy generated file JSON array code directly into editor active buffer */}
                        {isModel && msg.suggestedAction?.type === "apply_code" && (
                          <div className="mt-3 pt-2.5 border-t border-[#2d2d2d] flex justify-end">
                            <button
                              onClick={() => onApplyAICode(msg.suggestedAction!.code)}
                              className="px-2.5 py-1 bg-purple-900 hover:bg-purple-800 text-white font-semibold transition-all rounded shadow-md flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                            >
                              <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                              Apply suggested JSON code
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isChatLoading && (
                <div className="flex items-center gap-2 p-2 bg-[#1e1e1e] rounded text-xs text-gray-400 w-fit">
                  <Loader className="w-3.5 h-3.5 animate-spin text-[#007acc]" />
                  <span>AI is estimating materials...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat inputs */}
            <form onSubmit={handleSendChat} className="p-2 bg-[#1e1e1e] border-t border-[#2d2d2d] shrink-0">
              <div className="flex gap-1.5 relative">
                <input
                  type="text"
                  placeholder="Ask QuoteCopilot..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatLoading}
                  className="bg-[#252526] border border-[#3e3e42] focus:border-[#007acc] rounded-l p-2 w-full text-xs text-white outline-none pr-8"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-[#007acc] hover:bg-[#0062a3] text-white px-3 rounded-r flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Documentation handbook Help Tab */}
        {activeSidebarTab === "help" && (
          <div className="flex flex-col h-full text-xs text-gray-300 p-3.5 overflow-y-auto space-y-4">
            <h3 className="font-semibold text-gray-150 uppercase tracking-wider text-[11px] border-b border-[#2d2d2d] pb-2">
              User Instruction Manual
            </h3>
            
            <div className="space-y-3 select-text">
              <div className="space-y-1">
                <div className="font-semibold text-white">1. Writing Quoting Files</div>
                <div className="text-gray-400">
                  Select predefined workspace setups from the <strong>Files Explorer</strong> menu tab or generate custom quotes. Modify names, rates, quantities, form factors, and dimensional spans.
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-white">2. Raw JSON vs Form Builder</div>
                <div className="text-gray-400">
                  Switch cleanly anytime between the <strong>Interactive Form UI</strong> inputs and <strong>Raw JSON Code View</strong>. Standard syntax validation prevents calculation faults.
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-white">3. Material Customization</div>
                <div className="text-gray-400">
                  Open the <strong>Database override Catalog tab</strong> (or click Database Icon) to adjust densities or raw stock pricing, which automatically recalibrates overall estimates.
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-white">4. AI Copilot Capabilities</div>
                <div className="text-gray-400">
                  Ask QuoteCopilot in the <strong>Copilot chat tab</strong> questions like: <em>"optimize cnc time on this active linkage block"</em> or <em>"generate a quote of walnut drawer"</em> and easily apply code suggestions directly from the prompt response message interface.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
