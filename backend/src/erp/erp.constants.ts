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
  RECEIVING_COORDINATOR: 'RECEIVING_COORDINATOR', // For PURCHASE_ORDER, GOODS_RECEIPT
  SHIPPING_COORDINATOR: 'SHIPPING_COORDINATOR',    // For SALES_ORDER, SHIPMENT_ORDER
  DISTRIBUTION_COORDINATOR: 'DISTRIBUTION_COORDINATOR', // For distribution tasks
} as const;

// Task titles by document type
export const ERP_TASK_TEMPLATES = {
  [ERP_DOCUMENT_TYPES.PURCHASE_ORDER]: {
    title: 'Планирај простор за прием',
    requestType: 'ERP_RECEIVING',
    assigneeRole: ERP_TASK_ROLES.RECEIVING_COORDINATOR,
    status: 'ASSIGNED',
  },
  [ERP_DOCUMENT_TYPES.GOODS_RECEIPT]: {
    title: 'Заврши прием',
    requestType: 'ERP_RECEIVING',
    assigneeRole: ERP_TASK_ROLES.RECEIVING_COORDINATOR,
    status: 'ASSIGNED',
  },
  [ERP_DOCUMENT_TYPES.SALES_ORDER]: {
    title: 'Подготви за испорака',
    requestType: 'ERP_SHIPPING',
    assigneeRole: ERP_TASK_ROLES.SHIPPING_COORDINATOR,
    status: 'ASSIGNED',
  },
  [ERP_DOCUMENT_TYPES.SHIPMENT_ORDER]: {
    title: 'Подготви за испорака',
    requestType: 'ERP_SHIPPING',
    assigneeRole: ERP_TASK_ROLES.SHIPPING_COORDINATOR,
    status: 'ASSIGNED',
  },
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
  
  // Find days until target day
  const currentDayOfWeek = today.getDay();
  let daysUntilRoute = targetDayOfWeek - currentDayOfWeek;
  
  // If today is the route day or already passed, get next week's
  if (daysUntilRoute <= 0) {
    daysUntilRoute += 7;
  }
  
  const routeDate = new Date(today);
  routeDate.setDate(today.getDate() + daysUntilRoute);
  
  // Subtract prep offset days
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