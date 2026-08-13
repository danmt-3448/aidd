import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardSpotlightSearchResults } from './board-spotlight-search-results'
import type { SpotlightNode } from './board-types'

const MOCK_NODES: SpotlightNode[] = [
  { receiverId: 'u1', name: 'Alice Nguyen', avatar: null, kudoCount: 15 },
  { receiverId: 'u2', name: 'Bob Tran', avatar: null, kudoCount: 8 },
  { receiverId: 'u3', name: 'Carol Le', avatar: null, kudoCount: 5 },
]

const MOCK_DROPDOWN_RECT = { top: 100, left: 50, width: 200 }

describe('BoardSpotlightSearchResults', () => {
  it('renders nothing when hasQuery is false', () => {
    const { container } = render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={false}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders empty-state "Không tìm thấy Sunner" when hasQuery=true and matches is empty', () => {
    render(
      <BoardSpotlightSearchResults
        matches={[]}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    expect(screen.getByText('Không tìm thấy Sunner')).toBeInTheDocument()
  })

  it('renders empty-state item with aria-disabled=true', () => {
    render(
      <BoardSpotlightSearchResults
        matches={[]}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    const option = screen.getByRole('option')
    expect(option).toHaveAttribute('aria-disabled', 'true')
    expect(option).toHaveAttribute('aria-selected', 'false')
  })

  it('renders match rows when hasQuery=true and matches exist', () => {
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    expect(screen.getByText('Alice Nguyen')).toBeInTheDocument()
    expect(screen.getByText('Bob Tran')).toBeInTheDocument()
    expect(screen.getByText('Carol Le')).toBeInTheDocument()
  })

  it('renders kudo count for each match', () => {
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    expect(screen.getByText('15 kudos')).toBeInTheDocument()
    expect(screen.getByText('8 kudos')).toBeInTheDocument()
    expect(screen.getByText('5 kudos')).toBeInTheDocument()
  })

  it('marks active index item with aria-selected=true', () => {
    const { rerender } = render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    const options = screen.getAllByRole('option')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onSelect with receiverId when a match is clicked', () => {
    const onSelect = vi.fn()
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={onSelect}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    const bobOption = screen.getByText('Bob Tran').closest('li')
    bobOption?.click()
    expect(onSelect).toHaveBeenCalledWith('u2')
  })

  it('calls onActiveChange when hovering over a match', () => {
    const onActiveChange = vi.fn()
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={onActiveChange}
        listId="test-list"
      />,
    )
    const carolOption = screen.getByText('Carol Le').closest('li')
    fireEvent.mouseEnter(carolOption!)
    expect(onActiveChange).toHaveBeenCalledWith(2)
  })

  it('renders listbox with correct aria-label', () => {
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-label', 'Kết quả tìm kiếm sunner')
  })

  it('renders listbox with correct id', () => {
    const listId = 'custom-list-id'
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId={listId}
      />,
    )
    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('id', listId)
  })

  it('renders all match rows with correct role="option"', () => {
    render(
      <BoardSpotlightSearchResults
        matches={MOCK_NODES}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={vi.fn()}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    const options = screen.getAllByRole('option')
    // 3 matches, each is an option
    expect(options).toHaveLength(3)
  })

  it('does not call onSelect for empty-state item when clicked', () => {
    const onSelect = vi.fn()
    render(
      <BoardSpotlightSearchResults
        matches={[]}
        hasQuery={true}
        activeIndex={-1}
        dropdownRect={MOCK_DROPDOWN_RECT}
        onSelect={onSelect}
        onActiveChange={vi.fn()}
        listId="test-list"
      />,
    )
    const emptyOption = screen.getByText('Không tìm thấy Sunner').closest('li')
    emptyOption?.click()
    // Empty state item should not trigger onSelect (cursor: default, aria-disabled)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
