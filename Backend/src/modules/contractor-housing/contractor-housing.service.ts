import { withConnection } from '../../core/database';
import { ContractorHousingRepository } from './contractor-housing.repository';
import type { CreateContractorHousingDTO, UpdateContractorHousingStatusDTO } from './contractor-housing.schema';

export class ContractorHousingService {
  /**
   * Create a new contractor housing allowance request
   */
  static async createRequest(employeeId: number, data: CreateContractorHousingDTO) {
    return withConnection(async (conn) => {
      const requestId = await ContractorHousingRepository.create(conn, employeeId, data);
      return ContractorHousingRepository.findById(conn, requestId);
    });
  }

  /**
   * Get all contractor housing requests (admin)
   */
  static async getAllRequests(limit: number = 50, offset: number = 0) {
    return withConnection(async (conn) => {
      return ContractorHousingRepository.findAll(conn, limit, offset);
    });
  }

  /**
   * Get contractor housing request by ID
   */
  static async getRequestById(id: number) {
    return withConnection(async (conn) => {
      return ContractorHousingRepository.findById(conn, id);
    });
  }

  /**
   * Get contractor housing requests for a specific employee
   */
  static async getEmployeeRequests(employeeId: number) {
    return withConnection(async (conn) => {
      return ContractorHousingRepository.findByEmployeeId(conn, employeeId);
    });
  }

  /**
   * Update contractor housing request status (admin)
   */
  static async updateRequestStatus(
    id: number,
    adminId: number,
    data: UpdateContractorHousingStatusDTO
  ) {
    return withConnection(async (conn) => {
      await ContractorHousingRepository.updateStatus(
        conn,
        id,
        data.status,
        adminId,
        data.adminNotes,
        data.rejectionReason
      );
      return ContractorHousingRepository.findById(conn, id);
    });
  }

  /**
   * Delete contractor housing request
   */
  static async deleteRequest(id: number) {
    return withConnection(async (conn) => {
      await ContractorHousingRepository.delete(conn, id);
    });
  }

  /**
   * Get request statistics
   */
  static async getStatistics() {
    return withConnection(async (conn) => {
      const [total, pending, approved, rejected] = await Promise.all([
        ContractorHousingRepository.countByStatus(conn),
        ContractorHousingRepository.countByStatus(conn, 'submitted'),
        ContractorHousingRepository.countByStatus(conn, 'approved'),
        ContractorHousingRepository.countByStatus(conn, 'rejected'),
      ]);

      return { total, pending, approved, rejected };
    });
  }
}

