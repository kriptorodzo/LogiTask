// ERP Integration Constants

export const ERP_SOURCE_TYPES = {
  ERP_IMPORT: 'ERP_IMPORT',
  EMAIL: 'EMAIL',
  MANUAL: 'MANUAL',
} as const;

export const ERP_DOCUMENT_TYPES = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  SALES_ORDER: 'SALES_ORDER',
  SHIPMENT_ORDER: 'SHIPMENT_ORDER',
} as const;

export const ERP_IMPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export const ROUTE_DAYS = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const;

// Role codes for ERP task assignment
export const ERP_TASK_ROLES = {
  RECEPTION_COORDINATOR: 'RECEPTION_COORDINATOR',
  DELIVERY_COORDINATOR: 'DELIVERY_COORDINATOR',
  DISTRIBUTION_COORDINATOR: 'DISTRIBUTION_COORDINATOR',
} as const;

// Task templates by event type
export interface ErpTaskTemplate {
  title: string;
  requestType: string;
  assigneeRole: string;
  status: string;
  dependsOnEvent?: string; // For SHIPMENT logic
}

export const ERP_TASK_TEMPLATES: Record<string, ErpTaskTemplate[]> = {
  // Purchase Order → Single task for receiving
  [ERP_DOCUMENT_TYPES.PURCHASE_ORDER]: [
    {
      title: 'Планирај простор за прием',
      requestType: 'ERP_RECEIVING',
      assigneeRole: ERP_TASK_ROLES.RECEIVING_COORDINATOR,
      status: 'ASSIGNED',
    },
  ],

  // Goods Receipt → Single task for receiving
  [ERP_DOCUMENT_TYPES.GOODS_RECEIPT]: [
    {
      title: 'Заврши прием',
      requestType: 'ERP_RECEIVING',
      assigneeRole: ERP_TASK_ROLES.RECEIVING_COORDINATOR,
      status: 'ASSIGNED',
    },
  ],

  // Sales Order → 2 tasks: prepare + plan distribution
  [ERP_DOCUMENT_TYPES.SALES_ORDER]: [
    {
      title: 'Подготви',
      requestType: 'ERP_DELIVERY',
      assigneeRole: ERP_TASK_ROLES.DELIVERY_COORDINATOR,
      status: 'ASSIGNED',
    },
    {
      title: 'Планирај дистрибуција',
      requestType: 'ERP_DISTRIBUTION',
      assigneeRole: ERP_TASK_ROLES.DISTRIBUTION_COORDINATOR,
      status: 'ASSIGNED',
    },
  ],

  // Shipment → Auto-complete prepare, create distribute task
  [ERP_DOCUMENT_TYPES.SHIPMENT_ORDER]: [
    {
      title: 'Дистрибуирај',
      requestType: 'ERP_DISTRIBUTION',
      assigneeRole: ERP_TASK_ROLES.DISTRIBUTION_COORDINATOR,
      status: 'ASSIGNED',
    },
  ],
} as const;

// Days of week mapping
const DAY_MAP: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
};

export function getNextRouteDate(
  routeDay: string,
  prepOffsetDays: number = 1
): Date {
  const today = new Date();
  const targetDayOfWeek = DAY_MAP[routeDay] ?? 1;
  
  let daysUntilRoute = targetDayOfWeek - today.getDay();
  if (daysUntilRoute <= 0) {
    daysUntilRoute += 7;
  }
  
  const routeDate = new Date(today);
  routeDate.setDate(today.getDate() + daysUntilRoute);
  
  const prepDate = new Date(routeDate);
  prepDate.setDate(routeDate.getDate() - prepOffsetDays);
  
  return prepDate;
}

export function getRouteDate(routeDay: string): Date {
  const today = new Date();
  const targetDayOfWeek = DAY_MAP[routeDay] ?? 1;
  
  let daysUntilRoute = targetDayOfWeek - today.getDay();
  if (daysUntilRoute <= 0) {
    daysUntilRoute += 7;
  }
  
  const routeDate = new Date(today);
  routeDate.setDate(today.getDate() + daysUntilRoute);
  return routeDate;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Description builders for task templates
export function buildTaskDescription(
  documentType: string,
  data: {
    partnerName?: string;
    partnerCode?: string;
    destinationName?: string;
    destinationCode?: string;
    lineCount?: number;
    totalQuantity?: number;
    documentNumber?: string;
    plannedDate?: Date;
    routeDay?: string;
  }
): string {
  let desc = '';

  if (data.documentNumber) {
    desc += `Документ: ${data.documentNumber}\n`;
  }
  if (data.partnerName) {
    desc += `Партнер: ${data.partnerName}\n`;
  }
  if (data.destinationName) {
    desc += `Доставно место: ${data.destinationName}\n`;
  }
  if (data.lineCount) {
    desc += `Артикли: ${data.lineCount}\n`;
  }
  if (data.totalQuantity) {
    desc += `Количина: ${data.totalQuantity}\n`;
  }
  if (data.routeDay) {
    desc += `Ден на рута: ${data.routeDay}\n`;
  }
  if (data.plannedDate) {
    desc += `Планиран датум: ${formatDate(data.plannedDate)}\n`;
  }

  return desc.trim();
}