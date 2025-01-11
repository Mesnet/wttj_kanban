import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initializeColumns,
  fetchCandidatesForColumn,
  handleCreateColumn,
  handleUpdateColumn,
  handleDeleteColumn
} from '../helpers/columnHelper'
import { ColumnState } from '../types'

// Mock functions
const mockSetColumnData = vi.fn()
const mockMutate = vi.fn()
const mockMutateAsync = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('columnHelper', () => {
  describe('initializeColumns', () => {
    it('should initialize columns correctly', () => {
      const columns = [
        { id: '1', name: 'To Do' },
        { id: '2', name: 'In Progress' },
      ]

      initializeColumns(columns, mockSetColumnData)

      expect(mockSetColumnData).toHaveBeenCalledWith({
        '1': { items: [], hasMore: true, page: 1, name: 'To Do' },
        '2': { items: [], hasMore: true, page: 1, name: 'In Progress' },
      })
    })
  })

  describe('fetchCandidatesForColumn', () => {
    it('should call mutate when conditions are met', () => {
      const columnData: ColumnState = {
        '1': { items: [], hasMore: true, page: 1, name: 'To Do' },
      }

      fetchCandidatesForColumn('1', 'job-123', columnData, { mutate: mockMutate })
      expect(mockMutate).toHaveBeenCalledWith({ jobId: 'job-123', columnId: '1' })
    })

    it('should not call mutate if hasMore is false', () => {
      const columnData: ColumnState = {
        '1': { items: [], hasMore: false, page: 1, name: 'To Do' },
      }

      fetchCandidatesForColumn('1', 'job-123', columnData, { mutate: mockMutate })
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  describe('handleCreateColumn', () => {
    it('should create a new column and update state', async () => {
      mockMutateAsync.mockResolvedValue({ id: '3', name: 'Done' })
      await handleCreateColumn('Done', { mutateAsync: mockMutateAsync }, mockSetColumnData)

      expect(mockSetColumnData).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('handleUpdateColumn', () => {
    it('should update a column name', async () => {
      mockMutateAsync.mockResolvedValue({ data: { name: 'Updated Name' } })

      await handleUpdateColumn('1', { name: 'Updated Name' }, { mutateAsync: mockMutateAsync }, mockSetColumnData)

      expect(mockSetColumnData).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('handleDeleteColumn', () => {
    it('should delete a column and update state', async () => {
      const columnData: ColumnState = {
        '1': { items: [], hasMore: true, page: 1, name: 'To Do' },
        '2': { items: [], hasMore: true, page: 1, name: 'In Progress' },
      }

      await handleDeleteColumn('1', { mutateAsync: mockMutateAsync }, mockSetColumnData, columnData)

      expect(mockSetColumnData).toHaveBeenCalledWith({
        '2': { items: [], hasMore: true, page: 1, name: 'In Progress' },
      })
    })
  })
})
