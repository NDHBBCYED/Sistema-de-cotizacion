/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Material, FabProcess } from "../types";
import { Hammer, CircleDollarSign, Plus, RotateCcw, HelpCircle, Layers, Scale } from "lucide-react";

interface CatalogManagerProps {
  materials: Material[];
  processes: FabProcess[];
  onUpdateMaterials: (m: Material[]) => void;
  onUpdateProcesses: (p: FabProcess[]) => void;
  onResetCatalog: () => void;
}

export default function CatalogManager({
  materials,
  processes,
  onUpdateMaterials,
  onUpdateProcesses,
  onResetCatalog,
}: CatalogManagerProps) {
  const [activeTab, setActiveTab] = useState<"materials" | "processes">("materials");
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);

  // New item states
  const [newMat, setNewMat] = useState<Partial<Material>>({
    id: "",
    name: "",
    category: "Metal",
    density: 2.7,
    costPerKg: 5.0,
    desc: "",
  });

  const [newProc, setNewProc] = useState<Partial<FabProcess>>({
    id: "",
    name: "",
    category: "Machining",
    setupCost: 50,
    ratePerHour: 60,
    ratePerUnit: undefined,
    unitName: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveMaterial = (id: string, field: keyof Material, value: any) => {
    const updated = materials.map((m) => {
      if (m.id === id) {
        return { ...m, [field]: value };
      }
      return m;
    });
    onUpdateMaterials(updated);
  };

  const handleSaveProcess = (id: string, field: keyof FabProcess, value: any) => {
    const updated = processes.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onUpdateProcesses(updated);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.id || !newMat.name) {
      setErrorMessage("Material Key ID and Display Name are required.");
      return;
    }
    if (materials.some((m) => m.id === newMat.id)) {
      setErrorMessage("A material with this ID already exists.");
      return;
    }
    onUpdateMaterials([...materials, newMat as Material]);
    setNewMat({
      id: "",
      name: "",
      category: "Metal",
      density: 2.7,
      costPerKg: 5.0,
      desc: "",
    });
    setErrorMessage("");
  };

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProc.id || !newProc.name) {
      setErrorMessage("Process Key ID and Display Name are required.");
      return;
    }
    if (processes.some((p) => p.id === newProc.id)) {
      setErrorMessage("A process with this ID already exists.");
      return;
    }
    onUpdateProcesses([...processes, newProc as FabProcess]);
    setNewProc({
      id: "",
      name: "",
      category: "Machining",
      setupCost: 50,
      ratePerHour: 60,
      ratePerUnit: undefined,
      unitName: "",
    });
    setErrorMessage("");
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#2b2b2b] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2 font-sans uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#007acc]" />
            Material & Operations Database
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Configure raw densities and operational costs used for calculating manufacturing estimates.
          </p>
        </div>
        <button
          onClick={onResetCatalog}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded text-gray-300 transition-colors border border-transparent hover:border-[#3e3e42]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Factory Defaults
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#2d2d2d] border-b border-[#1e1e1e] text-xs">
        <button
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition-colors ${
            activeTab === "materials"
              ? "bg-[#1e1e1e] border-[#007acc] text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Raw Materials Catalog ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab("processes")}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition-colors ${
            activeTab === "processes"
              ? "bg-[#1e1e1e] border-[#007acc] text-white"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Hammer className="w-3.5 h-3.5" />
          Fabrication & Finishing Services ({processes.length})
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 max-w-5xl">
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-900 rounded text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {activeTab === "materials" ? (
          <div className="space-y-6">
            {/* Materials Grid */}
            <div className="overflow-x-auto border border-[#2d2d2d] rounded bg-[#252526]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#2d2d2d] border-b border-[#1e1e1e] text-gray-300">
                    <th className="p-2.5 font-medium">Record Key (id)</th>
                    <th className="p-2.5 font-medium">Display Name</th>
                    <th className="p-2.5 font-medium">Category</th>
                    <th className="p-2.5 font-medium">Density (g/cm³)</th>
                    <th className="p-2.5 font-medium">Wholesale Rate ($/kg)</th>
                    <th className="p-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d2d]">
                  {materials.map((m) => (
                    <tr key={m.id} className="hover:bg-[#2d2d30] transition-colors">
                      <td className="p-2.5 font-mono text-gray-400 select-all">{m.id}</td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => handleSaveMaterial(m.id, "name", e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-full rounded text-white"
                        />
                      </td>
                      <td className="p-2.5 text-gray-300">
                        <select
                          value={m.category}
                          onChange={(e) => handleSaveMaterial(m.id, "category", e.target.value)}
                          className="bg-[#252526] border border-[#3e3e42] rounded px-1.5 py-0.5 text-xs text-white"
                        >
                          <option value="Metal">Metal</option>
                          <option value="Plastic">Plastic</option>
                          <option value="Wood">Wood</option>
                          <option value="Composite">Composite</option>
                          <option value="Hardware">Hardware</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={m.density}
                          onChange={(e) => handleSaveMaterial(m.id, "density", parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-20 font-mono text-right text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.05"
                          value={m.costPerKg}
                          onChange={(e) => handleSaveMaterial(m.id, "costPerKg", parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-20 font-mono text-right text-green-400 font-semibold"
                        />
                      </td>
                      <td className="p-2.5 text-gray-400 max-w-xs truncate">
                        <input
                          type="text"
                          value={m.desc || ""}
                          onChange={(e) => handleSaveMaterial(m.id, "desc", e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-full text-gray-400"
                          placeholder="No description..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Material Form */}
            <form onSubmit={handleAddMaterial} className="p-4 bg-[#252526] rounded border border-[#2d2d2d] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#007acc]" />
                Register New Material Code
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Key ID (e.g. titanium_gr5)</label>
                  <input
                    type="text"
                    value={newMat.id}
                    onChange={(e) => setNewMat({ ...newMat, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                    placeholder="unique_snake_case_id"
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newMat.name}
                    onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                    placeholder="Titanium Grade 5"
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Category</label>
                  <select
                    value={newMat.category}
                    onChange={(e) => setNewMat({ ...newMat, category: e.target.value as any })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white"
                  >
                    <option value="Metal">Metal</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Wood">Wood</option>
                    <option value="Composite">Composite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Density (g/cm³)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMat.density}
                    onChange={(e) => setNewMat({ ...newMat, density: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Raw Cost per kg ($ USD)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={newMat.costPerKg}
                    onChange={(e) => setNewMat({ ...newMat, costPerKg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Material Description</label>
                  <input
                    type="text"
                    value={newMat.desc}
                    onChange={(e) => setNewMat({ ...newMat, desc: e.target.value })}
                    placeholder="e.g. High weight/strength ratio..."
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white rounded text-xs transition-colors font-medium flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Append Material
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Processes Grid */}
            <div className="overflow-x-auto border border-[#2d2d2d] rounded bg-[#252526]">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-[#2d2d2d] border-b border-[#1e1e1e] text-gray-300">
                    <th className="p-2.5 font-medium">Process Key</th>
                    <th className="p-2.5 font-medium">Display Name</th>
                    <th className="p-2.5 font-medium">Category</th>
                    <th className="p-2.5 font-medium">Setup Charge ($)</th>
                    <th className="p-2.5 font-medium">Operating Rate ($/hr)</th>
                    <th className="p-2.5 font-medium">Extra Charge per Unit</th>
                    <th className="p-2.5 font-medium">Billing Unit Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d2d]">
                  {processes.map((p) => (
                    <tr key={p.id} className="hover:bg-[#2d2d30] transition-colors">
                      <td className="p-2.5 font-mono text-gray-400">{p.id}</td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handleSaveProcess(p.id, "name", e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-full rounded text-white"
                        />
                      </td>
                      <td className="p-2.5 text-gray-300">
                        <select
                          value={p.category}
                          onChange={(e) => handleSaveProcess(p.id, "category", e.target.value)}
                          className="bg-[#252526] border border-[#3e3e42] rounded px-1.5 py-0.5 text-xs text-white"
                        >
                          <option value="Machining">Machining</option>
                          <option value="Additives">Additives</option>
                          <option value="Cutting">Cutting</option>
                          <option value="Finishing">Finishing</option>
                          <option value="Manual">Manual</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="5"
                          value={p.setupCost}
                          onChange={(e) => handleSaveProcess(p.id, "setupCost", parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-16 font-mono text-right text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="5"
                          value={p.ratePerHour}
                          onChange={(e) => handleSaveProcess(p.id, "ratePerHour", parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-16 font-mono text-right text-white"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={p.ratePerUnit || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleSaveProcess(p.id, "ratePerUnit", isNaN(val) ? undefined : val);
                          }}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-20 font-mono text-right text-white"
                          placeholder="e.g. 0.05"
                        />
                      </td>
                      <td className="p-2.5 text-gray-400">
                        <input
                          type="text"
                          value={p.unitName || ""}
                          onChange={(e) => handleSaveProcess(p.id, "unitName", e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#3e3e42] focus:bg-[#1e1e1e] px-1 py-0.5 w-24 text-gray-300"
                          placeholder="none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Process Form */}
            <form onSubmit={handleAddProcess} className="p-4 bg-[#252526] rounded border border-[#2d2d2d] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#007acc]" />
                Register New Fabrication Service
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Key ID (e.g. milling_5_axis)</label>
                  <input
                    type="text"
                    value={newProc.id}
                    onChange={(e) => setNewProc({ ...newProc, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                    placeholder="unique_snake_case_id"
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newProc.name}
                    onChange={(e) => setNewProc({ ...newProc, name: e.target.value })}
                    placeholder="CNC 5-Axis Precision Machining"
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Category</label>
                  <select
                    value={newProc.category}
                    onChange={(e) => setNewProc({ ...newProc, category: e.target.value as any })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white"
                  >
                    <option value="Machining">Machining</option>
                    <option value="Additives">Additives</option>
                    <option value="Cutting">Cutting</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Setup Fixed Charge ($ USD)</label>
                  <input
                    type="number"
                    step="5"
                    value={newProc.setupCost}
                    onChange={(e) => setNewProc({ ...newProc, setupCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Hourly Operating Rate ($ USD/hr)</label>
                  <input
                    type="number"
                    step="5"
                    value={newProc.ratePerHour}
                    onChange={(e) => setNewProc({ ...newProc, ratePerHour: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1">Unit Charge (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProc.ratePerUnit || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewProc({ ...newProc, ratePerUnit: isNaN(val) ? undefined : val });
                      }}
                      placeholder="e.g. 0.05"
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Unit Name</label>
                    <input
                      type="text"
                      value={newProc.unitName || ""}
                      onChange={(e) => setNewProc({ ...newProc, unitName: e.target.value })}
                      placeholder="e.g. screw, mm"
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white rounded text-xs transition-colors font-medium flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Append Process Record
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
