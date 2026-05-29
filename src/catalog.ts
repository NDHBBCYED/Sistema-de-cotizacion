/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, FabProcess, PartItem, HardwareItem, MaterialQuote } from "./types";

export const DEFAULT_MATERIALS: Material[] = [
  { id: "al_6061_t6", name: "Aluminum 6061-T6", category: "Metal", density: 2.70, costPerKg: 5.50, desc: "Standard aerospace metal, excellent strength/weight and machinability" },
  { id: "ss_304", name: "Stainless Steel 304", category: "Metal", density: 8.00, costPerKg: 7.80, desc: "Industrial-grade corrosion resistance, heavy, tough, standard steel alloy" },
  { id: "brass_c360", name: "Brass C360", category: "Metal", density: 8.50, costPerKg: 12.50, desc: "Free-cutting brass, gold appearance, self-lubricating, perfect for details" },
  { id: "steel_a36", name: "Mild Steel A36", category: "Metal", density: 7.85, costPerKg: 2.20, desc: "Common construction structural steel, affordable, extremely tough" },
  { id: "ti_gr5", name: "Titanium Grade 5 (6Al-4V)", category: "Metal", density: 4.43, costPerKg: 42.00, desc: "Premium ultralight tough biocompatible metal. Expensive to machine" },
  { id: "delrin_pom", name: "Delrin POM-C (Polyacetal)", category: "Plastic", density: 1.41, costPerKg: 14.00, desc: "High stiffness, low friction engineering thermoplastic, supreme dimensional stability" },
  { id: "polycarb", name: "Polycarbonate (PC)", category: "Plastic", density: 1.20, costPerKg: 10.50, desc: "Impact-resistant optical-grade clear polymer, bullet-resistant sheets" },
  { id: "acrylic", name: "Acrylic PMMA (Plexiglass)", category: "Plastic", density: 1.19, costPerKg: 5.80, desc: "Rigid display plastic, easily laser-cut, polished clear edges" },
  { id: "carbon_fiber", name: "Carbon Fiber Epoxy Plate", category: "Composite", density: 1.80, costPerKg: 48.00, desc: "Woven reinforcement, extremely high torsional strength, high performance aircraft/racing" },
  { id: "garolite_g10", name: "Garolite G10 / FR4", category: "Composite", density: 1.85, costPerKg: 18.00, desc: "Glass-epoxy high pressure laminate, high dielectric strength, circuit boards" },
  { id: "oak_red", name: "Red Oak Hardwood", category: "Wood", density: 0.72, costPerKg: 8.50, desc: "Heavy-duty domestic hardwood with beautiful open grain signature" },
  { id: "baltic_birch", name: "Baltic Birch Plywood", category: "Wood", density: 0.68, costPerKg: 5.50, desc: "Multi-ply core sheets, structural woodworking, lightweight and stable" }
];

export const DEFAULT_PROCESSES: FabProcess[] = [
  { id: "cnc_mill_3", name: "CNC 3-Axis Milling", category: "Machining", setupCost: 65.00, ratePerHour: 80.00 },
  { id: "cnc_lathe", name: "CNC Lathe Turning", category: "Machining", setupCost: 50.00, ratePerHour: 70.00 },
  { id: "laser_cutting", name: "Laser Jet Beam Cutting", category: "Cutting", setupCost: 15.00, ratePerHour: 45.00, ratePerUnit: 0.05, unitName: "cut line (mm)" },
  { id: "waterjet", name: "Industrial Waterjet CNC", category: "Cutting", setupCost: 35.00, ratePerHour: 90.00 },
  { id: "fdm_3d_print", name: "3D Printing (FDM PLA/PETG)", category: "Additives", setupCost: 8.00, ratePerHour: 4.50, ratePerUnit: 0.15, unitName: "mass (grams)" },
  { id: "anodize", name: "Sulfuric Acid Anodizing", category: "Finishing", setupCost: 85.00, ratePerHour: 0.00, ratePerUnit: 6.00, unitName: "parts" },
  { id: "powder_coat", name: "Thermal Powder Coating", category: "Finishing", setupCost: 75.00, ratePerHour: 0.00, ratePerUnit: 8.50, unitName: "parts" },
  { id: "manual_beadblast", name: "Abrasive Bead Blasting", category: "Finishing", setupCost: 10.00, ratePerHour: 40.00 },
  { id: "manual_deburr", name: "Deburring, Edge Polishing, Tapping", category: "Manual", setupCost: 0.00, ratePerHour: 35.00 }
];

// Calculation Functions
export function calculateVolumeCm3(form: PartItem["form"], dims: PartItem["dimensions"]): number {
  if (dims.baseVolumeCm3 && dims.baseVolumeCm3 > 0) return dims.baseVolumeCm3;

  switch (form) {
    case "Block": {
      const l = dims.length || 0;
      const w = dims.width || 0;
      const h = dims.height || 0;
      return (l * w * h) / 1000; // mm³ to cm³
    }
    case "Sheet": {
      const l = dims.length || 0;
      const w = dims.width || 0;
      const t = dims.thickness || 0;
      return (l * w * t) / 1000; // mm³ to cm³
    }
    case "Cylinder": {
      const d = dims.diameter || 0;
      const l = dims.length || 0;
      const r = d / 2;
      const volumeMm3 = Math.PI * r * r * l;
      return volumeMm3 / 1000; // mm³ to cm³
    }
    case "Custom":
    default:
      if (dims.weightGrams) return 0; // directly has weight
      return 0;
  }
}

export function calculateWeightGrams(form: PartItem["form"], dims: PartItem["dimensions"], density: number): number {
  if (dims.weightGrams && dims.weightGrams > 0) return dims.weightGrams;
  const vol = calculateVolumeCm3(form, dims);
  return vol * density; // cm³ * g/cm³ = grams
}

export interface CostBreakdown {
  materialCost: number;
  fabSetupCost: number;
  fabRunCost: number;
  totalBeforeMarkup: number;
  totalAfterMarkup: number;
}

export function calculatePartCost(
  part: PartItem,
  materials: Material[],
  processes: FabProcess[]
): CostBreakdown {
  const material = materials.find(m => m.id === part.materialId);
  const density = material ? material.density : 1.0;
  const costPerKg = material ? material.costPerKg : 5.0;

  // 1. Material Calculation
  const weightG = calculateWeightGrams(part.form, part.dimensions, density);
  const weightKg = weightG / 1000;
  const rawMaterialCost = weightKg * costPerKg;

  let fabSetupCost = 0;
  let fabRunCost = 0;

  // 2. Fabrication Processes Costs
  part.processes.forEach(procRef => {
    const proc = processes.find(p => p.id === procRef.processId);
    if (!proc) return;

    // Setup Fee (one-time per part setup, divided by quantity or flat?)
    // In typical manufacturing quotes, setup fee is incurred once per production run.
    // Let's count flat setup cost.
    const setupFee = procRef.params?.setupOverride !== undefined ? procRef.params.setupOverride : proc.setupCost;
    fabSetupCost += setupFee;

    // Run time cost
    let runCost = 0;
    const durationMins = procRef.params?.durationMinutes || 0;
    runCost += (proc.ratePerHour / 60) * durationMins;

    // Custom units fee
    if (proc.ratePerUnit && procRef.params?.customUnitsValue !== undefined) {
      runCost += proc.ratePerUnit * procRef.params.customUnitsValue;
    } else if (proc.id === "fdm_3d_print" && proc.ratePerUnit) {
      // 3D printing auto-calculates per gram if customUnitsValue is not explicitly provided
      const customValue = procRef.params?.customUnitsValue ?? weightG;
      runCost += proc.ratePerUnit * customValue;
    } else if (proc.category === "Cutting" && proc.ratePerUnit && !procRef.params?.customUnitsValue) {
      // Auto estimate cut line length as perimeter is helpful, but fallback to duration is safe
      // Let's say perimeter if cutting Sheet/Block
      if (part.form === "Sheet" || part.form === "Block") {
        const perimeterMm = ((part.dimensions.length || 0) + (part.dimensions.width || 0)) * 2;
        runCost += proc.ratePerUnit * perimeterMm;
      }
    }

    // Multiply run rates by quantity since running 10 parts takes 10x times
    fabRunCost += (runCost * part.quantity);
  });

  const materialCost = rawMaterialCost * part.quantity;
  const totalBeforeMarkup = materialCost + fabSetupCost + fabRunCost;

  return {
    materialCost,
    fabSetupCost,
    fabRunCost,
    totalBeforeMarkup,
    totalAfterMarkup: totalBeforeMarkup // handled globally by markup multipliers
  };
}

export interface QuoteCostSummary {
  subtotalMaterial: number;
  subtotalHardware: number;
  subtotalSetup: number;
  subtotalFabRun: number;
  subtotalLaborHours: number;
  assemblyLaborCost: number;
  totalRawCost: number;
  markedUpCost: number;
  taxAmount: number;
  grandTotal: number;
  totalWeightGrams: number;
}

export function calculateQuoteSummary(
  quote: MaterialQuote,
  materials: Material[],
  processes: FabProcess[]
): QuoteCostSummary {
  let subtotalMaterial = 0;
  let subtotalSetup = 0;
  let subtotalFabRun = 0;
  let totalWeightGrams = 0;

  // Process parts
  quote.parts.forEach(part => {
    const rawCosts = calculatePartCost(part, materials, processes);
    subtotalMaterial += rawCosts.materialCost;
    subtotalSetup += rawCosts.fabSetupCost;
    subtotalFabRun += rawCosts.fabRunCost;

    const materialRef = materials.find(m => m.id === part.materialId);
    const d = materialRef ? materialRef.density : 1.0;
    const wGrams = calculateWeightGrams(part.form, part.dimensions, d);
    totalWeightGrams += (wGrams * part.quantity);
  });

  // Hardware items
  let subtotalHardware = 0;
  quote.hardware.forEach(item => {
    subtotalHardware += (item.unitCost * item.quantity);
  });

  // Labor
  const laborRate = quote.laborRatePerHour || 45;
  const assemblyLaborCost = (quote.laborAssemblyHours || 0) * laborRate;

  const totalRawCost = subtotalMaterial + subtotalHardware + subtotalSetup + subtotalFabRun + assemblyLaborCost;
  const markedUpCost = totalRawCost * (quote.globalMarkup || 1.0);
  const taxAmount = markedUpCost * (quote.taxRate || 0.0);
  const grandTotal = markedUpCost + taxAmount + (quote.shippingCost || 0);

  return {
    subtotalMaterial,
    subtotalHardware,
    subtotalSetup,
    subtotalFabRun,
    subtotalLaborHours: quote.laborAssemblyHours,
    assemblyLaborCost,
    totalRawCost,
    markedUpCost,
    taxAmount,
    grandTotal,
    totalWeightGrams
  };
}

// Helper to construct some standard template quotes
export const TEMPLATE_QUOTES: {[key: string]: string} = {
  "quadcopter_frame.quote.json": JSON.stringify({
    "quoteName": "AeroQuad X-250 Carbon Prototype",
    "customerName": "Autonomous Robotics Corp",
    "creatorName": "Alex Rivera (Lead Mechanical)",
    "dateCreated": "2026-05-29",
    "status": "Draft",
    "globalMarkup": 1.30,
    "taxRate": 0.08,
    "shippingCost": 25.00,
    "laborRatePerHour": 50.00,
    "laborAssemblyHours": 3,
    "parts": [
      {
        "partId": "main_bottom_plate",
        "name": "Chassis Bottom Frame Plate 3mm",
        "materialId": "carbon_fiber",
        "form": "Sheet",
        "dimensions": { "length": 220, "width": 220, "thickness": 3.0 },
        "quantity": 1,
        "processes": [
          { "processId": "laser_cutting", "params": { "durationMinutes": 6, "customUnitsValue": 1280 } },
          { "processId": "manual_deburr", "params": { "durationMinutes": 15 } }
        ]
      },
      {
        "partId": "top_canopy_plate",
        "name": "Electronic Protection Plate 1.5mm",
        "materialId": "carbon_fiber",
        "form": "Sheet",
        "dimensions": { "length": 180, "width": 90, "thickness": 1.5 },
        "quantity": 1,
        "processes": [
          { "processId": "laser_cutting", "params": { "durationMinutes": 4, "customUnitsValue": 740 } }
        ]
      },
      {
        "partId": "support_arms_heavy",
        "name": "Motor Support Arm Brackets",
        "materialId": "al_6061_t6",
        "form": "Block",
        "dimensions": { "length": 120, "width": 30, "height": 10 },
        "quantity": 4,
        "processes": [
          { "processId": "cnc_mill_3", "params": { "durationMinutes": 20 } },
          { "processId": "anodize", "params": { "customUnitsValue": 4 } }
        ]
      },
      {
        "partId": "camera_mount_tpu",
        "name": "FPV Camera Angle Mount",
        "materialId": "polycarb",
        "form": "Custom",
        "dimensions": { "weightGrams": 24.5 },
        "quantity": 2,
        "note": "We will FDM 3D print this in engineering TPU (Polycarbonate density as fallback)",
        "processes": [
          { "processId": "fdm_3d_print", "params": { "durationMinutes": 120, "customUnitsValue": 25 } }
        ]
      }
    ],
    "hardware": [
      { "id": "standoff_30mm", "name": "M3 Threaded Anodized Aluminum Standoffs 30mm", "unitCost": 0.55, "quantity": 12, "spec": "Hex socket spacers" },
      { "id": "m3_screw_10", "name": "M3 x 10mm Hex Socket Head Carbon Screws", "unitCost": 0.08, "quantity": 24, "spec": "Ultra high strength black carbon steel" },
      { "id": "m3_locknut", "name": "M3 Nylon Locking Flange Nuts", "unitCost": 0.05, "quantity": 16, "spec": "Anti-vibration nuts" }
    ]
  }, null, 2),

  "industrial_bracket.quote.json": JSON.stringify({
    "quoteName": "Heavy Duty Tension Linkage Support",
    "customerName": "Vertex Structural Engineering",
    "creatorName": "Samantha Vance (Estimator Corp)",
    "dateCreated": "2026-05-25",
    "status": "Approved",
    "globalMarkup": 1.20,
    "taxRate": 0.075,
    "shippingCost": 45.00,
    "laborRatePerHour": 45.00,
    "laborAssemblyHours": 1.5,
    "parts": [
      {
        "partId": "structural_clevis",
        "name": "CNC Milled Double Clevis Connection Block",
        "materialId": "ss_304",
        "form": "Block",
        "dimensions": { "length": 250, "width": 80, "height": 80 },
        "quantity": 2,
        "processes": [
          { "processId": "cnc_mill_3", "params": { "durationMinutes": 75 } },
          { "processId": "manual_beadblast", "params": { "durationMinutes": 10 } }
        ]
      },
      {
        "partId": "cylindrical_pin",
        "name": "Hardened Pivot Pin Shaft 25mm",
        "materialId": "ss_304",
        "form": "Cylinder",
        "dimensions": { "diameter": 25, "length": 140 },
        "quantity": 4,
        "processes": [
          { "processId": "cnc_lathe", "params": { "durationMinutes": 25 } }
        ]
      }
    ],
    "hardware": [
      { "id": "retaining_ring_25", "name": "25mm Heavy-Duty External Retaining Ring", "unitCost": 0.18, "quantity": 8, "spec": "Spring steel" },
      { "id": "grease_fitting_m6", "name": "M6 Angled Zerk Grease Fittings", "unitCost": 0.40, "quantity": 4, "spec": "Zinc plated brass" }
    ]
  }, null, 2),

  "wooden_cabinet.quote.json": JSON.stringify({
    "quoteName": "Custom Walnut Floating Storage Credenza",
    "customerName": "Harrison Luxury Living",
    "creatorName": "Julian Becker (Master Craftsman)",
    "dateCreated": "2026-05-28",
    "status": "Draft",
    "globalMarkup": 1.40,
    "taxRate": 0.0825,
    "shippingCost": 120.00,
    "laborRatePerHour": 60.00,
    "laborAssemblyHours": 8,
    "parts": [
      {
        "partId": "main_cabinet_carcass",
        "name": "Walnut Outer Credenza Wrapper Panels",
        "materialId": "oak_red",
        "form": "Sheet",
        "dimensions": { "length": 1800, "width": 450, "thickness": 19.0 },
        "quantity": 2,
        "notes": "Using Solid Walnut wood blocks instead of Oak (adjusted in base cost lookup)",
        "processes": [
          { "processId": "waterjet", "params": { "durationMinutes": 45 } },
          { "processId": "manual_deburr", "params": { "usageMins": 90, "durationMinutes": 120 } }
        ]
      },
      {
        "partId": "drawer_boxes_baltic",
        "name": "Dovetail Drawer Inner Sides Baltic",
        "materialId": "baltic_birch",
        "form": "Sheet",
        "dimensions": { "length": 400, "width": 120, "thickness": 12.0 },
        "quantity": 6,
        "processes": [
          { "processId": "cnc_mill_3", "params": { "durationMinutes": 10 } }
        ]
      }
    ],
    "hardware": [
      { "id": "blum_runner", "name": "Blumotion Concealed Soft-Close Slides 400mm", "unitCost": 32.50, "quantity": 3, "spec": "Full extension tandem pair" },
      { "id": "brass_pulls", "name": "Satin Brushed Solid Brass Drawer Pulls", "unitCost": 8.20, "quantity": 3, "spec": "96mm spacing" },
      { "id": "pocket_screws", "name": "Woodworking structural pocket hole joinery screws pack", "unitCost": 0.04, "quantity": 60, "spec": "Coarse thread square head" }
    ]
  }, null, 2)
};
