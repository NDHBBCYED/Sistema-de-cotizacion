/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Material {
  id: string;
  name: string;
  category: "Metal" | "Plastic" | "Wood" | "Composite" | "Hardware";
  density: number; // in g/cm³ (kg/dm³)
  costPerKg: number; // in USD
  desc?: string;
}

export interface FabProcess {
  id: string;
  name: string;
  category: "Machining" | "Additives" | "Cutting" | "Finishing" | "Manual";
  setupCost: number; // in USD
  ratePerHour: number; // in USD
  ratePerUnit?: number; // e.g., per gram for 3D printing, or per mm of cut line
  unitName?: string;
}

export interface PartDimensions {
  length?: number; // in mm
  width?: number; // in mm
  height?: number; // in mm (for block / plate)
  thickness?: number; // in mm (for sheet / plate)
  diameter?: number; // in mm (for rod / cylinder)
  baseVolumeCm3?: number; // direct volume override
  weightGrams?: number; // direct weight override
}

export interface PartItem {
  partId: string;
  name: string;
  materialId: string; // references Material
  form: "Block" | "Sheet" | "Cylinder" | "Custom";
  dimensions: PartDimensions;
  quantity: number;
  processes: {
    processId: string; // references FabProcess
    params?: {
      setupOverride?: number;
      durationMinutes?: number;
      customUnitsValue?: number; // e.g., grams or cut length
    };
  }[];
  notes?: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  unitCost: number;
  quantity: number;
  spec?: string;
}

export interface MaterialQuote {
  quoteName: string;
  customerName: string;
  creatorName: string;
  dateCreated: string;
  status: "Draft" | "Approved" | "Sent" | "Expired";
  globalMarkup: number; // e.g. 1.30 for 30% markup
  taxRate: number; // e.g. 0.08 for 8% tax
  shippingCost: number; // in USD
  laborRatePerHour: number; // global fallback assembly labor if needed
  laborAssemblyHours: number; // overall assembly/inspection labor
  parts: PartItem[];
  hardware: HardwareItem[];
}

export interface FileItem {
  name: string;
  path: string;
  content: string;
  isDraft?: boolean;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  suggestedAction?: {
    type: "apply_code";
    filePath: string;
    code: string;
    label: string;
  };
}
