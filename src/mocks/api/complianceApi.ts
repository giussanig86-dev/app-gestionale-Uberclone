import type { ComplianceDoc, ComplianceAlertSummary, ApiResponse } from '@/types'
import { mockComplianceDocs } from '../db/compliance'
import { mockDrivers } from '../db/drivers'
import { mockRequest } from './mockClient'
import { computeDocStatus } from '@/utils/documentExpiry'

let docs = [...mockComplianceDocs]

export const complianceApi = {
  getAll: (params: { companyId?: string; driverId?: string; vehicleId?: string } = {}): Promise<ApiResponse<ComplianceDoc[]>> => {
    let filtered = docs.map((d) => ({ ...d, status: computeDocStatus(d.expiryDate, d.alertDaysBefore) }))
    if (params.companyId) filtered = filtered.filter((d) => d.companyId === params.companyId)
    if (params.driverId) filtered = filtered.filter((d) => d.driverId === params.driverId)
    if (params.vehicleId) filtered = filtered.filter((d) => d.vehicleId === params.vehicleId)
    return mockRequest(filtered)
  },

  getAlertSummary: (companyId: string): Promise<ApiResponse<ComplianceAlertSummary[]>> => {
    const summaries: ComplianceAlertSummary[] = mockDrivers
      .filter((d) => d.companyId === companyId)
      .map((driver) => {
        const driverDocs = docs
          .filter((d) => d.driverId === driver.id)
          .map((d) => ({ ...d, status: computeDocStatus(d.expiryDate, d.alertDaysBefore) }))

        const expiredCount = driverDocs.filter((d) => d.status === 'scaduto').length
        const expiringSoonCount = driverDocs.filter((d) => d.status === 'in_scadenza').length
        const missingCount = driverDocs.filter((d) => d.status === 'mancante').length

        let overallStatus: ComplianceAlertSummary['overallStatus'] = 'compliant'
        if (expiredCount > 0 || missingCount > 0) overallStatus = 'non_compliant'
        else if (expiringSoonCount > 0) overallStatus = 'warning'

        return {
          driverId: driver.id,
          driverName: `${driver.firstName} ${driver.lastName}`,
          expiredCount,
          expiringSoonCount,
          missingCount,
          overallStatus,
        }
      })
    return mockRequest(summaries)
  },

  upload: (payload: Omit<ComplianceDoc, 'id' | 'lastVerifiedAt' | 'status'>): Promise<ApiResponse<ComplianceDoc>> => {
    const newDoc: ComplianceDoc = {
      ...payload,
      id: `doc-${Date.now()}`,
      lastVerifiedAt: new Date().toISOString(),
      status: computeDocStatus(payload.expiryDate, payload.alertDaysBefore),
    }
    docs = [newDoc, ...docs]
    return mockRequest(newDoc, { latencyMs: 500 })
  },
}
