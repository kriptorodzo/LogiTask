import { Injectable } from '@nestjs/common';
import { REQUEST_TYPES, RequestType } from '../common/constants';

interface ExtractedEntities {
  supplier?: string;
  location?: string;
  deliveryDate?: Date;
  urgency?: string;
}

@Injectable()
export class EmailParserService {
  // Regex patterns for entity extraction
  private supplierPatterns = [
    /(?:from|supplier|vendor|supplied by)[:\s]+([A-Z][A-Za-z\s]+(?:Ltd|LLC|Inc|Corp)?)/i,
    /^([A-Z][A-Za-z\s]+(?:Ltd|LLC|Inc|Corp))/m,
  ];

  private locationPatterns = [
    /(?:location|address|to|deliver to|destination)[:\s]+([A-Za-z\s]+(?:warehouse|facility|dc|distribution center|plant)?)/i,
    /(?:in|at)[:\s]+([A-Z][A-Za-z\s]+(?:Warehouse|Facility|DC))/i,
  ];

  private datePatterns = [
    /(?:deliver|delivery|receive|receipt)[:\s]*(?:on|by|date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(?:next|this|coming)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ];

  private urgencyKeywords = {
    urgent: ['urgent', 'asap', 'immediately', 'rush', 'priority', 'critical'],
    high: ['soon', 'expedite', 'fast', 'quick'],
    normal: ['normal', 'standard', 'regular'],
  };

  extractPlainText(html: string, contentType: string): string {
    if (contentType === 'text') {
      return html;
    }

    // Simple HTML to text conversion
    // In production, use a proper HTML parser
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractEntities(text: string): ExtractedEntities {
    const result: ExtractedEntities = {};

    // Extract supplier
    for (const pattern of this.supplierPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.supplier = match[1].trim();
        break;
      }
    }

    // Extract location
    for (const pattern of this.locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.location = match[1].trim();
        break;
      }
    }

    // Extract delivery date
    for (const pattern of this.datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const parsedDate = this.parseDate(match[1] || match[0]);
        if (parsedDate) {
          result.deliveryDate = parsedDate;
          break;
        }
      }
    }

    // Extract urgency
    const lowerText = text.toLowerCase();
    for (const [level, keywords] of Object.entries(this.urgencyKeywords)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        result.urgency = level.toUpperCase();
        break;
      }
    }

    return result;
  }

  private parseDate(dateStr: string): Date | undefined {
    try {
      // Try various date formats
      const formats = [
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          const [, day, month, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          const date = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      // Try native Date parsing as fallback
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return undefined;
  }

  classifyRequest(subject: string, body: string): RequestType {
    const combined = `${subject} ${body}`.toLowerCase();

    // Inbound receipt keywords
    if (this.matchesAny(combined, [
      'receipt', 'receiving', 'inbound', 'arrival', 'receive shipment',
      'goods received', 'purchase order', 'supplier delivery'
    ])) {
      return 'INBOUND_RECEIPT';
    }

    // Outbound preparation keywords
    if (this.matchesAny(combined, [
      'preparation', 'prep', 'picking', 'packing', 'packing list',
      'outbound', 'ship order', 'prepare shipment'
    ])) {
      return 'OUTBOUND_PREPARATION';
    }

    // Outbound delivery keywords
    if (this.matchesAny(combined, [
      'delivery', 'deliver', 'dispatch', 'send', 'ship to',
      'customer delivery', 'out for delivery', 'en route'
    ])) {
      return 'OUTBOUND_DELIVERY';
    }

    // Transfer/distribution keywords
    if (this.matchesAny(combined, [
      'transfer', 'distribution', 'transfer to', 'move to',
      'cross-dock', 'reallocate', 'redistribute'
    ])) {
      return 'TRANSFER_DISTRIBUTION';
    }

    return 'UNCLASSIFIED';
  }

  private matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some(kw => text.includes(kw));
  }
}