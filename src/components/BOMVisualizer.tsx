/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Material, FabProcess, MaterialQuote } from "../types";
import { 
  calculateQuoteSummary, 
  calculatePartCost, 
  calculateWeightGrams,
  calculateVolumeCm3,
  CostBreakdown 
} from "../catalog";
import { 
  TrendingUp, 
  Layers, 
  Scale, 
  Clock, 
  Truck, 
  Receipt, 
  Download, 
  Copy, 
  CheckCircle, 
  Activity, 
  DollarSign,
  Briefcase,
  AlertCircle
} from "lucide-react";

interface BOMVisualizerProps {
  quoteContent: string;
  materials: Material[];
  processes: FabProcess[];
}

export default function BOMVisualizer({
  quoteContent,
  materials,
  processes,
}: BOMVisualizerProps) {
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Parse safety
  const quote = useMemo<MaterialQuote | null>(() => {
    try {
      return JSON.parse(quoteContent);
    } catch {
      return null;
    }
  }, [quoteContent]);

  // Calculate high-fidelity pricing outcomes
  const summary = useMemo(() => {
    if (!quote) return null;
    return calculateQuoteSummary(quote, materials, processes);
  }, [quote, materials, processes]);

  const partCostsList = useMemo(() => {
    if (!quote) return [];
    return quote.parts.map((part) => {
      const materialRef = materials.find((m) => m.id === part.materialId);
      const density = materialRef ? materialRef.density : 1.0;
      const weightG = calculateWeightGrams(part.form, part.dimensions, density);
      const breakdown = calculatePartCost(part, materials, processes);
      return {
        part,
        material: materialRef,
        weightG,
        ...breakdown,
      };
    });
  }, [quote, materials, processes]);

  if (!quote || !summary) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-8 bg-[#1e1e1e] text-gray-400">
        <AlertCircle className="w-12 h-12 text-[#007acc] mb-3 animate-pulse" />
        <h3 className="font-semibold text-gray-200">Awaiting Valid Pricing Code</h3>
        <p className="text-gray-500 text-xs text-center max-w-xs mt-1">
          Resolve the syntax syntax or bracket warnings in the editor block to compile live manufacturing estimative metrics.
        </p>
      </div>
    );
  }

  // Generate CSV table data for export
  const buildCSV = () => {
    const headers = [
      "Part ID",
      "Part Name",
      "Material Name",
      "Form Aspect",
      "Unit Mass (g)",
      "Qty",
      "Raw Material Cost ($)",
      "Fixed Setup Fee ($)",
      "Machining Run Cost ($)",
      "Total Pre-markup ($)",
    ];
    const rows = partCostsList.map((item) => [
      item.part.partId,
      item.part.name,
      item.material?.name || "Unknown",
      item.part.form,
      item.weightG.toFixed(1),
      item.part.quantity,
      item.materialCost.toFixed(2),
      item.fabSetupCost.toFixed(2),
      item.fabRunCost.toFixed(2),
      item.totalBeforeMarkup.toFixed(2),
    ]);

    // Add hardware accessories rows
    quote.hardware.forEach((hw) => {
      rows.push([
        hw.id,
        hw.name,
        "Purchased Hardware",
        "Hardware Accessory",
        "0.0",
        hw.quantity.toString(),
        (hw.unitCost * hw.quantity).toFixed(2),
        "0.00",
        "0.00",
        (hw.unitCost * hw.quantity).toFixed(2),
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    return encodeURI(csvContent);
  };

  const copyToClipboard = () => {
    try {
      const headers = "Part ID\tPart Name\tMaterial\tQty\tWeight(g)\tPre-Markup Cost\n";
      const rows = partCostsList
        .map(
          (i) =>
            `${i.part.partId}\t${i.part.name}\t${i.material?.name || "N/A"}\t${i.part.quantity}\t${i.weightG.toFixed(
              1
            )}\t$${i.totalBeforeMarkup.toFixed(2)}`
        )
        .join("\n");

      navigator.clipboard.writeText(headers + rows);
      setCopiedStatus("Copied CSV Table!");
      setTimeout(() => setCopiedStatus(null), 2500);
    } catch {
      setCopiedStatus("Failed to copy");
    }
  };

  const downloadJSONData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ quote, summary }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${quote.quoteName.toLowerCase().replace(/\s+/g, "_")}_erp_bom.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Process data for elegant visual bar comparisons
  const costBreakdownData = [
    { label: "Raw Materials", value: summary.subtotalMaterial, color: "bg-[#007acc]", barColor: "#007acc" },
    { label: "Hardware Spares", value: summary.subtotalHardware, color: "bg-teal-500", barColor: "#14b8a6" },
    { label: "CNC & Fab Setups", value: summary.subtotalSetup, color: "bg-purple-500", barColor: "#a855f7" },
    { label: "Operating Ops Run", value: summary.subtotalFabRun, color: "bg-amber-500", barColor: "#f59e0b" },
    { label: "Assembly Labor", value: summary.assemblyLaborCost, color: "bg-indigo-500", barColor: "#6366f1" },
  ];

  const maxCostValue = Math.max(...costBreakdownData.map((d) => d.value), 1);

  return (
    <div className="h-full flex flex-col bg-[#252526] text-gray-200">
      {/* Visualizer Toolbar */}
      <div className="flex bg-[#2d2d2d] items-center justify-between px-4 py-2 border-b border-[#1e1e1e] text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="font-semibold text-gray-100 font-sans tracking-wide">
            Quote BOM Compilation Engine (v1.0)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="px-2.5 py-1 bg-[#1e1e1e] hover:bg-[#343435] border border-[#3e3e42] transition-colors rounded text-gray-300 flex items-center gap-1 cursor-pointer"
            title="Copy Estimative Table values for ERP/Excel clipboard importing"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400" />
            {copiedStatus || "Copy CSV"}
          </button>
          <a
            href={buildCSV()}
            download={`${quote.quoteName.toLowerCase().replace(/\s+/g, "_")}_quote_bom.csv`}
            className="px-2.5 py-1 bg-[#1e1e1e] hover:bg-[#343435] border border-[#3e3e42] transition-colors rounded text-[#007acc] flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <button
            onClick={downloadJSONData}
            className="px-2.5 py-1 bg-[#007acc] hover:bg-[#0062a3] shadow transition-colors rounded text-white flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Export ERP JSON
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Quote Metadata Summary Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d]">
            <div className="text-gray-500 font-sans font-medium uppercase tracking-wider text-[10px]">Client Organization</div>
            <div className="text-gray-200 font-semibold truncate mt-1 text-[11px]">{quote.customerName || "Non-assigned Partner"}</div>
          </div>
          <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d]">
            <div className="text-gray-500 font-sans font-medium uppercase tracking-wider text-[10px]">Quotation Date</div>
            <div className="text-gray-200 mt-1 font-mono text-[11px]">{quote.dateCreated || "N/A"}</div>
          </div>
          <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d]">
            <div className="text-gray-500 font-sans font-medium uppercase tracking-wider text-[10px]">Authorized Signature</div>
            <div className="text-gray-200 mt-1 truncate text-[11px]">{quote.creatorName || "N/A"}</div>
          </div>
          <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d]">
            <div className="text-gray-500 font-sans font-medium uppercase tracking-wider text-[10px]">Quotation Registry Status</div>
            <div className="mt-1 flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  quote.status === "Approved" ? "bg-green-500" : quote.status === "Draft" ? "bg-amber-500" : "bg-red-400"
                }`}
              />
              <span className="font-semibold text-gray-200 text-[11px]">{quote.status || "Draft"}</span>
            </div>
          </div>
        </div>

        {/* Financial Hero Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-4 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Total Customer Price</span>
                <div className="text-4xl font-extrabold text-green-450 tracking-tight font-mono drop-shadow">
                  ${summary.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-2 bg-green-950/40 border border-green-900 rounded-lg text-green-300 text-[10px] items-center text-right font-semibold">
                Indexed {((quote.globalMarkup - 1) * 100).toFixed(0)}% Profit Margin
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#2d2d2d] text-[11px] mt-4 font-mono">
              <div>
                <span className="text-gray-500 block">Wholesale Cost:</span>
                <span className="text-gray-300 font-semibold">${summary.totalRawCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Marked Up:</span>
                <span className="text-gray-300 font-semibold">${summary.markedUpCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Surcharge Tax ({((quote.taxRate || 0) * 100).toFixed(1)}%):</span>
                <span className="text-gray-300 font-semibold">${summary.taxAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Freight Delivery:</span>
                <span className="text-gray-300 font-semibold">${(quote.shippingCost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-3.5 relative">
            <span className="text-gray-400 font-sans uppercase tracking-wider font-semibold text-[11px]">Material Density Audit</span>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#252526] rounded-lg border border-[#2d2d2d] text-[#007acc]">
                <Scale className="w-5 h-5 text-[#007acc]" />
              </div>
              <div>
                <span className="text-gray-500 block">Part Assembly Net Mass</span>
                <span className="text-lg font-bold text-blue-200 font-mono">
                  {summary.totalWeightGrams >= 1000
                    ? `${(summary.totalWeightGrams / 1000).toFixed(3)} kg`
                    : `${summary.totalWeightGrams.toFixed(1)} g`}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#2d2d2d] space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Fastener hardware line items:</span>
                <span className="font-mono text-gray-300 font-semibold">{quote.hardware?.length || 0} accessories</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated manual assembly labor:</span>
                <span className="font-mono text-gray-300 font-semibold">{quote.laborAssemblyHours || 0} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytical cost division graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#1e1e1e] rounded border border-[#2d2d2d]">
            <h3 className="font-semibold text-gray-200 flex items-center gap-1 pb-3.5 border-b border-[#2d2d2d]">
              <Clock className="w-4 h-4 text-purple-400" />
              Overhead Operational Distribution (Pre-Markup)
            </h3>
            <div className="space-y-3.5 pt-4">
              {costBreakdownData.map((d, index) => {
                const pct = ((d.value / (summary.totalRawCost || 1)) * 100).toFixed(1);
                const barWidth = `${Math.max(3, (d.value / maxCostValue) * 100)}%`;
                return (
                  <div key={index} className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-mono text-[10.5px]">
                      <span className="text-gray-350 font-sans flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${d.color}`} />
                        {d.label}
                      </span>
                      <span className="text-gray-400">
                        ${d.value.toFixed(2)} <span className="text-gray-600 font-semibold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-[#252526] rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} transition-all duration-300 rounded-full`} style={{ width: barWidth }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-4">
            <h3 className="font-semibold text-gray-200 flex items-center gap-1 pb-3 mb-1 border-b border-[#2d2d2d]">
              <Scale className="w-4 h-4 text-theme-dark-accent" />
              Weight Proportion Contribution
            </h3>
            {partCostsList.length === 0 ? (
              <div className="h-32 flex justify-center items-center text-gray-600 text-[10px]">
                No active weight data to chart. Map standard raw profiles.
              </div>
            ) : (
              <div className="space-y-3 text-[11px]">
                {partCostsList.map((item, idx) => {
                  const massPct = summary.totalWeightGrams > 0 ? ((item.weightG * item.part.quantity / summary.totalWeightGrams) * 100).toFixed(1) : "0";
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-mono text-[10.5px]">
                        <span className="text-gray-350 truncate max-w-[220px]" title={item.part.name}>
                          {item.part.name || item.part.partId} ({item.part.quantity}x)
                        </span>
                        <span className="text-gray-500">
                          {(item.weightG * item.part.quantity).toFixed(1)}g <span className="text-gray-600 font-semibold">({massPct}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#252526] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#007acc] transition-all duration-300 rounded-full" 
                          style={{ width: `${massPct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ERP Itemized Table Grid */}
        <div className="overflow-hidden border border-[#2d2d2d] rounded bg-[#1e1e1e]">
          <div className="p-3 bg-[#2d2d2d] border-b border-[#1e1e1e] font-semibold text-gray-200 font-sans tracking-wide">
            Itemized Engineering Breakdown List
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#212122] border-b border-[#2d2d2d] text-gray-400 text-[10px] uppercase font-mono">
                <th className="p-2.5">Component / Specification</th>
                <th className="p-2.5 text-center">Form Aspect</th>
                <th className="p-2.5 text-right">Mass (Net)</th>
                <th className="p-2.5 text-right">Stock Cost ($)</th>
                <th className="p-2.5 text-right">Opr. Setup ($)</th>
                <th className="p-2.5 text-right">Machining Run ($)</th>
                <th className="p-2.5 text-right">Raw Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d] font-mono text-gray-300">
              {partCostsList.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#252526] transition-colors leading-relaxed">
                  <td className="p-2.5">
                    <div className="font-semibold text-gray-200 font-sans text-xs">{item.part.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Code ID: <span className="text-gray-400 font-mono">{item.part.partId}</span> • {item.part.quantity} Unit(s) • {item.material?.name || "Unknown Mat"}
                    </div>
                  </td>
                  <td className="p-2.5 text-center text-gray-400 font-sans text-[11px]">{item.part.form}</td>
                  <td className="p-2.5 text-right">
                    {item.weightG >= 1000 ? `${(item.weightG / 1000).toFixed(2)}kg` : `${item.weightG.toFixed(1)}g`}
                    <div className="text-[9px] text-gray-650 opacity-60">ea: {item.weightG.toFixed(0)}g</div>
                  </td>
                  <td className="p-2.5 text-right text-gray-350">${item.materialCost.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-purple-400">${item.fabSetupCost.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-amber-500">${item.fabRunCost.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-bold text-green-400">
                    ${item.totalBeforeMarkup.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Hardware items */}
              {quote.hardware?.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#252526] transition-colors bg-teal-950/5">
                  <td className="p-2.5">
                    <div className="font-semibold text-gray-200 font-sans text-xs">{item.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Hardware Coupling • Code: <span className="text-gray-400">{item.id}</span> • {item.quantity} Unit(s)
                    </div>
                  </td>
                  <td className="p-2.5 text-center text-teal-400 font-sans text-[10px]">Accessory</td>
                  <td className="p-2.5 text-right text-gray-500">N/A</td>
                  <td className="p-2.5 text-right text-teal-300">${(item.unitCost * item.quantity).toFixed(2)}</td>
                  <td className="p-2.5 text-right text-gray-650">-</td>
                  <td className="p-2.5 text-right text-gray-650">-</td>
                  <td className="p-2.5 text-right font-bold text-teal-400">
                    ${(item.unitCost * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
