export type InvoiceStatus = 'bozza' | 'emessa' | 'pagata' | 'scaduta' | 'annullata'

export interface InvoiceLineItem {
  rideId: string
  description: string
  date: string
  quantity: number
  unitPrice: number
  vatRate: number
  total: number
  costCenterId: string
  passengerName: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  companyId: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  periodFrom: string
  periodTo: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  vatAmount: number
  total: number
  currency: 'EUR'
  paymentMethod: 'bonifico' | 'carta' | 'addebito'
  iban?: string
  notes: string
  pdfUrl?: string
}
