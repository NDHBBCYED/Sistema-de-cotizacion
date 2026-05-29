/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Material, FabProcess, MaterialQuote, PartItem, HardwareItem, FileItem } from "../types";
import { 
  FileJson, 
  Layers, 
  SlidersHorizontal, 
  CirclePlay, 
  Save, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Settings, 
  Wrench,
  Wand2
} from "lucide-react";

interface CodeEditorProps {
  activeFile: FileItem;
  materials: Material[];
  processes: FabProcess[];
  onChangeContent: (newContent: string) => void;
  onSaveFile: () => void;
  onTriggerAICopilotOptimize: () => void;
}

export default function CodeEditor({
  activeFile,
  materials,
  processes,
  onChangeContent,
  onSaveFile,
  onTriggerAICopilotOptimize,
}: CodeEditorProps) {
  const [editorMode, setEditorMode] = useState<"json" | "visual">("visual");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedQuote, setParsedQuote] = useState<MaterialQuote | null>(null);
  const [schemaWarnings, setSchemaWarnings] = useState<string[]>([]);

  // 1. Sync Content to Parser
  useEffect(() => {
    try {
      const parsed = JSON.parse(activeFile.content);
      setParsedQuote(parsed);
      setJsonError(null);

      // Simple schema lint validation checks
      const warnings: string[] = [];
      if (parsed) {
        if (!parsed.quoteName) warnings.push("Property 'quoteName' is empty.");
        if (parsed.globalMarkup === undefined || parsed.globalMarkup < 1.0) {
          warnings.push("Property 'globalMarkup' is low (< 1.0). Consider adjusting to 1.1 - 1.5.");
        }
        if (parsed.parts && Array.isArray(parsed.parts)) {
          parsed.parts.forEach((p: PartItem, idx: number) => {
            if (!p.partId) warnings.push(`parts[${idx}] is missing a 'partId' key.`);
            const matExists = materials.some((m) => m.id === p.materialId);
            if (p.materialId && !matExists) {
              warnings.push(`parts[${idx}] ('${p.name || p.partId}') has unknown materialId reference: "${p.materialId}".`);
            }
            if (p.processes) {
              p.processes.forEach((procRef, prIdx) => {
                const procExists = processes.some((pr) => pr.id === procRef.processId);
                if (!procExists) {
                  warnings.push(`parts[${idx}] -> process[${prIdx}] has unknown processId reference: "${procRef.processId}".`);
                }
              });
            }
          });
        }
      }
      setSchemaWarnings(warnings);
    } catch (e: any) {
      setParsedQuote(null);
      setJsonError(e.message || "Invalid JSON syntax formatting.");
      setSchemaWarnings([]);
    }
  }, [activeFile.content, materials, processes]);

  const handleJsonTextStateChange = (text: string) => {
    onChangeContent(text);
  };

  const handleUpdateParsedField = (field: keyof MaterialQuote, value: any) => {
    if (!parsedQuote) return;
    const next = { ...parsedQuote, [field]: value };
    handleJsonTextStateChange(JSON.stringify(next, null, 2));
  };

  const handleUpdatePart = (partIdx: number, updatedPart: PartItem) => {
    if (!parsedQuote) return;
    const nextParts = [...parsedQuote.parts];
    nextParts[partIdx] = updatedPart;
    handleUpdateParsedField("parts", nextParts);
  };

  const handleDeletePart = (partIdx: number) => {
    if (!parsedQuote) return;
    const nextParts = parsedQuote.parts.filter((_, idx) => idx !== partIdx);
    handleUpdateParsedField("parts", nextParts);
  };

  const handleAddPart = () => {
    if (!parsedQuote) return;
    const defaultPart: PartItem = {
      partId: `new_part_${Date.now().toString().slice(-4)}`,
      name: "New Machined Part Block",
      materialId: materials[0]?.id || "al_6061_t6",
      form: "Block",
      dimensions: { length: 150, width: 100, height: 25 },
      quantity: 1,
      processes: [
        { processId: "cnc_mill_3", params: { durationMinutes: 30 } }
      ]
    };
    const nextParts = [...parsedQuote.parts, defaultPart];
    handleUpdateParsedField("parts", nextParts);
  };

  const handleUpdateHardwareItem = (hwIdx: number, field: keyof HardwareItem, value: any) => {
    if (!parsedQuote) return;
    const nextHw = [...parsedQuote.hardware];
    nextHw[hwIdx] = { ...nextHw[hwIdx], [field]: value };
    handleUpdateParsedField("hardware", nextHw);
  };

  const handleDeleteHardware = (hwIdx: number) => {
    if (!parsedQuote) return;
    const nextHw = parsedQuote.hardware.filter((_, idx) => idx !== hwIdx);
    handleUpdateParsedField("hardware", nextHw);
  };

  const handleAddHardware = () => {
    if (!parsedQuote) return;
    const defaultHw: HardwareItem = {
      id: `hw_${Date.now().toString().slice(-4)}`,
      name: "M4 Structural Stainless Bolt",
      unitCost: 0.12,
      quantity: 50,
      spec: "M4x12 socket head cap"
    };
    const nextHw = [...parsedQuote.hardware, defaultHw];
    handleUpdateParsedField("hardware", nextHw);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#2d2d2d]">
      {/* Editor Toggles Secondary Bar */}
      <div className="flex bg-[#252526] items-center justify-between px-3 py-1.5 border-b border-[#1e1e1e] text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditorMode("visual")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              editorMode === "visual"
                ? "bg-[#3e3e42] text-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Interactive Form UI
          </button>
          <button
            onClick={() => setEditorMode("json")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              editorMode === "json"
                ? "bg-[#3e3e42] text-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Raw JSON Code View
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Copilot shortcut trigger directly in Editor margins */}
          <button
            onClick={onTriggerAICopilotOptimize}
            className="text-[11px] bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800 text-purple-250 px-2 py-0.5 rounded flex items-center gap-1 font-sans cursor-pointer transition-colors"
            title="Ask QuoteCopilot to audit and improve fabrication complexity"
          >
            <Wand2 className="w-3 h-3 text-purple-400" />
            AI Audit Quote
          </button>

          <button
            onClick={onSaveFile}
            disabled={!!jsonError}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-white bg-green-700 hover:bg-green-600 font-medium transition-colors ${
              activeFile.isDraft ? "opacity-100" : "opacity-60 hover:opacity-100"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Save Code
          </button>
        </div>
      </div>

      {/* Editor Workspace Panel */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {editorMode === "json" ? (
          <div className="h-full flex flex-col font-mono text-[13px] leading-relaxed relative focus-within:ring-1 focus-within:ring-inset focus-within:ring-[#007acc]">
            {/* Syntax linter banners */}
            {jsonError && (
              <div className="m-3 p-3 bg-red-950/50 border border-red-900 rounded text-red-300 text-xs flex gap-2 items-start relative z-10 font-sans shadow-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">JSON Syntax Check Failure</div>
                  <div className="text-gray-300 font-mono text-[11px] mt-1">{jsonError}</div>
                  <div className="text-[10px] text-gray-400 mt-1">Please fix brackets, commas, or double-quotes to compile the live BOM estimation.</div>
                </div>
              </div>
            )}

            {!jsonError && schemaWarnings.length > 0 && (
              <div className="m-3 p-3 bg-yellow-950/40 border border-yellow-900/60 rounded text-yellow-300 text-xs flex gap-2 items-start relative z-10 font-sans shadow-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Schema Validation Warnings ({schemaWarnings.length})</div>
                  <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono text-[11px] text-gray-300">
                    {schemaWarnings.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {schemaWarnings.length > 3 && <li>And {schemaWarnings.length - 3} more structural warning annotations...</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex-1 flex min-h-0 relative">
              {/* Pseudo line numbers */}
              <div className="w-11 select-none text-right bg-[#1e1e1e] pr-2.5 text-gray-600 font-mono text-xs pt-3 leading-relaxed border-r border-[#2d2d2d]">
                {Array.from({ length: Math.max(15, activeFile.content.split("\n").length) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Text Area */}
              <textarea
                value={activeFile.content}
                onChange={(e) => handleJsonTextStateChange(e.target.value)}
                className="flex-1 h-full bg-[#1e1e1e] text-blue-100 font-mono text-xs p-3 leading-relaxed placeholder-gray-600 resize-none outline-none overflow-y-auto block whitespace-pre-wrap select-text"
                spellCheck="false"
                placeholder="/* Place raw material quotation config keys here */"
              />
            </div>
          </div>
        ) : (
          // Visual Form Builder View
          <div className="p-4 space-y-6 text-xs text-gray-200">
            {jsonError ? (
              <div className="p-8 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="font-semibold text-gray-100 font-sans text-sm">Cannot Load Visual Editor Mode</h4>
                <p className="text-gray-400 max-w-sm mx-auto">
                  The active JSON has validation or formatting syntax errors. Correct the file in <strong>Raw JSON Code View</strong> first to restore form bindings.
                </p>
                <button
                  onClick={() => setEditorMode("json")}
                  className="px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3e3e42] hover:border-white transition-all text-white rounded font-medium"
                >
                  Jump to Syntax Code View
                </button>
              </div>
            ) : parsedQuote ? (
              <div className="space-y-6">
                {/* Global Properties section */}
                <div className="p-4 bg-[#252526] rounded border border-[#2d2d2d] space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-[#3e3e42] pb-2">
                    <Settings className="w-4 h-4 text-[#007acc]" />
                    <h3 className="text-xs font-semibold text-gray-100 font-sans uppercase tracking-wider">
                      Quote General Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-gray-400 mb-1">Quote Name / ID</label>
                      <input
                        type="text"
                        value={parsedQuote.quoteName || ""}
                        onChange={(e) => handleUpdateParsedField("quoteName", e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] hover:border-[#4e4e52] focus:border-[#007acc] rounded px-3 py-1.5 text-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Customer / Client Name</label>
                      <input
                        type="text"
                        value={parsedQuote.customerName || ""}
                        onChange={(e) => handleUpdateParsedField("customerName", e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] hover:border-[#4e4e52] focus:border-[#007acc] rounded px-3 py-1.5 text-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Authorized Estimator</label>
                      <input
                        type="text"
                        value={parsedQuote.creatorName || ""}
                        onChange={(e) => handleUpdateParsedField("creatorName", e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] hover:border-[#4e4e52] focus:border-[#007acc] rounded px-3 py-1.5 text-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Sales State</label>
                      <select
                        value={parsedQuote.status || "Draft"}
                        onChange={(e) => handleUpdateParsedField("status", e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded h-[29.5px] px-2 text-white"
                      >
                        <option value="Draft">Draft Workspace</option>
                        <option value="Approved">Approved / Certified</option>
                        <option value="Sent">Sent to Procurement</option>
                        <option value="Expired">Expired Link</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Profit Markup (Multiplier)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1.0"
                          max="2.0"
                          step="0.05"
                          value={parsedQuote.globalMarkup || 1.0}
                          onChange={(e) => handleUpdateParsedField("globalMarkup", parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer accent-[#007acc]"
                        />
                        <span className="font-mono text-[11px] font-bold text-[#007acc] w-12 text-right">
                          {((parsedQuote.globalMarkup - 1.0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Operating Assembly Labor ($/hr)</label>
                      <input
                        type="number"
                        value={parsedQuote.laborRatePerHour || 0}
                        onChange={(e) => handleUpdateParsedField("laborRatePerHour", parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Tax Surcharge (%)</label>
                      <input
                        type="number"
                        step="0.005"
                        value={(parsedQuote.taxRate || 0) * 100}
                        onChange={(e) => handleUpdateParsedField("taxRate", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Wholesale Flat Shipping ($)</label>
                      <input
                        type="number"
                        value={parsedQuote.shippingCost || 0}
                        onChange={(e) => handleUpdateParsedField("shippingCost", parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Manual Assembly (Hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={parsedQuote.laborAssemblyHours || 0}
                        onChange={(e) => handleUpdateParsedField("laborAssemblyHours", parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Fabricated custom parts section */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
                    <h3 className="text-xs font-semibold text-gray-100 flex items-center gap-1.5 font-sans uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-[#007acc]" />
                      Custom Machined & Fabricated Parts ({parsedQuote.parts?.length || 0})
                    </h3>
                    <button
                      onClick={handleAddPart}
                      className="px-2.5 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3e3e42] hover:border-white transition-colors text-white rounded flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Part Item
                    </button>
                  </div>

                  {parsedQuote.parts && parsedQuote.parts.length === 0 ? (
                    <div className="p-8 text-center bg-[#252526] rounded border border-[#2d2d2d] border-dashed text-gray-500">
                      No custom parts listed. Click above to add a new part.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {parsedQuote.parts?.map((part, partIdx) => (
                        <div
                          key={partIdx}
                          className="p-4 bg-[#252526] rounded border border-[#2d2d2d] hover:border-[#3e3e42] transition-colors relative"
                        >
                          {/* Close/delete button */}
                          <button
                            onClick={() => handleDeletePart(partIdx)}
                            className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-[#1e1e1e] transition-all cursor-pointer"
                            title="Delete this part record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
                            <div>
                              <label className="block text-gray-400 mb-0.5">Part ID (Internal Code)</label>
                              <input
                                type="text"
                                value={part.partId}
                                onChange={(e) =>
                                  handleUpdatePart(partIdx, { ...part, partId: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                                }
                                className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1 font-mono text-white text-[11px]"
                              />
                            </div>
                            <div className="lg:col-span-2">
                              <label className="block text-gray-400 mb-0.5">Part Name</label>
                              <input
                                type="text"
                                value={part.name || ""}
                                onChange={(e) => handleUpdatePart(partIdx, { ...part, name: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1 text-white text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-0.5">Wholesale Material</label>
                              <select
                                value={part.materialId}
                                onChange={(e) => handleUpdatePart(partIdx, { ...part, materialId: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded h-[26.4px] px-2 text-white text-[11px]"
                              >
                                {materials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.category})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Dimensions & Form aspect */}
                          <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2d2d2d] pb-2 text-[11px]">
                              <div className="flex items-center gap-1.5 text-gray-300">
                                <span className="font-semibold text-gray-200">Form Aspect:</span>
                                <select
                                  value={part.form}
                                  onChange={(e) => {
                                    const nextForm = e.target.value as any;
                                    // Set some nice default dimensions if swapping
                                    const d: any = {};
                                    if (nextForm === "Block") { d.length = 150; d.width = 100; d.height = 20; }
                                    else if (nextForm === "Sheet") { d.length = 300; d.width = 200; d.thickness = 3; }
                                    else if (nextForm === "Cylinder") { d.diameter = 30; d.length = 200; }
                                    else { d.weightGrams = 250; }
                                    handleUpdatePart(partIdx, { ...part, form: nextForm, dimensions: d });
                                  }}
                                  className="bg-[#252526] border border-[#3e3e42] rounded px-1.5 py-0.5 text-white"
                                >
                                  <option value="Block">Block</option>
                                  <option value="Sheet">Sheet</option>
                                  <option value="Cylinder">Cylinder (Rod)</option>
                                  <option value="Custom">Custom Override</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="text-gray-400">Batch Quantity: </span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={part.quantity}
                                    onChange={(e) => handleUpdatePart(partIdx, { ...part, quantity: parseInt(e.target.value) || 1 })}
                                    className="bg-[#252526] border border-[#3e3e42] rounded w-12 text-center text-white"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Dimension inputs according to active form aspect */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                              {part.form === "Block" && (
                                <>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Length (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.length || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, length: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Width (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.width || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, width: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Height (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.height || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, height: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                </>
                              )}

                              {part.form === "Sheet" && (
                                <>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Length (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.length || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, length: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Width (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.width || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, width: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Thickness (mm)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={part.dimensions.thickness || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, thickness: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                </>
                              )}

                              {part.form === "Cylinder" && (
                                <>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Diameter (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.diameter || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, diameter: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Length (mm)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.length || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, length: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                    />
                                  </div>
                                </>
                              )}

                              {part.form === "Custom" && (
                                <>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Calculated Mass (grams)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.weightGrams || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, weightGrams: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                      placeholder="e.g. 120"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-400 mb-0.5">Direct Vol Offset (cm³)</label>
                                    <input
                                      type="number"
                                      value={part.dimensions.baseVolumeCm3 || ""}
                                      onChange={(e) =>
                                        handleUpdatePart(partIdx, { ...part, dimensions: { ...part.dimensions, baseVolumeCm3: parseFloat(e.target.value) || 0 } })
                                      }
                                      className="w-full bg-[#252526] border border-[#3e3e42] rounded px-2.5 py-1 text-white font-mono"
                                      placeholder="e.g. 50"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Associate fabrication processes */}
                          <div className="mt-3.5 space-y-2 text-[11px]">
                            <div className="flex items-center justify-between text-[#858585] border-b border-[#2d2d2d] pb-1">
                              <span className="font-semibold text-gray-300 flex items-center gap-1">
                                <Wrench className="w-3.5 h-3.5 text-gray-400" />
                                Processing Ops & Machine Time Estimation
                              </span>
                              <button
                                onClick={() => {
                                  // Add first unassociated process
                                  const unassociated = processes.find((p) => !part.processes.some((pr) => pr.processId === p.id));
                                  const nextProcId = unassociated ? unassociated.id : processes[0]?.id;
                                  if (nextProcId) {
                                    const nextProcs = [...part.processes, { processId: nextProcId, params: { durationMinutes: 15 } }];
                                    handleUpdatePart(partIdx, { ...part, processes: nextProcs });
                                  }
                                }}
                                className="text-[10px] text-gray-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                Add Operation
                              </button>
                            </div>

                            {part.processes.length === 0 ? (
                              <div className="text-gray-500 py-1.5 text-center bg-[#1e1e1e] rounded text-[10px] border border-[#2d2d2d] border-dashed">
                                No raw fabrication operations mapped. Item is calculated at pure stock metal/wood rates.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {part.processes.map((procRef, prIdx) => {
                                  const processRecord = processes.find((pr) => pr.id === procRef.processId);
                                  return (
                                    <div
                                      key={prIdx}
                                      className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d]"
                                    >
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={procRef.processId}
                                          onChange={(e) => {
                                            const nextProcs = [...part.processes];
                                            nextProcs[prIdx] = { ...procRef, processId: e.target.value };
                                            handleUpdatePart(partIdx, { ...part, processes: nextProcs });
                                          }}
                                          className="bg-[#252526] border border-[#3e3e42] rounded px-1.5 py-0.5 text-white"
                                        >
                                          {processes.map((pr) => (
                                            <option key={pr.id} value={pr.id}>
                                              {pr.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="flex items-center gap-4 text-gray-400">
                                        <div className="flex items-center gap-1">
                                          <span>Setup Override ($):</span>
                                          <input
                                            type="number"
                                            value={procRef.params?.setupOverride !== undefined ? procRef.params.setupOverride : processRecord?.setupCost || 0}
                                            onChange={(e) => {
                                              const nextProcs = [...part.processes];
                                              nextProcs[prIdx] = {
                                                ...procRef,
                                                params: { ...procRef.params, setupOverride: parseFloat(e.target.value) || 0 },
                                              };
                                              handleUpdatePart(partIdx, { ...part, processes: nextProcs });
                                            }}
                                            className="bg-[#252526] border border-[#3e3e42] rounded w-12 text-center text-white font-mono"
                                          />
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <span>Run (mins):</span>
                                          <input
                                            type="number"
                                            value={procRef.params?.durationMinutes || 0}
                                            onChange={(e) => {
                                              const nextProcs = [...part.processes];
                                              nextProcs[prIdx] = {
                                                ...procRef,
                                                params: { ...procRef.params, durationMinutes: parseInt(e.target.value) || 0 },
                                              };
                                              handleUpdatePart(partIdx, { ...part, processes: nextProcs });
                                            }}
                                            className="bg-[#252526] border border-[#3e3e42] rounded w-12 text-center text-white font-mono"
                                          />
                                        </div>

                                        {processRecord?.ratePerUnit && (
                                          <div className="flex items-center gap-1">
                                            <span>Billing Unit Count ({processRecord.unitName || "unit"}):</span>
                                            <input
                                              type="number"
                                              value={procRef.params?.customUnitsValue || 0}
                                              onChange={(e) => {
                                                const nextProcs = [...part.processes];
                                                nextProcs[prIdx] = {
                                                  ...procRef,
                                                  params: { ...procRef.params, customUnitsValue: parseFloat(e.target.value) || 0 },
                                                };
                                                handleUpdatePart(partIdx, { ...part, processes: nextProcs });
                                              }}
                                              className="bg-[#252526] border border-[#3e3e42] rounded w-16 text-center text-white font-mono"
                                            />
                                          </div>
                                        )}

                                        <button
                                          onClick={() => {
                                            const nextProcs = part.processes.filter((_, idx) => idx !== prIdx);
                                            handleUpdatePart(partIdx, { ...part, processes: nextProcs });
                                          }}
                                          className="text-gray-500 hover:text-red-400 p-0.5"
                                          title="Remove this machining operation"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Standard Assembly Hardware list */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
                    <h3 className="text-xs font-semibold text-gray-100 flex items-center gap-1.5 font-sans uppercase tracking-wider">
                      <Wrench className="w-4 h-4 text-[#007acc]" />
                      Couplings, Anchors & Assembly Hardware ({parsedQuote.hardware?.length || 0})
                    </h3>
                    <button
                      onClick={handleAddHardware}
                      className="px-2.5 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3e3e42] hover:border-white transition-colors text-white rounded flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Hardware Part
                    </button>
                  </div>

                  {parsedQuote.hardware && parsedQuote.hardware.length === 0 ? (
                    <div className="p-6 text-center bg-[#252526] rounded border border-[#2d2d2d] border-dashed text-gray-500">
                      No fasteners or assembly hardware items referenced mapping. Click button above to map screws/inserts.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {parsedQuote.hardware?.map((item, hwIdx) => (
                        <div
                          key={item.id || hwIdx}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#252526] rounded border border-[#2d2d2d] hover:border-[#3e3e42]"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-grow max-w-xl">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateHardwareItem(hwIdx, "name", e.target.value)}
                              placeholder="M3 Black Screw Hex"
                              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1 text-white"
                            />
                            <input
                              type="text"
                              value={item.spec || ""}
                              onChange={(e) => handleUpdateHardwareItem(hwIdx, "spec", e.target.value)}
                              placeholder="Metric 10.9 Carbon Head"
                              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1 text-gray-400 placeholder-gray-650 font-mono text-[10px]"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Unit Cost ($):</span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => handleUpdateHardwareItem(hwIdx, "unitCost", parseFloat(e.target.value) || 0)}
                                className="bg-[#1e1e1e] border border-[#3e3e42] rounded w-16 text-center text-white font-mono"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Count:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateHardwareItem(hwIdx, "quantity", parseInt(e.target.value) || 1)}
                                className="bg-[#1e1e1e] border border-[#3e3e42] rounded w-12 text-center text-white font-mono"
                              />
                            </div>

                            <button
                              onClick={() => handleDeleteHardware(hwIdx)}
                              className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-[#1e1e1e] transition-colors"
                              title="Delete Hardware Line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <Info className="w-8 h-8 text-gray-500 mx-auto" />
                <h4 className="font-semibold text-gray-100 font-sans text-sm">Empty Quotation File</h4>
                <p className="text-gray-400 max-w-sm mx-auto">
                  This file seems empty or could not be initialized correctly. Write or reset to draft to recover bindings.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
